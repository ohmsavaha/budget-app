import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const app = readFileSync(join(repoRoot, "index.html"), "utf8");
const start = app.indexOf("async function deleteRowChecked(");
const end = app.indexOf("\n}", start);
assert.ok(start >= 0 && end > start, "deleteRowChecked 헬퍼를 찾지 못했어요");
const helperSource = app.slice(start, end + 2);

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

for (const marker of ["[품목삭제실패]", "[가격삭제실패]", "[거래삭제실패]", "[더치페이삭제실패]"]) {
  assert.ok(app.includes(marker), `삭제 실패 복구 누락: ${marker}`);
}

console.log(JSON.stringify({ status: "passed", scenarios: 3, guardedFlows: 4, version: "v152" }));
