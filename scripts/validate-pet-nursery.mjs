import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const repoRoot = new URL("../", import.meta.url).pathname;
const root = join(repoRoot, "assets/pet-v1");
const app = readFileSync(join(repoRoot, "index.html"), "utf8");
const worker = readFileSync(join(repoRoot, "sw.js"), "utf8");
const characters = ["huchu", "mayo", "jjajang"];
const states = ["idle", "eat", "sleep", "play", "groom", "sick", "love"];
const expectedDurations = [150, 170, 210, 300, 210, 170];
const failures = [];
let checkedFiles = 0;
let totalBytes = 0;

function fail(message) {
  failures.push(message);
}

function pngInfo(path) {
  const buffer = readFileSync(path);
  if (buffer.subarray(1, 4).toString() !== "PNG") throw new Error("PNG signature missing");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

function pngHasRealTransparency(path) {
  const opaque = execFileSync("identify", ["-format", "%[opaque]", path], { encoding: "utf8" }).trim();
  return opaque === "false";
}

function inspectAnimatedWebP(path) {
  const buffer = readFileSync(path);
  if (buffer.subarray(0, 4).toString() !== "RIFF" || buffer.subarray(8, 12).toString() !== "WEBP") {
    throw new Error("WebP RIFF header missing");
  }
  const durations = [];
  let width = 0;
  let height = 0;
  let hasAlpha = false;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const type = buffer.subarray(offset, offset + 4).toString();
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > buffer.length) throw new Error(`${type} chunk exceeds file boundary`);
    if (type === "VP8X") {
      hasAlpha = Boolean(buffer[data] & 0x10);
      width = 1 + buffer.readUIntLE(data + 4, 3);
      height = 1 + buffer.readUIntLE(data + 7, 3);
    } else if (type === "ANMF") {
      durations.push(buffer.readUIntLE(data + 12, 3));
    }
    offset = data + size + (size & 1);
  }
  return { width, height, hasAlpha, durations };
}

const manifestPath = join(root, "manifest.json");
if (!existsSync(manifestPath)) {
  fail("pet-v1 manifest missing");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.version !== "1.1.0" || manifest.state_schema_version !== 2) fail("manifest v1.1/schema v2 metadata missing");
  if (manifest.animation_count !== 21) fail("manifest animation_count must be 21");
  if (manifest.animations?.length !== 21) fail("manifest must list 21 animations");
  if (!manifest.principles?.no_death) fail("no-death care rule missing");
  if (!manifest.principles?.reset_requires_confirmation) fail("guarded reset rule missing");
  if (manifest.principles?.offline_decay_cap_hours !== 24) fail("offline decay cap must be 24 hours");
  if (manifest.features?.paw_hunt_daily_limit !== 3) fail("paw hunt manifest daily limit must be 3");
  if (manifest.features?.growth_album_milestones_xp?.length !== 6) fail("growth album manifest milestones must be 6");
  if (new Set((manifest.animations || []).map((item) => item.id)).size !== 21) fail("animation IDs must be unique");
}

for (const character of characters) {
  for (const state of states) {
    const id = `${character}_baby_${state}`;
    const paths = {
      source: join(root, `source/${id}_master_v01.png`),
      static: join(root, `static/${id}_frame_01_v01.png`),
      webp: join(root, `webp/${id}_512_v01.webp`),
    };
    for (const [kind, path] of Object.entries(paths)) {
      checkedFiles += 1;
      if (!existsSync(path)) {
        fail(`${kind} missing: ${path}`);
        continue;
      }
      const size = statSync(path).size;
      totalBytes += size;
      if (size < 100) fail(`${kind} is unexpectedly small: ${path}`);
    }
    if (existsSync(paths.source)) {
      const info = pngInfo(paths.source);
      if (info.width !== 1024 || info.height !== 1024) fail(`source canvas mismatch: ${id}`);
      if (![3, 4, 6].includes(info.colorType) || !pngHasRealTransparency(paths.source)) fail(`source alpha missing: ${id}`);
    }
    if (existsSync(paths.static)) {
      const info = pngInfo(paths.static);
      if (info.width !== 128 || info.height !== 128) fail(`fallback canvas mismatch: ${id}`);
      if (![4, 6].includes(info.colorType) || !pngHasRealTransparency(paths.static)) fail(`fallback alpha missing: ${id}`);
    }
    if (existsSync(paths.webp)) {
      try {
        const info = inspectAnimatedWebP(paths.webp);
        if (info.width !== 512 || info.height !== 512) fail(`WebP canvas mismatch: ${id}`);
        if (!info.hasAlpha) fail(`WebP alpha flag missing: ${id}`);
        if (JSON.stringify(info.durations) !== JSON.stringify(expectedDurations)) {
          fail(`WebP frame durations mismatch: ${id} (${info.durations.join(",")})`);
        }
      } catch (error) {
        fail(`WebP inspection failed: ${id} (${error.message})`);
      }
    }
  }
}

