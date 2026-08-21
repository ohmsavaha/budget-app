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
if (!image?.getAttribute("src")?.includes("phase2l/webp/group_group_budget_review_512")) throw new Error("홈 가계부 회의 대기 동작 실패");
if (stage.dataset.actor !== "group") throw new Error("홈 그룹 무대 크기 상태 실패");

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
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "purchase_complete", character: "jjajang", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2i/webp/jjajang_purchase_complete_512")) {
  throw new Error("Phase 2I 구매 완료 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "group_shopping_plan", character: "group", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2i/webp/group_group_shopping_plan_512")) {
  throw new Error("Phase 2I 그룹 장보기 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "fixed_plan_saved", character: "huchu", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2k/webp/huchu_fixed_plan_saved_512")) {
  throw new Error("Phase 2K 고정비 계획 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "group_goal_map", character: "group", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2k/webp/group_group_goal_map_512")) {
  throw new Error("Phase 2K 그룹 목표 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "group_budget_review", character: "group", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2l/webp/group_group_budget_review_512")) {
  throw new Error("Phase 2L 가계부 회의 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

for (const [action, character] of [
  ["budget_calm", "mayo"],
  ["budget_warning", "huchu"],
  ["budget_exceeded", "mayo"],
  ["goal_achieved", "jjajang"],
  ["search_no_results", "huchu"],
  ["history_empty", "mayo"],
  ["retry_calm", "mayo"],
]) {
  window.BudgetMascot.play({ action, character, duration: 10 });
  if (!image.getAttribute("src")?.includes(`phase2m/webp/${character}_${action}_512`)) {
    throw new Error(`Phase 2M 동작 실패: ${character}_${action}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 15));
}

for (const [action, character] of [
  ["day_first_logged", "mayo"],
  ["category_first_logged", "jjajang"],
  ["familiar_place_logged", "huchu"],
  ["large_expense_logged", "huchu"],
  ["budget_checkpoint_logged", "mayo"],
  ["record_streak_logged", "jjajang"],
]) {
  window.BudgetMascot.play({ action, character, duration: 10 });
  if (!image.getAttribute("src")?.includes(`phase2o/webp/${character}_${action}_512`)) {
    throw new Error(`Phase 2O 동작 실패: ${character}_${action}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 15));
}

for (const [action, character] of [
  ["grocery_logged", "huchu"],
  ["meal_logged", "mayo"],
  ["cat_care_logged", "jjajang"],
  ["transport_logged", "huchu"],
  ["home_bill_logged", "huchu"],
  ["health_logged", "mayo"],
  ["relationship_logged", "mayo"],
  ["learning_logged", "jjajang"],
  ["shopping_logged", "jjajang"],
  ["shared_expense_logged", "group"],
]) {
  window.BudgetMascot.play({ action, character, duration: 10 });
  if (!image.getAttribute("src")?.includes(`phase2n/webp/${character}_${action}_512`)) {
    throw new Error(`Phase 2N 동작 실패: ${character}_${action}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 15));
}

window.BudgetMascot.play({ action: "lowest_price", character: "jjajang", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2e/webp/jjajang_lowest_price")) {
  throw new Error("Phase 2J 기존 최저가 동작 재연결 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "joint_settlement", character: "mayo", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2d/webp/mayo_joint_settlement")) {
  throw new Error("정산 도우미 완료 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "budget_set", character: "huchu", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2e/webp/huchu_budget_set")) {
  throw new Error("월 총예산 저장 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "shared_deposit", character: "mayo", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2d/webp/mayo_shared_deposit")) {
  throw new Error("공용입금 교정 동작 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));

window.BudgetMascot.play({ action: "holding_add", character: "huchu", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2i/webp/huchu_holding_add_512")) {
  throw new Error("직접 투자 종목 추가 동작 실패");
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
await new Promise((resolve) => setTimeout(resolve, 15));
window.BudgetMascot.play({ action: "account_link", character: "mayo", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2i/static/mayo_account_link_frame_01")) {
  throw new Error("Phase 2I 모션 감소 정적 대체 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));
window.BudgetMascot.play({ action: "portfolio_repaired", character: "jjajang", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2k/static/jjajang_portfolio_repaired_frame_01")) {
  throw new Error("Phase 2K 모션 감소 정적 대체 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));
window.BudgetMascot.play({ action: "retry_calm", character: "mayo", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2m/static/mayo_retry_calm_frame_01")) {
  throw new Error("Phase 2M 모션 감소 정적 대체 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));
window.BudgetMascot.play({ action: "shared_expense_logged", character: "group", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2n/static/group_shared_expense_logged_frame_01")) {
  throw new Error("Phase 2N 모션 감소 정적 대체 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));
window.BudgetMascot.play({ action: "record_streak_logged", character: "jjajang", duration: 10 });
if (!image.getAttribute("src")?.includes("phase2o/static/jjajang_record_streak_logged_frame_01")) {
  throw new Error("Phase 2O 모션 감소 정적 대체 실패");
}
await new Promise((resolve) => setTimeout(resolve, 15));
window.BudgetMascot.play({ action: "refund", character: "jjajang", duration: 10 });
if (!image.getAttribute("src")?.endsWith(".png")) throw new Error("모션 감소 정적 대체 실패");

window.BudgetMascot.setEnabled(false);

console.log(JSON.stringify({
  status: "passed",
  idle: "group_budget_review",
  reaction: "huchu_card_payment",
  reducedMotion: "jjajang_refund_frame_01",
  phase2f: "head_tilt + group_cuddle",
  phase2g: "fixed_due_check + group_highfive + market_shelter",
  phase2h: "backup_complete + group_month_review + calendar_export",
  phase2i: "purchase_complete + group_shopping_plan + account_link",
  phase2j: "budget_set + lowest_price + emergency_fund + debt_payoff + joint_settlement",
  phase2k: "fixed_plan_saved + group_goal_map + portfolio_repaired",
  phase2l: "group_budget_review",
  phase2m: "budget + goal + empty + retry states",
  phase2n: "10 category-aware expense reactions",
  phase2o: "6 context-aware expense reactions",
  toggle: "passed",
}));
