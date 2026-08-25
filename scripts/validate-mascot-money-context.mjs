import { readFileSync } from "node:fs";
import vm from "node:vm";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const app = readFileSync(join(repoRoot, "index.html"), "utf8");
const start = app.indexOf("const INCOME_MASCOT_BY_CATEGORY");
const end = app.indexOf("function showAdd(", start);
if (start < 0 || end < 0) throw new Error("Phase 2P 금융 맥락 판정 함수를 찾지 못했어요.");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`${app.slice(start, end)}\nglobalThis.pickMoneyMascot=mascotMoneyFlowAction;`, sandbox);

const expect = (name, actual, expected) => {
  if (actual !== expected) throw new Error(`${name}: ${expected} 대신 ${actual}`);
};
const pick = (type, category) => sandbox.pickMoneyMascot(type, category);

expect("근로수입", pick("수입", "근로수입"), "salary_income_logged");
expect("기타수입", pick("수입", "기타수입"), "extra_income_logged");
expect("미분류 수입", pick("수입", "기타"), "extra_income_logged");
expect("정산환급", pick("정산환급", "금융/이체"), "settlement_refund_logged");
expect("구매 환불", pick("환불/취소", "쇼핑"), "refund");
expect("저축 납입", pick("저축/적금", "금융/이체"), "savings_progress");
expect("공용입금 보존", pick("공용입금", "금융/이체"), null);
expect("일반지출 보존", pick("소비(일시불)", "장보기"), null);

console.log(JSON.stringify({ status:"passed", scenarios:8, version:"v163" }));