for (const character of characters) {
  for (const path of [
    join(repoRoot, `assets/mascot-v2/phase2a/webp/${character}_breathe_512_v01.webp`),
    join(repoRoot, `assets/mascot-v2/phase2a/static/${character}_breathe_frame_01_v01.png`),
  ]) {
    checkedFiles += 1;
    if (!existsSync(path)) fail(`adult handoff asset missing: ${path}`);
    else totalBytes += statSync(path).size;
  }
}

const runtimePath = join(root, "pet-nursery.js");
const viewPath = join(root, "pet-nursery-view.js");
const extrasPath = join(root, "pet-nursery-extras.js");
const cssPath = join(root, "pet-nursery.css");
for (const path of [runtimePath, viewPath, extrasPath, cssPath, join(root, "README.md")]) {
  checkedFiles += 1;
  if (!existsSync(path)) fail(`support file missing: ${path}`);
  else totalBytes += statSync(path).size;
}

if (existsSync(runtimePath)) {
  const store = new Map();
  const window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
    },
  };
  vm.runInNewContext(readFileSync(runtimePath, "utf8"), { window, console, Date });
  const api = window.BudgetPetNursery;
  if (!api) {
    fail("BudgetPetNursery API missing");
  } else {
    const now = Date.UTC(2026, 7, 16, 0, 0, 0);
    const initial = api.createInitialState("huchu", { now });
    if (api.VERSION !== 2 || initial.schemaVersion !== 2) fail("pet schema v2 migration missing");
    if (initial.stage !== "kitten" || initial.generation !== 1) fail("initial kitten state invalid");
    const migrated = api.normalizeState({ character: "mayo", needs: { fullness: 50 } }, now);
    if (migrated.needs.fullness !== 50 || migrated.needs.energy !== 86 || migrated.games.pawHuntPlays !== 0) fail("legacy pet state migration invalid");
    const afterOffline = api.tick(initial, now + 48 * 3600000);
    if (Math.round(afterOffline.needs.energy) !== 14) fail("24-hour offline decay cap invalid");
    const fed = api.applyAction(initial, "feed", now);
    if (!fed.ok || fed.state.xp !== 12 || fed.state.currentVisual !== "eat") fail("feed action invalid");
    const cooldown = api.applyAction(fed.state, "feed", now + 1000);
    if (cooldown.ok || cooldown.reason !== "cooldown") fail("action cooldown invalid");
    const played = api.applyAction(fed.state, "play", now + 1000);
    const petted = api.applyAction(played.state, "pet", now + 2000);
    const daily = api.getDailyCare(petted.state, now + 2000);
    if (!daily.complete || daily.completedCount !== 3) fail("daily care mission summary invalid");
    let gameState = api.createInitialState("jjajang", { now });
    const game1 = api.playPawHunt(gameState, true, now + 3000);
    const game2 = api.playPawHunt(game1.state, false, now + 4000);
    const game3 = api.playPawHunt(game2.state, true, now + 5000);
    const game4 = api.playPawHunt(game3.state, true, now + 6000);
    if (!game1.ok || game1.gainedXp !== 15 || !game2.ok || game2.gainedXp !== 5) fail("paw hunt XP reward invalid");
    if (!game3.ok || game3.remaining !== 0 || game4.ok || game4.reason !== "daily_limit") fail("paw hunt daily limit invalid");
    if (game3.state.games.pawHuntPlays !== 3 || game3.state.games.pawHuntWins !== 2) fail("paw hunt game stats invalid");
    const nextDay = api.normalizeState(game3.state, now + 86400000);
    if (nextDay.games.pawHuntPlays !== 0 || api.getDailyCare(petted.state, now + 86400000).completedCount !== 0) fail("daily pet progress reset invalid");
    const adult = api.normalizeState({ ...initial, xp: 1200 }, now);
    if (adult.stage !== "adult" || api.resolveAsset(adult).handoff !== "mascot-v2") fail("adult handoff invalid");
    if (api.getMilestones(initial).filter((item) => item.unlocked).length !== 1) fail("initial growth album lock state invalid");
    if (api.getMilestones(adult).filter((item) => item.unlocked).length !== 6) fail("adult growth album unlock state invalid");
    let rejected = false;
    try { api.resetToKitten(adult, "wrong", now); } catch (_error) { rejected = true; }
    if (!rejected) fail("unguarded reset was accepted");
    if (api.getResetToken("huchu") !== "후추 다시 키우기") fail("localized guarded reset token invalid");
    const reset = api.resetToKitten(adult, api.getResetToken("huchu"), now);
    if (reset.generation !== 2 || reset.stage !== "kitten") fail("guarded reset invalid");
    api.saveAll({ huchu: initial, mayo: api.createInitialState("mayo", { now }), jjajang: api.createInitialState("jjajang", { now }) });
    if (api.loadAll().mayo.character !== "mayo") fail("local state persistence invalid");
  }
}

