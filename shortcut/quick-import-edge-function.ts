// ─────────────────────────────────────────────────────────────
// Supabase Edge Function: quick-import
// iOS 단축어에서 카드앱 스크린샷을 받아 → Claude AI로 거래 추출 → 가계부에 자동 등록
// 설치 방법은 같은 폴더의 README.md 참고 (5분 소요)
// ─────────────────────────────────────────────────────────────
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-import-token",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });

// 연도 없는 날짜(07.05 등) 보정 포함 정규화
function normDate(v: unknown, thisYear: number): string | null {
  if (v == null || v === "") return null;
  let s = String(v).trim().replace(/[년월./]/g, "-").replace(/일/g, "").replace(/\s+/g, "").replace(/-+/g, "-").replace(/-$/, "");
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const today = new Date().toISOString().slice(0, 10);
    let out = `${thisYear}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    if (out > today) out = `${thisYear - 1}${out.slice(4)}`;
    return out;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    // 1) 토큰 확인 (단축어에만 넣어둔 비밀 문자열)
    const token = req.headers.get("x-import-token");
    if (!token || token !== Deno.env.get("IMPORT_TOKEN")) return json({ error: "unauthorized" }, 401);

    const { image_b64, media_type } = await req.json();
    if (!image_b64) return json({ error: "no image" }, 400);

    // 2) Claude Vision으로 거래 추출
    const thisYear = new Date().getFullYear();
    const PROMPT = `이 이미지는 카드/페이/은행 앱의 이용내역 스크린샷입니다. 보이는 모든 개별 거래를 추출해 JSON만 반환하세요:
{"items":[{"date":"YYYY-MM-DD","merchant":"가맹점명","amount":12345,"cancelled":false,"card":"카드이름(화면에 보일 때만)"}]}
규칙: 금액은 원화 숫자만(콤마·원 제거). 취소/승인취소 거래는 cancelled:true. 합계·총액·청구예정 줄은 제외. 연도가 안 보이면 ${thisYear}년으로 가정.`;
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: media_type || "image/png", data: image_b64 } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
    });
    if (!resp.ok) return json({ error: "AI 호출 실패: " + (await resp.text()).slice(0, 200) }, 502);
    const data = await resp.json();
    let txt = data.content?.find((c: { type: string }) => c.type === "text")?.text || "{}";
    const a = txt.indexOf("{"), b = txt.lastIndexOf("}");
    if (a >= 0 && b > a) txt = txt.slice(a, b + 1);
    txt = txt.replace(/(\d),(?=\d)/g, "$1");
    const items = (JSON.parse(txt).items || []).filter((it: { cancelled?: boolean }) => !it?.cancelled);
    if (!items.length) return json({ ok: true, added: 0, msg: "이미지에서 거래를 찾지 못했어요" });

    // 3) 중복 건너뛰고 저장 (서비스 롤 — 함수 안에서만 사용, 절대 앱에 노출 금지)
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const uid = Deno.env.get("OWNER_USER_ID")!;
    let added = 0, dup = 0;
    for (const it of items) {
      const amt = Math.round(Number(String(it.amount ?? "").replace(/[^\d.-]/g, "")) || 0);
      const date = normDate(it.date, thisYear);
      const mer = (it.merchant || "").trim();
      if (amt <= 0 || !date) continue;
      const q = sb.from("transactions").select("id").eq("user_id", uid).eq("date", date).eq("amount", amt).limit(1);
      const { data: ex } = mer ? await q.eq("merchant", mer) : await q;
      if (ex && ex.length) { dup++; continue; }
      const { error } = await sb.from("transactions").insert({
        user_id: uid, date, amount: amt, account: "개인", type: "소비(일시불)",
        category: "기타", merchant: mer || null,
        payment_method: (it.card || "").trim() || null,
        memo: "#단축어입력 (분류 확인 필요)",
      });
      if (!error) added++;
    }
    return json({ ok: true, added, dup, msg: `✅ ${added}건 등록${dup ? ` · 중복 ${dup}건 제외` : ""} — 앱에서 '#단축어입력' 검색해 카테고리를 확인해주세요` });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
