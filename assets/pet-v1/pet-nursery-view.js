(function petNurseryViewBootstrap() {
  "use strict";

  const NEEDS = Object.freeze([
    ["fullness", "포만감"],
    ["energy", "에너지"],
    ["happiness", "기분"],
    ["cleanliness", "청결"],
    ["health", "건강"],
    ["affection", "친밀도"],
  ]);
  const ACTION_LABELS = Object.freeze({
    feed: "밥 주기",
    sleep: "재우기",
    play: "놀아주기",
    clean: "빗질하기",
    care: "돌봐주기",
    pet: "쓰다듬기",
  });
  const STATUS_ACTION = Object.freeze({
    sick: "care",
    hungry: "feed",
    sleepy: "sleep",
    messy: "clean",
    bored: "play",
    lonely: "pet",
  });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function mount(container, options = {}) {
    const engine = window.BudgetPetNursery;
    if (!engine) throw new Error("BudgetPetNursery must be loaded before the nursery view");
    if (!(container instanceof Element)) throw new Error("A valid mount element is required");

    let character = options.character || "huchu";
    let pets = engine.loadAll();
    if (!pets[character]) character = "huchu";
    let state = pets[character];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const root = element("section", "pet-nursery");
    root.setAttribute("aria-label", `${state.displayName} 아기 고양이 돌보기`);

    const header = element("header", "pet-nursery__header");
    const heading = element("div");
    heading.append(element("p", "pet-nursery__eyebrow", "우리집 아기 고양이"));
    const title = element("h2", "pet-nursery__title");
    heading.append(title);
    const stage = element("span", "pet-nursery__stage");
    header.append(heading, stage);

    const room = element("div", "pet-nursery__room");
    const safeStage = element("div", "pet-nursery__safe-stage");
    const pet = element("img", "pet-nursery__pet");
    pet.alt = "";
    pet.setAttribute("aria-hidden", "true");
    safeStage.append(pet);

    const summary = element("div", "pet-nursery__summary");
    const message = element("p", "pet-nursery__message");
    message.setAttribute("aria-live", "polite");
    const needs = element("dl", "pet-needs");
    const needRows = {};
    NEEDS.forEach(([key, label]) => {
      const row = element("div", "pet-needs__row");
      const name = element("dt", "pet-needs__label", label);
      const track = element("dd", "pet-needs__track");
      const fill = element("span", "pet-needs__fill");
      const value = element("dd", "pet-needs__value");
      track.append(fill);
      row.append(name, track, value);
      needs.append(row);
      needRows[key] = { row, fill, value };
    });
    summary.append(message, needs);
    room.append(safeStage, summary);

    const actions = element("div", "pet-nursery__actions");
    const actionButtons = {};
    Object.entries(ACTION_LABELS).forEach(([id, label]) => {
      const button = element("button", "pet-nursery__action", label);
      button.type = "button";
      button.dataset.petAction = id;
      button.addEventListener("click", () => perform(id));
      actions.append(button);
      actionButtons[id] = button;
    });
    root.append(header, room, actions);
    container.replaceChildren(root);

    function render(customMessage) {
      state = engine.tick(state);
      const status = engine.deriveStatus(state);
      const asset = engine.resolveAsset(state, { reducedMotion: reduceMotion.matches });
      const stageLabel = state.stage === "kitten" ? "아기 고양이" : "다 자란 고양이";
      root.dataset.petStatus = status.id;
      root.dataset.petStage = state.stage;
      title.textContent = `${state.displayName} · ${state.generation}번째 성장`;
      stage.textContent = `${stageLabel} · ${state.xp}/${engine.ADULT_XP} XP`;
      message.textContent = customMessage || `${state.displayName}: ${status.label}`;
      pet.src = asset.src;
      pet.onerror = () => {
        if (asset.fallback && pet.src !== new URL(asset.fallback, document.baseURI).href) {
          pet.src = asset.fallback;
        }
      };

      NEEDS.forEach(([key]) => {
        const value = Math.round(state.needs[key]);
        needRows[key].row.dataset.low = String(value < 30);
        needRows[key].fill.style.setProperty("--pet-need", `${value}%`);
        needRows[key].value.textContent = String(value);
      });

      Object.entries(actionButtons).forEach(([id, button]) => {
        const remaining = engine.cooldownRemaining(state, id);
        button.disabled = remaining > 0;
        button.textContent = remaining > 0
          ? `${ACTION_LABELS[id]} · ${Math.ceil(remaining / 60000)}분`
          : ACTION_LABELS[id];
        button.dataset.recommended = String(STATUS_ACTION[status.id] === id);
      });
    }

    function perform(actionId) {
      const result = engine.applyAction(state, actionId);
      if (!result.ok) {
        render(`${Math.ceil(result.remainingMs / 60000)}분 뒤에 다시 해주세요.`);
        return;
      }
      state = engine.savePet(result.state);
      pets[state.character] = state;
      render(`${state.displayName}와 즐거운 시간을 보냈어요. +${result.gainedXp} XP`);
      root.dispatchEvent(new CustomEvent("petnurserychange", { detail: { state }, bubbles: true }));
    }

    function setCharacter(nextCharacter) {
      if (!pets[nextCharacter]) throw new Error(`Unknown pet character: ${nextCharacter}`);
      character = nextCharacter;
      state = pets[character];
      root.setAttribute("aria-label", `${state.displayName} 아기 고양이 돌보기`);
      render();
    }

    function handleMotionChange() {
      render();
    }

    reduceMotion.addEventListener?.("change", handleMotionChange);
    const interval = window.setInterval(() => render(), 60000);
    render();

    return Object.freeze({
      root,
      getState: () => engine.normalizeState(state),
      setCharacter,
      destroy() {
        window.clearInterval(interval);
        reduceMotion.removeEventListener?.("change", handleMotionChange);
        root.remove();
      },
    });
  }

  window.BudgetPetNurseryUI = Object.freeze({ mount });
})();
