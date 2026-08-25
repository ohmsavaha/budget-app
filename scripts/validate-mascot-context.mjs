import { readFileSync } from "node:fs";
import vm from "node:vm";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const app = readFileSync(join(repoRoot, "index.html"), "utf8");
const start = app.indexOf("function mascotShiftDate(");
const end = app.indexOf("function showAdd(", start);
if (start < 0 || end < 0) throw new Error("Phase 2O 판정 함수를 찾지 못했어요.");

const sandbox = {
  S: { txns: [], prevTxns: [], budget: 0, curYm: "2026-08" },
  ym: value => String(value || "").slice(0, 7),
  kindOf: type => type === "소비(일시불)" ? "spend" : "other",
  isExcludedSpend: () => false,
  isInternalTransfer: () => false,
  calcStatsFor: txns => ({ pNet: txns.reduce((sum, txn) => sum + (txn.account === "공용" ? 0 : Number(txn.amount) || 0), 0) }),
  personalFixedExp: () => 0,
  mascotExpenseAction: (category, account) => account === "공용" ? "shared_expense_logged" : ({
    "장보기": "grocery_logged",
    "외식/배달": "meal_logged",
  }[category] || "card_payment"),
};
vm.createContext(sandbox);
vm.runInContext(`${app.slice(start, end)}\nglobalThis.pickMascotContext=mascotContextualExpenseAction;`, sandbox);

const expense = (date, category = "장보기", merchant = "동네마트", amount = 10000, account = "개인") => ({
  date, category, merchant, amount, account, type: "소비(일시불)", payment_method: "현금",
});
const pick = detail => sandbox.pickMascotContext({ payment: "현금", ...detail });
const reset = ({ txns = [], prevTxns = [], budget = 0 } = {}) => {
  sandbox.S.txns = txns;
  sandbox.S.prevTxns = prevTxns;
  sandbox.S.budget = budget;
  sandbox.S.curYm = "2026-08";
};
const expect = (name, actual, expected) => {
  if (actual !== expected) throw new Error(`${name}: ${expected} 대신 ${actual}`);
};

reset();
expect("공용 지출", pick({ category:"장보기", account:"공용", amount:10000, date:"2026-08-21", merchant:"마트" }), "shared_expense_logged");

reset({ txns:[expense("2026-08-20", "장보기", "마트", 900)], budget:1000 });
expect("예산 100%", pick({ category:"장보기", account:"개인", amount:100, date:"2026-08-21", merchant:"마트" }), "budget_exceeded");

reset({ txns:[expense("2026-08-20", "장보기", "마트", 700)], budget:1000 });
expect("예산 80%", pick({ category:"장보기", account:"개인", amount:100, date:"2026-08-21", merchant:"마트" }), "budget_warning");

reset({ txns:[expense("2026-08-20", "장보기", "마트", 200)], budget:1000 });
expect("예산 25% 체크포인트", pick({ category:"장보기", account:"개인", amount:50, date:"2026-08-21", merchant:"마트" }), "budget_checkpoint_logged");

reset();
expect("큰 지출", pick({ category:"장보기", account:"개인", amount:150000, date:"2026-08-21", merchant:"가구점" }), "large_expense_logged");

reset({ txns:[expense("2026-08-19"), expense("2026-08-20")] });
expect("3일 연속", pick({ category:"장보기", account:"개인", amount:10000, date:"2026-08-21", merchant:"마트" }), "record_streak_logged");

reset({ txns:[expense("2026-08-18")] });
expect("하루 첫 기록", pick({ category:"장보기", account:"개인", amount:10000, date:"2026-08-21", merchant:"마트" }), "day_first_logged");

reset({ txns:[expense("2026-08-21", "외식/배달", "식당")] });
expect("이달 첫 카테고리", pick({ category:"장보기", account:"개인", amount:10000, date:"2026-08-21", merchant:"마트" }), "category_first_logged");

reset({ txns:[expense("2026-08-21"), expense("2026-08-18")], prevTxns:[expense("2026-07-20")] });
expect("익숙한 사용처", pick({ category:"장보기", account:"개인", amount:10000, date:"2026-08-21", merchant:"동네마트" }), "familiar_place_logged");

reset({ txns:[expense("2026-08-21")], prevTxns:[] });
expect("카테고리 기본", pick({ category:"장보기", account:"개인", amount:10000, date:"2026-08-21", merchant:"새마트" }), "grocery_logged");

console.log(JSON.stringify({ status:"passed", scenarios:10, version:"v163" }));