if (existsSync(viewPath)) {
  const view = readFileSync(viewPath, "utf8");
  if (!view.includes("BudgetPetNurseryUI")) fail("nursery view mount API missing");
  if (!view.includes("petnurserychange")) fail("nursery change event missing");
  if (view.includes("innerHTML")) fail("nursery view must not inject HTML strings");
  if (!view.includes("refresh,")) fail("nursery view external reward refresh API missing");
}

if (existsSync(extrasPath)) {
  const extras = readFileSync(extrasPath, "utf8");
  for (const marker of ["BudgetPetNurseryExtras", "getDailyCare", "getMilestones", "playPawHunt", "petnurserychange"]) {
    if (!extras.includes(marker)) fail(`nursery extras marker missing: ${marker}`);
  }
  if (extras.includes("innerHTML")) fail("nursery extras must not inject HTML strings");
}

if (existsSync(cssPath)) {
  const css = readFileSync(cssPath, "utf8");
  for (const marker of [".pet-nursery__safe-stage", ".pet-nursery__actions", "prefers-reduced-motion"]) {
    if (!css.includes(marker)) fail(`nursery CSS marker missing: ${marker}`);
  }
  if (/position\s*:\s*(fixed|absolute)/.test(css)) fail("nursery CSS may not overlay app information");
}

for (const marker of [
  'href="./assets/pet-v1/pet-nursery.css"',
  'src="./assets/pet-v1/pet-nursery.js"',
  'src="./assets/pet-v1/pet-nursery-view.js"',
  'src="./assets/pet-v1/pet-nursery-extras.js"',
  '["pets","🐾 육성"]',
  "function buildPetRoom(",
  "function showPetResetDialog(",
  "가계부 데이터와 분리 저장",
  "ACTIVE_PET_EXTRAS",
]) {
  if (!app.includes(marker)) fail(`app nursery integration missing: ${marker}`);
}
if (!worker.includes("PET_RUNTIME_ASSETS")) fail("pet runtime offline asset expansion missing");
if (!worker.includes("PET_ADULT_HANDOFF_ASSETS")) fail("adult mascot handoff offline assets missing");
if (!worker.includes("pet-nursery-extras.js")) fail("pet extras offline support missing");
if (!worker.includes('const CACHE = "budget-v158"')) fail("pet integration cache version missing");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "passed",
    characters: characters.length,
    statesPerCharacter: states.length,
    animations: characters.length * states.length,
    adultHandoffAssets: characters.length * 2,
    extras: ["daily-care", "growth-album", "paw-hunt"],
    checkedFiles,
    totalBytes,
    offlineDecayCapHours: 24,
    guardedReset: true,
  }));
}
