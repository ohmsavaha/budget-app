(function petNurseryRoomBootstrap() {
  "use strict";

  const SLOT_LABELS = Object.freeze({
    theme: "방 배경",
    rug: "러그",
    bed: "침대",
    scratcher: "스크래처",
    toy: "장난감",
  });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function mount(container, options = {}) {
    const engine = window.BudgetPetNursery;
    if (!engine) throw new Error("BudgetPetNursery must be loaded before room customization");
    if (!(container instanceof Element)) throw new Error("A valid room customization mount element is required");

    let character = options.character || "huchu";
    let sceneRoot = options.sceneRoot || null;
    let state = engine.loadAll()[character];
    let activeSlot = "toy";

    const root = element("section", "pet-room-customizer");
    root.setAttribute("aria-label", "고양이 육성방 꾸미기");

    const header = element("div", "pet-room-customizer__header");
    const heading = element("div");
    heading.append(
      element("p", "pet-extra-card__eyebrow", "MY CAT ROOM"),
      element("h2", "pet-room-customizer__title", "우리 방 꾸미기"),
    );
    const progress = element("span", "pet-room-customizer__progress");
    header.append(heading, progress);

    const intro = element("p", "pet-room-customizer__intro", "돌봄으로 쌓은 XP가 새 방과 장난감을 열어줘요. 실제 돈이나 가계부 지출은 사용하지 않아요.");
    const nextUnlock = element("div", "pet-room-customizer__next");
    const slotTabs = element("div", "pet-room-slots");
    slotTabs.setAttribute("role", "tablist");
    slotTabs.setAttribute("aria-label", "꾸밀 위치 선택");
    const slotButtons = {};
    engine.ROOM_SLOT_ORDER.forEach((slot) => {
      const button = element("button", "pet-room-slot", SLOT_LABELS[slot] || slot);
      button.type = "button";
      button.setAttribute("role", "tab");
      button.addEventListener("click", () => {
        activeSlot = slot;
        render();
      });
      slotTabs.append(button);
      slotButtons[slot] = button;
    });

    const itemTitle = element("h3", "pet-room-items__title");
    const itemGrid = element("div", "pet-room-items");
    const message = element("p", "pet-room-customizer__message");
    message.setAttribute("aria-live", "polite");
    root.append(header, intro, nextUnlock, slotTabs, itemTitle, itemGrid, message);
    container.replaceChildren(root);

    const scene = element("div", "pet-room-scene");
    scene.setAttribute("aria-hidden", "true");
    const sceneItems = {};
    ["rug", "bed", "scratcher", "toy"].forEach((slot) => {
      const item = element("span", `pet-room-scene__item pet-room-scene__item--${slot}`);
      scene.append(item);
      sceneItems[slot] = item;
    });

    function latestState() {
      return engine.loadAll()[character];
    }

    function attachScene() {
      if (!(sceneRoot instanceof Element)) return;
      const safeStage = sceneRoot.querySelector(".pet-nursery__safe-stage");
      if (safeStage && scene.parentElement !== safeStage) safeStage.prepend(scene);
    }

    function applyScene() {
      attachScene();
      if (!(sceneRoot instanceof Element)) return;
      sceneRoot.dataset.roomTheme = state.room.theme;
      engine.getRoomCatalog(state).forEach((entry) => {
        if (entry.slot === "theme") return;
        const selected = entry.items.find((item) => item.selected) || entry.items[0];
        scene.dataset[entry.slot] = selected.id;
        sceneItems[entry.slot].textContent = selected.icon;
        sceneItems[entry.slot].setAttribute("title", selected.label);
      });
    }

    function selectItem(slot, item) {
      state = latestState();
      const result = engine.setRoomItem(state, slot, item.id);
      if (!result.ok) {
        message.textContent = `${item.label}은 ${result.requiredXp} XP에 열려요. 지금은 천천히 함께 성장해 주세요.`;
        return;
      }
      state = engine.savePet(result.state);
      applyScene();
      render(`${state.displayName}의 방에 ${item.label}을 놓았어요.`);
      root.dispatchEvent(new CustomEvent("petnurserychange", {
        detail: { state, source: "room_customize", slot, item: item.id },
        bubbles: true,
      }));
    }

    function render(customMessage) {
      state = engine.normalizeState(state);
      const catalog = engine.getRoomCatalog(state);
      const active = catalog.find((entry) => entry.slot === activeSlot) || catalog[0];
      const summary = engine.getRoomSummary(state);
      progress.textContent = `${summary.unlockedCount}/${summary.totalCount} 해금`;
      nextUnlock.textContent = summary.nextUnlockXp === null
        ? "모든 방 꾸미기 보상을 열었어요!"
        : `다음 꾸미기 보상까지 ${Math.max(0, summary.nextUnlockXp - state.xp)} XP`;
      Object.entries(slotButtons).forEach(([slot, button]) => {
        const selected = slot === activeSlot;
        button.dataset.active = String(selected);
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      itemTitle.textContent = SLOT_LABELS[active.slot] || active.slot;
      const buttons = active.items.map((item) => {
        const button = element("button", "pet-room-item");
        button.type = "button";
        button.dataset.unlocked = String(item.unlocked);
        button.dataset.selected = String(item.selected);
        button.setAttribute("aria-pressed", String(item.selected));
        const icon = element("span", "pet-room-item__icon", item.unlocked ? item.icon : "🔒");
        const copy = element("span", "pet-room-item__copy");
        copy.append(
          element("span", "pet-room-item__name", item.label),
          element("span", "pet-room-item__xp", item.minXp === 0 ? "기본 제공" : `${item.minXp} XP`),
        );
        button.append(icon, copy);
        button.addEventListener("click", () => selectItem(active.slot, item));
        return button;
      });
      itemGrid.replaceChildren(...buttons);
      message.textContent = customMessage || `${state.displayName}에게 어울리는 방을 골라주세요. 선택은 이 기기에 자동 저장돼요.`;
      applyScene();
    }

    function refresh(nextState) {
      state = nextState && nextState.character === character ? engine.normalizeState(nextState) : latestState();
      render();
    }

    function setCharacter(nextCharacter, nextSceneRoot) {
      const pets = engine.loadAll();
      if (!pets[nextCharacter]) throw new Error(`Unknown pet character: ${nextCharacter}`);
      character = nextCharacter;
      state = pets[character];
      if (nextSceneRoot instanceof Element) sceneRoot = nextSceneRoot;
      activeSlot = "toy";
      render();
    }

    render();

    return Object.freeze({
      root,
      refresh,
      setCharacter,
      setSceneRoot(nextSceneRoot) {
        sceneRoot = nextSceneRoot;
        applyScene();
      },
      destroy() {
        scene.remove();
        root.remove();
      },
    });
  }

  window.BudgetPetNurseryRoom = Object.freeze({ mount });
})();
