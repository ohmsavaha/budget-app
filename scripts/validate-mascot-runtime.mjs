import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const runtimePath = join(repoRoot, "assets/mascot-v2/mascot-runtime.js");
const source = readFileSync(runtimePath, "utf8");
const characters = ["huchu", "mayo", "jjajang"];
const phases = ["phase2a", "phase2b", "phase2c", "phase2d", "phase2e"];
const failures = [];
let checked = 0;
let totalBytes = 0;

for (const phase of phases) {
  const block = source.match(new RegExp(`${phase}: new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!block) {
    failures.push(`런타임에서 ${phase} 동작 목록을 찾지 못했습니다.`);
    continue;
  }
  const actions = [...block[1].matchAll(/"([a-z0-9_]+)"/g)].map((match) => match[1]);
  for (const character of characters) {
    for (const action of actions) {
      const animatedSuffix = ["phase2a", "phase2b", "phase2c"].includes(phase)
        ? "_512_v01.webp"
        : "_v01.webp";
      const paths = [
        join(repoRoot, `assets/mascot-v2/${phase}/webp/${character}_${action}${animatedSuffix}`),
        join(repoRoot, `assets/mascot-v2/${phase}/static/${character}_${action}_frame_01_v01.png`),
      ];
      for (const path of paths) {
        checked += 1;
        if (!existsSync(path)) failures.push(`누락: ${path}`);
        else {
          const size = statSync(path).size;
          totalBytes += size;
          if (size < 100) failures.push(`비정상적으로 작은 파일: ${path} (${size} bytes)`);
        }
      }
    }
  }
}

const phase2fManifestPath = join(repoRoot, "assets/mascot-v2/phase2f/manifest.json");
if (!existsSync(phase2fManifestPath)) {
  failures.push(`누락: ${phase2fManifestPath}`);
} else {
  const phase2f = JSON.parse(readFileSync(phase2fManifestPath, "utf8"));
  for (const animation of phase2f.animations || []) {
    const { actor, action } = animation;
    const paths = [
      join(repoRoot, `assets/mascot-v2/phase2f/webp/${actor}_${action}_512_v01.webp`),
      join(repoRoot, `assets/mascot-v2/phase2f/static/${actor}_${action}_frame_01_v01.png`),
    ];
    for (const path of paths) {
      checked += 1;
      if (!existsSync(path)) failures.push(`누락: ${path}`);
      else {
        const size = statSync(path).size;
        totalBytes += size;
        if (size < 100) failures.push(`비정상적으로 작은 파일: ${path} (${size} bytes)`);
      }
    }
  }
}

for (const character of characters) {
  const master = join(
    repoRoot,
    `assets/mascot-v2/phase2a/static/${character}_master_front_sit_v01.png`,
  );
  checked += 1;
  if (!existsSync(master)) failures.push(`정적 마스터 누락: ${master}`);
  else totalBytes += statSync(master).size;
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "passed",
    checkedFiles: checked,
    totalBytes,
    phases: phases.length + 1,
    characters: characters.length,
  }));
}
