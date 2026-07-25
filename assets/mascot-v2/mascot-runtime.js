const ROOT = "./assets/mascot-v2";
const CHARACTERS = new Set(["huchu", "mayo", "jjajang"]);
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const ENABLED_KEY = "mascot_v2_enabled";

const PHASE_ACTIONS = Object.freeze({
  phase2a: new Set(["blink", "breathe", "ear_twitch", "tail_sway"]),
  phase2b: new Set(["walk", "run", "jump_land"]),
  phase2c: new Set([
    "head_tilt", "look_around", "yawn", "doze_wake", "paw_tap",
    "paw_wave", "send_heart", "happy_hop", "body_shake",
  ]),
  phase2d: new Set([
    "amount_entry", "card_payment", "cash_payment", "shared_deposit",
    "shared_withdrawal", "split_bill", "joint_settlement", "fixed_cost",
    "budget_warning", "savings_mode", "surplus", "deficit_support",
  ]),
  phase2e: new Set([
    "subscription_payment", "card_bill_worry", "budget_set",
    "budget_exceeded", "no_spend_day", "impulse_stop", "investment_up",
    "investment_down", "dividend_interest", "networth_record", "refund",
    "lowest_price", "emergency_fund", "debt_payoff",
  ]),
});

const IDLE_BY_TAB = Object.freeze({
  home: { character: "mayo", action: "breathe", message: "마요가 이번 달 가계부를 차분히 살펴보고 있어요." },
  spend: { character: "huchu", action: "ear_twitch", message: "후추가 새 지출과 예산 변화를 놓치지 않고 있어요." },
  shared: { character: "mayo", action: "tail_sway", message: "마요가 공용통장과 공동정산을 함께 확인하고 있어요." },
  assets: { character: "jjajang", action: "breathe", message: "짜장이 자산과 저축 목표를 든든하게 지키고 있어요." },
  calendar: { character: "mayo", action: "ear_twitch", message: "마요가 날짜별 기록을 하나씩 확인하고 있어요." },
  fixed: { character: "mayo", action: "tail_sway", message: "마요가 이번 달 고정비 납부 상태를 챙기고 있어요." },
  invest: { character: "jjajang", action: "tail_sway", message: "짜장이 투자 흐름을 너무 들뜨지 않고 지켜보고 있어요." },
  yearly: { character: "jjajang", action: "breathe", message: "짜장이 올해의 변화와 성과를 한눈에 보고 있어요." },
  db: { character: "huchu", action: "ear_twitch", message: "후추가 우리집 품목과 최저가 기록을 찾고 있어요." },
});

const PREFERRED_CHARACTER = Object.freeze({
  amount_entry: "huchu",
  card_payment: "huchu",
  cash_payment: "mayo",
  shared_deposit: "mayo",
  shared_withdrawal: "mayo",
  split_bill: "huchu",
  joint_settlement: "mayo",
  fixed_cost: "mayo",
  budget_warning: "huchu",
  savings_mode: "jjajang",
  surplus: "jjajang",
  deficit_support: "mayo",
  subscription_payment: "huchu",
  card_bill_worry: "huchu",
  budget_set: "huchu",
  budget_exceeded: "huchu",
  no_spend_day: "jjajang",
  impulse_stop: "jjajang",
  investment_up: "mayo",
  investment_down: "mayo",
  dividend_interest: "mayo",
  networth_record: "mayo",
  refund: "jjajang",
  lowest_price: "jjajang",
  emergency_fund: "mayo",
  debt_payoff: "jjajang",
  head_tilt: "huchu",
  look_around: "huchu",
  yawn: "mayo",
  doze_wake: "mayo",
  paw_tap: "huchu",
  paw_wave: "mayo",
  send_heart: "mayo",
  happy_hop: "jjajang",
  body_shake: "jjajang",
  walk: "mayo",
  run: "huchu",
  jump_land: "jjajang",
});

