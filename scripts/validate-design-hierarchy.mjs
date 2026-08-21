import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const app = readFileSync(join(repoRoot, "index.html"), "utf8");
const worker = readFileSync(join(repoRoot, "sw.js"), "utf8");
const failures = [];

const expectedTabs = ["home", "pets", "spend", "shared", "assets", "calendar", "fixed", "invest", "yearly", "db"];
const tabDefinition = app.match(/const TAB_DEFS=\[(.*?)\];/s)?.[1] || "";
const actualTabs = [...tabDefinition.matchAll(/\["([^"]+)",/g)].map(match => match[1]);
if (JSON.stringify(actualTabs) !== JSON.stringify(expectedTabs)) {
  failures.push(`탭 구성 불일치: ${actualTabs.join(", ")}`);
}

const requiredBuilders = [
  "buildHome", "buildSpend", "buildShared", "buildAssets", "buildCalendarView",
  "buildFixed", "buildInvest", "buildYearly", "buildDbTab", "buildPetRoom",
];
for (const builder of requiredBuilders) {
  if (!app.includes(`function ${builder}(`)) failures.push(`탭 빌더 누락: ${builder}`);
}

const hierarchyByTab = {
  home: ["home-budget-hero", "home-settle-card", "home-category-card"],
  spend: ["spend-hero-card", "spend-bill-card", "spend-card-usage"],
  shared: ["shared-hero-card", "shared-fixed-card", "shared-settlement-card"],
  assets: ["asset-hero", "asset-trend-card", "asset-composition-card"],
  calendar: ["calendar-month-nav", "calendar-board", "calendar-week-card"],
  fixed: ["fixed-hero", "fixed-due-card", "fixed-paid-card"],
  invest: ["invest-hero", "invest-market-card", "invest-holdings-card"],
  yearly: ["year-dashboard", "year-mode-chart-card", "year-monthly-card"],
  db: ["db-dashboard", "db-hero", "db-main-card"],
  pets: ["pet-page__hero", "pet-character-tabs", "pet-page__guide"],
};
for (const [tab, classes] of Object.entries(hierarchyByTab)) {
  for (const className of classes) {
    if (!app.includes(className)) failures.push(`${tab} 핵심 계층 누락: ${className}`);
  }
}

if (!app.includes("@media (prefers-reduced-motion:reduce)")) failures.push("앱 셸 모션감소 규칙 누락");
if (!app.includes('data-budget-mascot-stage')) failures.push("마스코트 전용 안전영역 누락");
if (!app.includes("나의 가계부 · v157")) failures.push("앱 버전 v157 표기 누락");
if (!worker.includes('const CACHE = "budget-v157"')) failures.push("서비스워커 v157 캐시 누락");

const globalFunctions = [...app.matchAll(/^function\s+([A-Za-z0-9_]+)\s*\(/gm)].map(match => match[1]);
const duplicates = [...new Set(globalFunctions.filter((name, index) => globalFunctions.indexOf(name) !== index))];
if (duplicates.length) failures.push(`전역 함수 중복: ${duplicates.join(", ")}`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "passed",
    version: "v157",
    tabs: actualTabs.length,
    builders: requiredBuilders.length,
    hierarchyChecks: Object.values(hierarchyByTab).flat().length,
    globalFunctions: globalFunctions.length,
  }));
}
