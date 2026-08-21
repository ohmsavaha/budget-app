(function petNurseryExtrasBootstrap() {
  "use strict";

  const MISSION_LABELS = Object.freeze({
    feed: "밥 한 번 챙기기",
    play: "같이 놀아주기",
    pet: "다정하게 쓰다듬기",
  });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function mount(container, options = {}) {
    const engine = window.BudgetPetNursery;
    if (!engine) throw new Error("BudgetPetNursery must be loaded before nursery extras");
    if (!(container instanceof Element)) throw new Error("A valid extras mount element is required");

    let character = options.character || "huchu";
    let state = engine.loadAll()[character];
    let winningSpot = null;
    let roundOpen = false;

    const root = element("section", "pet-extras");
    root.setAttribute("aria-label", "고양이 성장 놀이와 추억");

    const dailyCard = element("article", "pet-extra-card pet-daily");
    const dailyHead = element("div", "pet-extra-card__head");
    const dailyHeading = element("div");
    dailyHeading.append(
      element("p", "pet-extra-card__eyebrow", "TODAY'S CARE"),
      element("h3", "pet-extra-card__title", "오늘의 돌봄 약속"),
    );
    const dailyProgress = element("span", "pet-daily__progress");
    dailyHead.append(dailyHeading, dailyProgress);
    const missionList = element("div", "pet-daily__missions");
    const missionRows = {};
    engine.DAILY_MISSION_ACTIONS.forEach((action) => {
      const row = element("div", "pet-daily__mission");
      const check = element("span", "pet-daily__check", "○");
      const label = element("span", "pet-daily__label", MISSION_LABELS[action] || action);
      row.append(check, label);
      missionList.append(row);
      missionRows[action] = { row, check };
    });
    const dailyMessage = element("p", "pet-daily__message");
    dailyCard.append(dailyHead, missionList, dailyMessage);

    const gameCard = element("article", "pet-extra-card pet-game");
    const gameHead = element("div", "pet-extra-card__head");
    const gameHeading = element("div");
    gameHeading.append(
      element("p", "pet-extra-card__eyebrow", "PAW HUNT"),
      element("h3", "pet-extra-card__title", "발바닥은 어디에?"),
    );
    const gameCount = element("span", "pet-game__count");
    gameHead.append(gameHeading, gameCount);
    const gameCopy = element("p", "pet-game__copy", "세 개의 포근한 쿠션 중 발바닥이 숨어 있는 곳을 찾아보세요. 하루 세 번까지 가볍게 놀 수 있어요.");
    const board = element("div", "pet-game__board");
    const spots = Array.from({ length: 3 }, (_, index) => {
      const button = element("button", "pet-game__spot");
      button.type = "button";
      button.setAttribute("aria-label", `${index + 1}번 쿠션 선택`);
      const icon = element("span", "pet-game__spot-icon", "☁️");
      const label = element("span", "pet-game__spot-label", `${index + 1}번 쿠션`);
      button.append(icon, label);
      button.addEventListener("click", () => chooseSpot(index));
      board.append(button);
      return { button, icon };
    });
    const gameResult = element("p", "pet-game__result");
    gameResult.setAttribute("aria-live", "polite");
    const gameStart = element("button", "pet-game__start", "발바닥 찾기 시작");
    gameStart.type = "button";
    gameStart.addEventListener("click", startRound);
    gameCard.append(gameHead, gameCopy, board, gameResult, gameStart);

    const albumCard = element("article", "pet-extra-card pet-album");
    const albumHead = element("div", "pet-extra-card__head");
    const albumHeading = element("div");
    albumHeading.append(
      element("p", "pet-extra-card__eyebrow", "GROWTH ALBUM"),
      element("h3", "pet-extra-card__title", "함께 쌓는 성장 추억"),
    );
    const albumProgress = element("span", "pet-album__progress");
    albumHead.append(albumHeading, albumProgress);
    const albumGrid = element("div", "pet-album__grid");
    albumCard.append(albumHead, albumGrid);

    root.append(dailyCard, gameCard, albumCard);
    container.replaceChildren(root);

    function latestState() {
      return engine.loadAll()[character];
    }

    function renderDaily() {
      const summary = engine.getDailyCare(state);
      dailyProgress.textContent = `${summary.completedCount}/${summary.missions.length}`;
      summary.missions.forEach((mission) => {
        const item = missionRows[mission.action];
        item.row.dataset.completed = String(mission.completed);
        item.check.textContent = mission.completed ? "✓" : "○";
      });
      dailyMessage.textContent = summary.complete
        ? `${state.displayName}와 오늘의 약속을 모두 지켰어요. 정말 다정한 하루예요!`
        : `부담 없이 하나씩 해주세요. 오늘 약속을 빠뜨려도 ${state.displayName}는 사라지지 않으니 다시 와서 천천히 돌보면 돼요.`;
    }

    function renderAlbum() {
      const milestones = engine.getMilestones(state);
      const unlocked = milestones.filter((milestone) => milestone.unlocked).length;
      albumProgress.textContent = `${unlocked}/${milestones.length} 추억`;
      const cards = milestones.map((milestone) => {
        const card = element("div", "pet-album__memory");
        card.dataset.unlocked = String(milestone.unlocked);
        const image = element("img", "pet-album__image");
        image.src = milestone.asset;
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        const label = element("div", "pet-album__label", milestone.unlocked ? milestone.label : "아직 잠긴 추억");
        const xp = element("div", "pet-album__xp", milestone.xp === 0 ? "첫 만남" : `${milestone.xp} XP`);
        card.append(image, label, xp);
        return card;
      });
      albumGrid.replaceChildren(...cards);
    }

    function renderGameMeta() {
      const plays = state.games.pawHuntPlays;
      gameCount.textContent = `${plays}/${engine.GAME_DAILY_LIMIT}회`;
      const ended = plays >= engine.GAME_DAILY_LIMIT;
      gameStart.disabled = roundOpen || ended;
      gameStart.textContent = ended ? "오늘 놀이는 완료" : plays > 0 ? "한 번 더 찾기" : "발바닥 찾기 시작";
      if (ended && !roundOpen && !gameResult.textContent) gameResult.textContent = `오늘은 ${state.games.pawHuntWins}번 찾았어요. 내일 다시 놀아요!`;
    }

    function startRound() {
      state = latestState();
      if (state.games.pawHuntPlays >= engine.GAME_DAILY_LIMIT) {
        roundOpen = false;
        renderGameMeta();
        return;
      }
      winningSpot = Math.floor(Math.random() * spots.length);
      roundOpen = true;
      spots.forEach(({ button, icon }) => {
        button.disabled = false;
        button.dataset.revealed = "false";
        icon.textContent = "☁️";
      });
      gameResult.textContent = `${state.displayName}가 발바닥을 숨겼어요. 쿠션 하나를 골라주세요!`;
      renderGameMeta();
    }

    function chooseSpot(index) {
      if (!roundOpen) return;
      roundOpen = false;
      const result = engine.playPawHunt(state, index === winningSpot);
      if (!result.ok) {
        state = result.state;
        renderGameMeta();
        return;
      }
      state = engine.savePet(result.state);
      spots.forEach(({ button, icon }, spotIndex) => {
        button.disabled = true;
        button.dataset.revealed = "true";
        icon.textContent = spotIndex === winningSpot ? "🐾" : "☁️";
      });
      gameResult.textContent = result.won
        ? `찾았어요! ${state.displayName}가 신나 보여요. +${result.gainedXp} XP`
        : `여기에는 없었네요. 그래도 함께 놀아서 +${result.gainedXp} XP`;
      renderDaily();
      renderAlbum();
      renderGameMeta();
      root.dispatchEvent(new CustomEvent("petnurserychange", { detail: { state, source: "paw_hunt" }, bubbles: true }));
    }

    function refresh(nextState) {
      state = nextState && nextState.character === character ? engine.normalizeState(nextState) : latestState();
      renderDaily();
      renderAlbum();
      renderGameMeta();
    }

    function setCharacter(nextCharacter) {
      const pets = engine.loadAll();
      if (!pets[nextCharacter]) throw new Error(`Unknown pet character: ${nextCharacter}`);
      character = nextCharacter;
      state = pets[character];
      winningSpot = null;
      roundOpen = false;
      spots.forEach(({ button, icon }) => {
        button.disabled = true;
        button.dataset.revealed = "false";
        icon.textContent = "☁️";
      });
      gameResult.textContent = "";
      refresh(state);
    }

    spots.forEach(({ button }) => { button.disabled = true; });
    refresh(state);

    return Object.freeze({
      root,
      refresh,
      setCharacter,
      destroy() { root.remove(); },
    });
  }

  window.BudgetPetNurseryExtras = Object.freeze({ mount });
})();