const ACTION_COPY = Object.freeze({
  amount_entry: ["금액 입력 완료", "후추가 입력한 금액을 확인했어요.", "good"],
  card_payment: ["카드 결제 기록 완료", "카드 결제 내역이 안전하게 저장됐어요.", "good"],
  cash_payment: ["현금 결제 기록 완료", "현금으로 쓴 금액까지 빠짐없이 기록했어요.", "good"],
  shared_deposit: ["공용통장 입금 완료", "함께 쓸 생활비가 공용통장에 들어왔어요.", "good"],
  shared_withdrawal: ["공용 지출 기록 완료", "공용비용으로 나간 금액을 정확히 남겼어요.", "good"],
  split_bill: ["더치페이 계산 완료", "내 몫과 받을 돈을 나눠 기록했어요.", "good"],
  joint_settlement: ["공동정산 완료", "받을 돈과 계좌 잔액까지 정리됐어요.", "good"],
  fixed_cost: ["고정비 납부 확인", "이번 달 고정비 하나를 깔끔하게 체크했어요.", "good"],
  budget_warning: ["예산 확인", "예산을 넘기기 전에 남은 금액을 확인해봐요.", "warn"],
  budget_exceeded: ["예산 초과 확인", "괜찮아요. 남은 기간의 지출 계획부터 다시 잡아봐요.", "warn"],
  savings_mode: ["절약모드 시작", "작은 절약도 모이면 분명한 변화가 돼요.", "good"],
  surplus: ["이번 달 흑자", "남은 돈을 지켜낸 걸 짜장이 크게 축하해요!", "good"],
  deficit_support: ["이번 달 점검", "자책하지 말고 큰 지출부터 하나씩 정리해봐요.", "warn"],
  subscription_payment: ["구독 결제 확인", "반복 결제를 확인하고 다음 결제일까지 기록했어요.", "good"],
  card_bill_worry: ["카드대금 점검", "청구 예정액을 보고 납부 계획을 미리 세워봐요.", "warn"],
  budget_set: ["예산 설정 완료", "이번 달에 지킬 기준이 생겼어요.", "good"],
  no_spend_day: ["무지출데이 달성", "오늘은 지출 없이 잘 지켜냈어요!", "good"],
  impulse_stop: ["충동지출 방어", "잠깐 멈춘 선택이 예산을 지켜줬어요.", "good"],
  investment_up: ["투자 상승 기록", "오른 날도 들뜨지 않고 기록으로 남겼어요.", "good"],
  investment_down: ["투자 하락 확인", "내려간 날도 계획과 비중부터 차분히 확인해요.", "warn"],
  dividend_interest: ["배당·이자 기록", "자산이 만든 수입을 빠짐없이 기록했어요.", "good"],
  networth_record: ["순자산 최고 기록", "꾸준히 쌓아온 변화가 새 기록이 됐어요!", "good"],
  refund: ["환불·취소 기록 완료", "돌아온 금액을 소비에서 정확히 반영했어요.", "good"],
  lowest_price: ["최저가 발견", "후추가 더 좋은 가격 기록을 찾았어요.", "good"],
  emergency_fund: ["비상금 업데이트", "갑작스러운 지출을 버틸 안전망이 더 단단해졌어요.", "good"],
  debt_payoff: ["부채 상환 완료", "하나의 부담을 끝까지 정리해냈어요.", "good"],
  paw_tap: ["입력 확인", "필수 항목을 한 번만 더 확인해 주세요.", "warn"],
  send_heart: ["함께해서 든든해요", "공용정산과 저축을 함께 이어가고 있어요.", "good"],
  happy_hop: ["목표 달성", "짜장이 기쁨을 참지 못하고 폴짝 뛰었어요!", "good"],
});

const PRIORITY = Object.freeze({
  paw_tap: 5,
  budget_exceeded: 5,
  budget_warning: 5,
  card_bill_worry: 4,
  deficit_support: 4,
  joint_settlement: 4,
  debt_payoff: 4,
  surplus: 4,
  refund: 4,
  happy_hop: 4,
});

let timer = 0;
let activePriority = -1;
let lastStage = null;

function isEnabled() {
  return localStorage.getItem(ENABLED_KEY) !== "0";
}

function phaseFor(action) {
  return Object.keys(PHASE_ACTIONS).find((phase) => PHASE_ACTIONS[phase].has(action)) || null;
}

function animatedName(phase, character, action) {
  const suffix = ["phase2a", "phase2b", "phase2c"].includes(phase) ? "_512_v01.webp" : "_v01.webp";
  return `${character}_${action}${suffix}`;
}

function staticName(character, action) {
  return `${character}_${action}_frame_01_v01.png`;
}

function assetPath(phase, character, action, reduced = REDUCED_MOTION.matches) {
  return reduced
    ? `${ROOT}/${phase}/static/${staticName(character, action)}`
    : `${ROOT}/${phase}/webp/${animatedName(phase, character, action)}`;
}

function masterPath(character) {
  return `${ROOT}/phase2a/static/${character}_master_front_sit_v01.png`;
}

