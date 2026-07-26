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
];
const requiredRuntimeActions = [...requiredAppEvents, "annual_review"];
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
if (!app.includes("나의 가계부 · v132")) failures.push("앱 버전 v132 표기 누락");
if (!worker.includes('const CACHE = "budget-v132"')) failures.push("서비스 워커 v132 캐시 누락");
if (!runtime.includes('"phase2h"')) failures.push("Phase 2H 애니메이션 파일명 규칙 누락");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "passed",
    appEvents: requiredAppEvents.length,
    runtimeActions: requiredRuntimeActions.length,
    version: "v132",
  }));
}
