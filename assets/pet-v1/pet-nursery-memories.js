(function petNurseryMemoriesBootstrap() {
  "use strict";

  const COLLAPSED_COUNT = 3;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "날짜 미상";
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  }

  function roomIcons(engine, memory) {
    return engine.ROOM_SLOT_ORDER.map((slot) => {
      const item = engine.ROOM_CATALOG[slot].find((candidate) => candidate.id === memory.room?.[slot]);
      return item?.icon || "·";
    }).join(" ");
  }

  function mount(container, options = {}) {
    const engine = window.BudgetPetNursery;
    if (!engine) throw new Error("BudgetPetNursery must be loaded before generation memories");
    if (!(container instanceof Element)) throw new Error("A valid generation memory mount element is required");

    let character = options.character || "huchu";
    let state = engine.loadAll()[character];
    let expanded = false;

    const root = element("section", "pet-generation-archive");
    root.setAttribute("aria-label", "고양이 세대별 추억 보관함");

    const header = element("div", "pet-generation-archive__header");
    const heading = element("div");
    heading.append(
      element("p", "pet-extra-card__eyebrow", "GENERATION MEMORIES"),
      element("h2", "pet-generation-archive__title", "세대별 추억 보관함"),
    );
    const progress = element("span", "pet-generation-archive__progress");
    header.append(heading, progress);

    const intro = element("p", "pet-generation-archive__intro", "새 세대를 시작하면 함께한 성장 기록과 마지막 방이 이 기기에 자동으로 보관돼요.");
    const summary = element("div", "pet-generation-archive__summary");
    const list = element("div", "pet-generation-archive__list");
    const toggle = element("button", "pet-generation-archive__toggle");
    toggle.type = "button";
    toggle.addEventListener("click", () => {
      expanded = !expanded;
      render();
    });
    root.append(header, intro, summary, list, toggle);
    container.replaceChildren(root);

    function latestState() {
      return engine.loadAll()[character];
    }

    function memoryCard(memory) {
      const card = element("article", "pet-generation-memory");
      const visual = element("div", "pet-generation-memory__visual");
      const image = element("img", "pet-generation-memory__image");
      image.src = engine.resolveGenerationMemoryAsset(memory);
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      visual.append(image);

      const copy = element("div", "pet-generation-memory__copy");
      const titleRow = element("div", "pet-generation-memory__title-row");
      titleRow.append(
        element("h3", "pet-generation-memory__title", `${memory.generation}번째 성장`),
        element("span", "pet-generation-memory__stage", memory.finalStage === "adult" ? "성묘까지 성장" : "아기 시절 기록"),
      );
      const dates = element("p", "pet-generation-memory__dates", `${formatDate(memory.bornAt)} — ${formatDate(memory.completedAt)}`);
      const stats = element("div", "pet-generation-memory__stats");
      [
        `${memory.finalXp} XP`,
        `추억 ${memory.milestonesUnlocked}/${engine.MILESTONES.length}`,
        `연속 돌봄 ${memory.careStreak}일`,
      ].forEach((label) => stats.append(element("span", "pet-generation-memory__stat", label)));
      const room = element("div", "pet-generation-memory__room");
      room.append(
        element("span", "pet-generation-memory__room-label", "마지막 방"),
        element("span", "pet-generation-memory__room-icons", roomIcons(engine, memory)),
      );
      copy.append(titleRow, dates, stats, room);
      card.append(visual, copy);
      return card;
    }

    function render() {
      state = engine.normalizeState(state);
      const memories = engine.getGenerationMemories(state);
      const archive = engine.getGenerationMemorySummary(state);
      progress.textContent = `${archive.total}세대 보관`;
      summary.textContent = archive.total
        ? `${state.displayName}와 함께한 ${archive.total}개의 성장 기록 · 성묘까지 자란 세대 ${archive.adultCount}개 · 최고 ${archive.highestXp} XP`
        : `${state.displayName}의 첫 성장을 함께하고 있어요. 새 세대를 시작하면 현재 기록이 이곳에 안전하게 남아요.`;
      if (!memories.length) {
        const empty = element("div", "pet-generation-archive__empty");
        empty.append(
          element("span", "pet-generation-archive__empty-icon", "📖"),
          element("span", "pet-generation-archive__empty-copy", "아직 보관된 이전 세대는 없어요. 지금의 성장부터 차곡차곡 기록할게요."),
        );
        list.replaceChildren(empty);
        toggle.hidden = true;
        return;
      }
      const visible = expanded ? memories : memories.slice(0, COLLAPSED_COUNT);
      list.replaceChildren(...visible.map(memoryCard));
      toggle.hidden = memories.length <= COLLAPSED_COUNT;
      toggle.textContent = expanded ? "최근 세대만 보기" : `이전 추억 ${memories.length - COLLAPSED_COUNT}개 더 보기`;
      toggle.setAttribute("aria-expanded", String(expanded));
    }

    function refresh(nextState) {
      state = nextState && nextState.character === character ? engine.normalizeState(nextState) : latestState();
      render();
    }

    function setCharacter(nextCharacter) {
      const pets = engine.loadAll();
      if (!pets[nextCharacter]) throw new Error(`Unknown pet character: ${nextCharacter}`);
      character = nextCharacter;
      state = pets[character];
      expanded = false;
      render();
    }

    render();

    return Object.freeze({
      root,
      refresh,
      setCharacter,
      destroy() { root.remove(); },
    });
  }

  window.BudgetPetNurseryMemories = Object.freeze({ mount });
})();
