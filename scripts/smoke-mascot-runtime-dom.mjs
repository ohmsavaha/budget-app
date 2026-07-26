import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const testModules = process.env.DOM_TEST_NODE_MODULES || "/tmp/humajja-dom-test/node_modules";
const { parseHTML } = require(join(testModules, "linkedom"));
const { window } = parseHTML(`
  <!doctype html>
  <html><body data-budget-tab="home"><div data-budget-mascot-stage></div></body></html>
`);

const storage = new Map();
const localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
const media = {
  matches: false,
  addEventListener() {},
  removeEventListener() {},
};

window.matchMedia = () => media;
window.localStorage = localStorage;
Object.assign(globalThis, {
  window,
  document: window.document,
  localStorage,
  MutationObserver: window.MutationObserver,
  CustomEvent: window.CustomEvent,
  Element: window.Element,
  HTMLElement: window.HTMLElement,
});

const runtimeUrl = pathToFileURL(
  join(new URL("../", import.meta.url).pathname, "assets/mascot-v2/mascot-runtime.js"),
);
await import(`${runtimeUrl.href}?smoke=${Date.now()}`);
await new Promise((resolve) => setTimeout(resolve, 0));

const stage = document.querySelector("[data-budget-mascot-stage]");
const image = stage?.querySelector(".budget-mascot-image");
if (!stage?.classList.contains("budget-mascot-stage")) throw new Error("안전영역 초기화 실패");
if (!image?.getAttribute("src")?.includes("mayo_breathe")) throw new Error("홈 대기 동작 실패");

window.dispatchEvent(new window.CustomEvent("budget-mascot", {
  detail: { action: "card_payment", character: "huchu", duration: 10 },
}));
if (!image.getAttribute("src")?.includes("huchu_card_payment")) throw new Error("카드 결제 반응 실패");
if (stage.dataset.state !== "reacting") throw new Error("반응 상태 표시 실패");

window.BudgetMascot.play({ action: "head_tilt", character: "mayo", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2f/webp/mayo_head_tilt_512")) {
  throw new Error("Phase 2F 생활 동작 실패");
}

window.BudgetMascot.play({ action: "group_cuddle", character: "group", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2f/webp/group_group_cuddle_512")) {
  throw new Error("Phase 2F 그룹 동작 실패");
}

window.BudgetMascot.play({ action: "fixed_due_check", character: "mayo", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2g/webp/mayo_fixed_due_check_512")) {
  throw new Error("Phase 2G 고정비 동작 실패");
}

window.BudgetMascot.play({ action: "group_highfive", character: "group", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2g/webp/group_group_highfive_512")) {
  throw new Error("Phase 2G 그룹 동작 실패");
}

window.BudgetMascot.play({ action: "backup_complete", character: "huchu", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2h/webp/huchu_backup_complete_512")) {
  throw new Error("Phase 2H 데이터 안전 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "group_month_review", character: "group", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2h/webp/group_group_month_review_512")) {
  throw new Error("Phase 2H 그룹 동작 실패");
}

const toggle = stage.querySelector(".budget-mascot-toggle");
toggle.click();
if (!stage.classList.contains("is-disabled")) throw new Error("숨기기 실패");
toggle.click();
if (stage.classList.contains("is-disabled")) throw new Error("다시 보기 실패");

media.matches = true;
window.BudgetMascot.play({ action: "head_tilt", character: "jjajang", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2f/static/jjajang_head_tilt_frame_01")) {
  throw new Error("Phase 2F 모션 감소 정적 대체 실패");
}
window.BudgetMascot.play({ action: "market_shelter", character: "mayo", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2g/static/mayo_market_shelter_frame_01")) {
  throw new Error("Phase 2G 모션 감소 정적 대체 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));
window.BudgetMascot.play({ action: "calendar_export", character: "mayo", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2h/static/mayo_calendar_export_frame_01")) {
  throw new Error("Phase 2H 모션 감소 정적 대체 실패");
}
window.BudgetMascot.play({ action: "refund", character: "jjajang", duration: 10 });
if (!image.getAttribute("src")?.endsWith(".png")) throw new Error("모션 감소 정적 대체 실패");

window.BudgetMascot.setEnabled(false);

console.log(JSON.stringify({
  status: "passed",
  idle: "mayo_breathe",
  reaction: "huchu_card_payment",
  reducedMotion: "jjajang_refund_frame_01",
  phase2f: "head_tilt + group_cuddle",
  phase2g: "fixed_due_check + group_highfive + market_shelter",
  phase2h: "backup_complete + group_month_review + calendar_export",
  toggle: "passed",
}));
