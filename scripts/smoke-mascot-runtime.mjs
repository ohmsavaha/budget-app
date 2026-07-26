import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtimeModules) throw new Error("CODEX_PRIMARY_RUNTIME_NODE_MODULES가 설정되지 않았습니다.");
const { chromium } = require(join(runtimeModules, "playwright"));

const baseUrl = process.argv[2] || "http://127.0.0.1:8321";
const outputRoot = process.argv[3] || "/tmp";
const results = [];
const browser = await chromium.launch({ headless: true });

async function runViewport(name, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${baseUrl}/tests/mascot-runtime-smoke.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const image = document.querySelector(".budget-mascot-image");
    return image?.complete && image.naturalWidth > 0;
  });

  const stage = page.locator(".budget-mascot-stage");
  const dataCard = page.locator(".test-data");
  const stageBox = await stage.boundingBox();
  const dataBox = await dataCard.boundingBox();
  if (!stageBox || !dataBox || stageBox.y + stageBox.height > dataBox.y + 1) {
    throw new Error(`${name}: 마스코트 안전영역과 데이터 카드가 겹칩니다.`);
  }

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("budget-mascot", {
      detail: { action: "card_payment", character: "huchu" },
    }));
  });
  await page.waitForFunction(() =>
    document.querySelector(".budget-mascot-image")?.getAttribute("src")?.includes("huchu_card_payment"),
  );
  const animatedSrc = await page.locator(".budget-mascot-image").getAttribute("src");
  if (!animatedSrc?.endsWith(".webp")) throw new Error(`${name}: WebP 반응 자산이 재생되지 않았습니다.`);

  const screenshot = `${outputRoot}/phase3-mascot-${name}.png`;
  await page.screenshot({ path: screenshot, fullPage: true });

  await page.locator(".budget-mascot-toggle").click();
  if (!(await stage.evaluate((node) => node.classList.contains("is-disabled")))) {
    throw new Error(`${name}: 마스코트 숨기기 상태가 적용되지 않았습니다.`);
  }
  await page.locator(".budget-mascot-toggle").click();

  results.push({ name, viewport, screenshot, animatedSrc });
  await page.close();
}

await runViewport("mobile", { width: 390, height: 844 });
await runViewport("desktop", { width: 1280, height: 900 });

const reducedPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await reducedPage.emulateMedia({ reducedMotion: "reduce" });
await reducedPage.goto(`${baseUrl}/tests/mascot-runtime-smoke.html`, { waitUntil: "networkidle" });
await reducedPage.waitForFunction(() =>
  document.querySelector(".budget-mascot-image")?.getAttribute("src")?.endsWith(".png"),
);
results.push({
  name: "reduced-motion",
  src: await reducedPage.locator(".budget-mascot-image").getAttribute("src"),
});
await reducedPage.close();

await browser.close();
console.log(JSON.stringify({ status: "passed", results }));
