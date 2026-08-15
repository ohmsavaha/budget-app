import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const app = readFileSync(join(repoRoot, "index.html"), "utf8");
const runtime = readFileSync(join(repoRoot, "assets/mascot-v2/mascot-runtime.js"), "utf8");
const worker = readFileSync(join(repoRoot, "sw.js"), "utf8");

const requiredAppEvents = [
  "month_close",
  "backup_complete",
  "restore_complete",
  "notification_ready",
  "card_bill_review",
  "installment_plan",
  "duplicate_review",
  "import_review",
  "goal_achieved",
  "account_balance_check",
  "recurring_found",
  "report_share",
  "calendar_export",
  "group_month_review",
  "group_plan_next",
  "shopping_item_add",
  "purchase_complete",
  "repurchase_pick",
  "product_register",
  "price_record",
  "price_compare",
  "loan_plan",
  "loan_progress",
  "savings_maturity",
  "account_link",
  "investment_snapshot",
  "holding_add",
  "shared_plan_saved",
  "split_created",
  "group_shopping_plan",
  "budget_set",
  "lowest_price",
  "emergency_fund",
  "debt_payoff",
  "joint_settlement",
  "fixed_plan_saved",
  "fixed_plan_updated",
  "fixed_archived",
  "fixed_reactivated",
  "shared_fixed_saved",
  "expense_excluded",
  "transaction_corrected",
  "networth_goal",
  "investment_note",
  "market_refresh",
  "portfolio_repaired",
  "classification_rule_saved",
  "fixed_schedule_adjusted",
  "investment_trade_logged",
  "group_fixed_plan",
  "group_goal_map",
];
const requiredRuntimeActions = [
  ...requiredAppEvents,
  "annual_review",
  "group_household_inventory",
];
const failures = [];

for (const action of requiredAppEvents) {
  if (!app.includes(`"${action}"`)) {
    failures.push(`index.html 이벤트 누락: ${action}`);
  }
}
for (const action of requiredRuntimeActions) {
  if (!runtime.includes(`"${action}"`)) {
    failures.push(`런타임 동작 누락: ${action}`);
  }
}
const sharedTransactionSheet = app.slice(app.indexOf("function showAddDeposit()"), app.indexOf("function showDepositGoal()"));
if (sharedTransactionSheet.includes('mascotEvent("shared_fixed_saved"')) failures.push("일반 공용 입출금에 공용 고정비 동작이 섞여 있어요");
if (sharedTransactionSheet.includes('mascotEvent("group_fixed_plan"')) failures.push("일반 공용 입출금에 고정비 그룹 동작이 섞여 있어요");
const fixedAddSheet = app.slice(app.indexOf("function showAddFixed("), app.indexOf("function showEditFixed("));
if (!fixedAddSheet.includes('selAcc==="공용"')) failures.push("공용 고정비 신규 저장의 전용 분기 누락");
const settlementHelper = app.slice(app.indexOf("function buildRecent()"), app.indexOf("function showSearch("));
if (!settlementHelper.includes("splitError") || !settlementHelper.includes("transactionError")) failures.push("정산 도우미 실패 시 성공 동작 차단 누락");
const monthlyBudgetEditor = app.slice(app.indexOf("const bdBtn="), app.indexOf("const card=", app.indexOf("const bdBtn=")));
if (!monthlyBudgetEditor.includes("nextBudget") || !monthlyBudgetEditor.includes('mascotEvent("budget_set"')) failures.push("월 총예산 저장 성공 동작 누락");
if (monthlyBudgetEditor.indexOf("S.budget=nextBudget") < monthlyBudgetEditor.indexOf("if(error)")) failures.push("월 총예산 저장 실패 시 화면 값 변경 차단 누락");
const sharedDepositCorrection = app.slice(app.indexOf("// ③-B"), app.indexOf("// ── 생활비 입금 섹션"));
if (!sharedDepositCorrection.includes('mascotEvent("shared_deposit"')) failures.push("이체→공용입금 교정 성공 동작 누락");
const directHoldingAdd = app.slice(app.indexOf("const addBtn=h(\"button\"", app.indexOf("function showHoldings")), app.indexOf("const fetchBtn=", app.indexOf("function showHoldings")));
if (!directHoldingAdd.includes("saveHoldings(holdings)") || !directHoldingAdd.includes('mascotEvent("holding_add"')) failures.push("직접 투자 종목 추가 성공 동작 누락");
const yearlyView = app.slice(app.indexOf("function buildYearly()"), app.indexOf("// ── 거래 검색 ──"));
for (const className of ["year-dashboard", "year-hero", "year-cashflow-card", "year-savings-card", "year-quarter-card", "year-mode-chart-card", "year-mode-card", "year-calendar-card", "year-monthly-card"]) {
  if (!yearlyView.includes(className)) failures.push(`연간 화면 계층 클래스 누락: ${className}`);
}
const dbView = app.slice(app.indexOf("function buildDbTab()"), app.indexOf("function showBillDateSort()"));
for (const className of ["db-dashboard", "db-hero", "db-summary-grid", "db-main-card", "db-toolbar", "db-category-rail", "db-product-list", "db-product-row", "db-price-status"]) {
  if (!dbView.includes(className)) failures.push(`품목 DB 화면 계층 클래스 누락: ${className}`);
}
const investmentRefresh = app.slice(app.indexOf("refreshBtn.onclick=async()=>"), app.indexOf("const manageBtn=", app.indexOf("refreshBtn.onclick=async()=>")));
if (!investmentRefresh.includes("[시세갱신실패]") || !investmentRefresh.includes("finally") || !investmentRefresh.includes("refreshBtn.disabled=false")) failures.push("투자 시세 갱신 실패 복구 누락");
const investmentRepair = app.slice(app.indexOf("if(hasBad){"), app.indexOf("const diagBtn=", app.indexOf("if(hasBad){")));
if (!investmentRepair.includes("[평가액정리실패]") || !investmentRepair.includes("finally") || !investmentRepair.includes("fixBtn.disabled=false")) failures.push("투자 평가액 정리 실패 복구 누락");
if (!app.includes("나의 가계부 · v146")) failures.push("앱 버전 v146 표기 누락");
if (!worker.includes('const CACHE = "budget-v146"')) failures.push("서비스 워커 v146 캐시 누락");
if (!runtime.includes('"phase2h"')) failures.push("Phase 2H 애니메이션 파일명 규칙 누락");
if (!runtime.includes('"phase2i"')) failures.push("Phase 2I 애니메이션 파일명 규칙 누락");
if (!runtime.includes('"phase2k"')) failures.push("Phase 2K 애니메이션 파일명 규칙 누락");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "passed",
    appEvents: requiredAppEvents.length,
    runtimeActions: requiredRuntimeActions.length,
    version: "v146",
  }));
}