function getStage() {
  return document.querySelector("[data-budget-mascot-stage]");
}

function ensureStageContent(stage) {
  if (!stage || stage.dataset.mascotReady === "1") return stage;
  stage.dataset.mascotReady = "1";
  stage.classList.add("budget-mascot-stage");
  stage.setAttribute("role", "status");
  stage.setAttribute("aria-live", "polite");
  stage.innerHTML = `
    <div class="budget-mascot-copy">
      <div class="budget-mascot-eyebrow">후추 · 마요 · 짜장</div>
      <div class="budget-mascot-message"></div>
      <div class="budget-mascot-note">정보와 버튼을 가리지 않는 전용 안전영역에서만 움직여요.</div>
    </div>
    <div class="budget-mascot-visual" aria-hidden="true">
      <img class="budget-mascot-image" alt="" decoding="async">
    </div>
    <button class="budget-mascot-toggle" type="button" title="마스코트 숨기기" aria-label="마스코트 숨기기">×</button>
  `;
  stage.querySelector(".budget-mascot-toggle")?.addEventListener("click", () => setEnabled(!isEnabled()));
  lastStage = stage;
  return stage;
}

function setImage(stage, { phase, character, action }) {
  const image = stage.querySelector(".budget-mascot-image");
  if (!image) return;
  image.onerror = () => {
    image.onerror = null;
    image.src = masterPath(character);
  };
  image.src = assetPath(phase, character, action);
}

function renderIdle() {
  const stage = ensureStageContent(getStage());
  if (!stage) return false;
  stage.classList.toggle("is-disabled", !isEnabled());
  const toggle = stage.querySelector(".budget-mascot-toggle");
  if (toggle) {
    toggle.textContent = isEnabled() ? "×" : "🐾 다시 보기";
    toggle.title = isEnabled() ? "마스코트 숨기기" : "마스코트 다시 보기";
    toggle.setAttribute("aria-label", toggle.title);
  }
  if (!isEnabled()) return false;
  window.clearTimeout(timer);
  activePriority = -1;
  const tab = document.body.dataset.budgetTab || "home";
  const idle = IDLE_BY_TAB[tab] || IDLE_BY_TAB.home;
  stage.dataset.state = "idle";
  stage.dataset.tone = "neutral";
  stage.querySelector(".budget-mascot-eyebrow").textContent = "후추 · 마요 · 짜장";
  stage.querySelector(".budget-mascot-message").textContent = idle.message;
  setImage(stage, { phase: "phase2a", ...idle });
  return true;
}

function play({ action, character, duration = 2600, message, title, tone } = {}) {
  if (!isEnabled()) return false;
  const phase = phaseFor(action);
  if (!phase) return false;
  const stage = ensureStageContent(getStage());
  if (!stage) return false;
  const priority = PRIORITY[action] ?? 2;
  if (activePriority > priority) return false;
  activePriority = priority;
  window.clearTimeout(timer);
  const chosen = CHARACTERS.has(character) ? character : (PREFERRED_CHARACTER[action] || "huchu");
  const copy = ACTION_COPY[action] || [title || "가계부 기록 완료", message || "기록을 확인했어요.", tone || "good"];
  stage.hidden = false;
  stage.dataset.state = "reacting";
  stage.dataset.tone = tone || copy[2] || "good";
  stage.querySelector(".budget-mascot-eyebrow").textContent = title || copy[0];
  stage.querySelector(".budget-mascot-message").textContent = message || copy[1];
  setImage(stage, { phase, character: chosen, action });
  timer = window.setTimeout(renderIdle, REDUCED_MOTION.matches ? Math.min(duration, 1200) : duration);
  return true;
}

function setEnabled(enabled) {
  localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  const stage = ensureStageContent(getStage());
  if (stage) stage.classList.toggle("is-disabled", !enabled);
  if (enabled) renderIdle();
  else renderIdle();
}

window.addEventListener("budget-mascot", (event) => play(event.detail || {}));
REDUCED_MOTION.addEventListener?.("change", renderIdle);

const observer = new MutationObserver(() => {
  const stage = getStage();
  if (stage && stage !== lastStage) renderIdle();
});
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-budget-tab"],
});

window.BudgetMascot = Object.freeze({
  play,
  renderIdle,
  setEnabled,
  isEnabled,
  actions: Object.freeze(
    Object.fromEntries(Object.entries(PHASE_ACTIONS).map(([phase, actions]) => [phase, [...actions]])),
  ),
});

renderIdle();
