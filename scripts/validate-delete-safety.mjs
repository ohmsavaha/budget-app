import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const app = readFileSync(join(repoRoot, "index.html"), "utf8");
function sourceOf(name) {
  const start = app.indexOf(`async function ${name}(`);
  const end = app.indexOf("\n}", start);
  assert.ok(start >= 0 && end > start, `${name} 헬퍼를 찾지 못했어요`);
  return app.slice(start, end + 2);
}
const helperSource = sourceOf("deleteRowChecked");
const batchHelperSource = sourceOf("deleteRowsChecked");

function makeDelete(result) {
  const calls = [];
  const chain = {
    delete() { calls.push(["delete"]); return chain; },
    eq(column, value) { calls.push(["eq", column, value]); return chain; },
    select(column) { calls.push(["select", column]); return chain; },
    async single() { calls.push(["single"]); return result; },
  };
  const sb = { from(table) { calls.push(["from", table]); return chain; } };
  const fn = new Function("sb", `${helperSource}; return deleteRowChecked;`)(sb);
  return { fn, calls };
}

{
  const { fn, calls } = makeDelete({ data: { id: "row-1" }, error: null });
  assert.deepEqual(await fn("products", "row-1"), { id: "row-1" });
  assert.deepEqual(calls, [
    ["from", "products"], ["delete"], ["eq", "id", "row-1"], ["select", "id"], ["single"],
  ]);
}

{
  const expected = new Error("network down");
  const { fn } = makeDelete({ data: null, error: expected });
  await assert.rejects(() => fn("transactions", "row-2"), expected);
}

{
  const { fn } = makeDelete({ data: null, error: null });
  await assert.rejects(() => fn("dutch_splits", "row-3"), /삭제된 항목을 확인하지 못했어요/);
}

function makeBatch(result) {
  const calls = [];
  const query = { async select(column) { calls.push(["select", column]); return result; } };
  const fn = new Function(`${batchHelperSource}; return deleteRowsChecked;`)();
  return { fn, query, calls };
}

{
  const { fn, query, calls } = makeBatch({ data: [{ id: "a" }, { id: "b" }], error: null });
  assert.deepEqual(await fn(query, ["a", "b"]), [{ id: "a" }, { id: "b" }]);
  assert.deepEqual(calls, [["select", "id"]]);
}

{
  const { fn, query } = makeBatch({ data: [{ id: "a" }], error: null });
  try {
    await fn(query, ["a", "b"]);
    assert.fail("부분 삭제를 성공 처리했어요");
  } catch (error) {
    assert.deepEqual(error.deletedIds, ["a"]);
    assert.deepEqual(error.missingIds, ["b"]);
  }
}

{
  const expected = new Error("batch network down");
  const { fn, query } = makeBatch({ data: null, error: expected });
  await assert.rejects(() => fn(query, ["a", "b"]), expected);
}

for (const marker of ["[품목삭제실패]", "[가격삭제실패]", "[거래삭제실패]", "[더치페이삭제실패]", "[장바구니삭제실패]", "[고정비삭제실패]", "[투자종목삭제실패]"]) {
  assert.ok(app.includes(marker), `삭제 실패 복구 누락: ${marker}`);
}
assert.ok((app.match(/deleteRowsChecked\(/g)||[]).length >= 3, "일괄 삭제 검증 연결 누락");
assert.ok((app.match(/deleteRowChecked\("transactions"/g)||[]).length >= 3, "거래 단건 삭제 검증 연결 누락");
for (const table of ["shopping_items", "fixed_costs", "investment_holdings", "loans"]) assert.ok(app.includes(`deleteRowChecked("${table}"`), `${table} 삭제 결과 확인 누락`);

console.log(JSON.stringify({ status: "passed", scenarios: 6, guardedFlows: 12, version: "v158" }));
