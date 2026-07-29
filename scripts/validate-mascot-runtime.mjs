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

function inspectAnimatedWebP(path) {
  const buffer = readFileSync(path);
  if (buffer.subarray(0, 4).toString() !== "RIFF" || buffer.subarray(8, 12).toString() !== "WEBP") {
    throw new Error("WebP RIFF 헤더가 아닙니다.");
  }
  const durations = [];
  let width = 0;
  let height = 0;
  let hasAlpha = false;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const type = buffer.subarray(offset, offset + 4).toString();
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > buffer.length) throw new Error(`${type} 청크가 파일 경계를 벗어났습니다.`);
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

const manifestPhases = ["phase2f", "phase2g", "phase2h", "phase2i", "phase2k"];
for (const phase of manifestPhases) {
  const manifestPath = join(repoRoot, `assets/mascot-v2/${phase}/manifest.json`);
  if (!existsSync(manifestPath)) {
    failures.push(`누락: ${manifestPath}`);
  } else {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    for (const animation of manifest.animations || []) {
      const { actor, action } = animation;
      const paths = [
        join(repoRoot, `assets/mascot-v2/${phase}/webp/${actor}_${action}_512_v01.webp`),
        join(repoRoot, `assets/mascot-v2/${phase}/static/${actor}_${action}_frame_01_v01.png`),
      ];
      for (const path of paths) {
        checked += 1;
        if (!existsSync(path)) failures.push(`누락: ${path}`);
        else {
          const size = statSync(path).size;
          totalBytes += size;
          if (size < 100) failures.push(`비정상적으로 작은 파일: ${path} (${size} bytes)`);
          if (["phase2i", "phase2k"].includes(phase) && path.endsWith(".webp")) {
            try {
              const info = inspectAnimatedWebP(path);
              const expectedDurations = [150, 170, 210, 300, 210, 170];
              if (info.width !== 512 || info.height !== 512) {
                failures.push(`${phase} WebP 캔버스 오류: ${path} (${info.width}x${info.height})`);
              }
              if (!info.hasAlpha) failures.push(`${phase} WebP 알파 플래그 누락: ${path}`);
              if (JSON.stringify(info.durations) !== JSON.stringify(expectedDurations)) {
                failures.push(`${phase} WebP 재생시간 오류: ${path} (${info.durations.join(",")})`);
              }
            } catch (error) {
              failures.push(`${phase} WebP 판독 실패: ${path} (${error.message})`);
            }
          }
        }
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
    phases: phases.length + manifestPhases.length,
    characters: characters.length,
  }));
}
