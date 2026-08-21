(function petNurseryBootstrap() {
  "use strict";

  const VERSION = 4;
  const STORAGE_KEY = "humajja_pet_nursery_v1";
  const ROOT = "./assets/pet-v1";
  const CHARACTERS = Object.freeze(["huchu", "mayo", "jjajang"]);
  const DISPLAY_NAMES = Object.freeze({ huchu: "후추", mayo: "마요", jjajang: "짜장" });
  const NEED_KEYS = Object.freeze([
    "fullness", "energy", "happiness", "cleanliness", "health", "affection",
  ]);
  const MAX_OFFLINE_HOURS = 24;
  const ADULT_XP = 1200;
  const GAME_DAILY_LIMIT = 3;
  const DAILY_MISSION_ACTIONS = Object.freeze(["feed", "play", "pet"]);
  const MEMORY_VISUALS = Object.freeze(["idle", "eat", "sleep", "play", "groom", "sick", "love"]);
  const MILESTONES = Object.freeze([
    Object.freeze({ xp: 0, label: "처음 만난 날", visual: "idle" }),
    Object.freeze({ xp: 120, label: "첫 식사", visual: "eat" }),
    Object.freeze({ xp: 300, label: "놀이 친구", visual: "play" }),
    Object.freeze({ xp: 600, label: "마음이 가까워진 날", visual: "love" }),
    Object.freeze({ xp: 900, label: "의젓한 고양이", visual: "groom" }),
    Object.freeze({ xp: ADULT_XP, label: "함께 자란 날", visual: "adult" }),
  ]);
  const ROOM_SLOT_ORDER = Object.freeze(["theme", "rug", "bed", "scratcher", "toy"]);
  const ROOM_CATALOG = Object.freeze({
    theme: Object.freeze([
      Object.freeze({ id: "cream", label: "포근한 크림방", icon: "🏡", minXp: 0 }),
      Object.freeze({ id: "mint", label: "민트 정원방", icon: "🌿", minXp: 300 }),
      Object.freeze({ id: "sunset", label: "노을빛 방", icon: "🌇", minXp: 600 }),
      Object.freeze({ id: "night", label: "별빛 밤방", icon: "🌙", minXp: 900 }),
      Object.freeze({ id: "celebration", label: "성장 축하방", icon: "✨", minXp: ADULT_XP }),
    ]),
    rug: Object.freeze([
      Object.freeze({ id: "cloud", label: "구름 러그", icon: "☁️", minXp: 0 }),
      Object.freeze({ id: "paw", label: "발바닥 러그", icon: "🐾", minXp: 120 }),
      Object.freeze({ id: "meadow", label: "초원 러그", icon: "🌼", minXp: 600 }),
      Object.freeze({ id: "constellation", label: "별자리 러그", icon: "⭐", minXp: 900 }),
    ]),
    bed: Object.freeze([
      Object.freeze({ id: "cushion", label: "폭신 방석", icon: "🛏️", minXp: 0 }),
      Object.freeze({ id: "basket", label: "라탄 바구니", icon: "🧺", minXp: 300 }),
      Object.freeze({ id: "tent", label: "아늑한 텐트", icon: "⛺", minXp: 600 }),
      Object.freeze({ id: "crown", label: "성장 왕관 침대", icon: "👑", minXp: ADULT_XP }),
    ]),
    scratcher: Object.freeze([
      Object.freeze({ id: "cardboard", label: "골판지 스크래처", icon: "📦", minXp: 0 }),
      Object.freeze({ id: "post", label: "기둥 스크래처", icon: "🪵", minXp: 120 }),
      Object.freeze({ id: "tree", label: "캣타워", icon: "🌳", minXp: 600 }),
      Object.freeze({ id: "palace", label: "성장 캣타워", icon: "🏰", minXp: ADULT_XP }),
    ]),
    toy: Object.freeze([
      Object.freeze({ id: "yarn", label: "실뭉치", icon: "🧶", minXp: 0 }),
      Object.freeze({ id: "mouse", label: "쥐돌이", icon: "🐭", minXp: 120 }),
      Object.freeze({ id: "feather", label: "깃털 낚싯대", icon: "🪶", minXp: 300 }),
      Object.freeze({ id: "tunnel", label: "숨숨 터널", icon: "🌀", minXp: 600 }),
      Object.freeze({ id: "fish", label: "물고기 인형", icon: "🐟", minXp: 900 }),
      Object.freeze({ id: "trophy", label: "성장 기념 장난감", icon: "🏆", minXp: ADULT_XP }),
    ]),
  });

  const ACTIONS = Object.freeze({
    feed: {
      visual: "eat", cooldownMinutes: 30, xp: 12,
      effects: { fullness: 32, health: 4, energy: -2 },
    },
    sleep: {
      visual: "sleep", cooldownMinutes: 60, xp: 8,
      effects: { energy: 50, health: 5, fullness: -10 },
    },
    play: {
      visual: "play", cooldownMinutes: 20, xp: 18,
      effects: { happiness: 28, affection: 8, energy: -14, fullness: -8 },
    },
    clean: {
      visual: "groom", cooldownMinutes: 20, xp: 12,
      effects: { cleanliness: 44, affection: 4, health: 3 },
    },
    care: {
      visual: "sick", cooldownMinutes: 60, xp: 10,
      effects: { health: 42, energy: 10, affection: 6 },
    },
    pet: {
      visual: "love", cooldownMinutes: 5, xp: 6,
      effects: { affection: 24, happiness: 10 },
    },
  });

  const DECAY_PER_HOUR = Object.freeze({
    fullness: 4,
    energy: 3,
    happiness: 2,
    cleanliness: 1.5,
    affection: 0.8,
  });

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function assertCharacter(character) {
    if (!CHARACTERS.includes(character)) {
      throw new Error(`Unknown pet character: ${character}`);
    }
  }

  function toIso(now) {
    return new Date(now).toISOString();
  }

  function dateKey(now) {
    const date = new Date(now);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function deriveStage(xp) {
    return Number(xp) >= ADULT_XP ? "adult" : "kitten";
  }

  function defaultRoom() {
    return Object.fromEntries(ROOM_SLOT_ORDER.map((slot) => [slot, ROOM_CATALOG[slot][0].id]));
  }

  function normalizeRoom(input, xp) {
    const room = defaultRoom();
    ROOM_SLOT_ORDER.forEach((slot) => {
      const candidate = ROOM_CATALOG[slot].find((item) => item.id === input?.[slot]);
      if (candidate && candidate.minXp <= xp) room[slot] = candidate.id;
    });
    return room;
  }

  function normalizeIso(value, fallback) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : toIso(fallback);
  }

  function normalizeGenerationMemories(input, character, now = Date.now()) {
    const memories = Array.isArray(input) ? input : [];
    const unique = new Map();
    memories.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      const generation = Math.max(1, Math.floor(Number(entry.generation) || 1));
      const bornAt = normalizeIso(entry.bornAt, now);
      const completedAt = normalizeIso(entry.completedAt, now);
      const finalXp = Math.max(0, Number(entry.finalXp) || 0);
      const finalStage = finalXp >= ADULT_XP || entry.finalStage === "adult" ? "adult" : "kitten";
      const finalVisual = MEMORY_VISUALS.includes(entry.finalVisual) ? entry.finalVisual : "idle";
      const memory = {
        id: `${character}-generation-${generation}-${bornAt}`,
        character,
        displayName: DISPLAY_NAMES[character],
        generation,
        bornAt,
        completedAt,
        finalXp,
        finalStage,
        finalVisual,
        careStreak: Math.max(0, Math.floor(Number(entry.careStreak) || 0)),
        milestonesUnlocked: Math.min(MILESTONES.length, Math.max(1, Math.floor(Number(entry.milestonesUnlocked) || 1))),
        room: normalizeRoom(entry.room, finalXp),
      };
      unique.set(memory.id, memory);
    });
    return [...unique.values()].sort((a, b) => a.generation - b.generation || Date.parse(a.completedAt) - Date.parse(b.completedAt));
  }

  function createInitialState(character, options = {}) {
    assertCharacter(character);
    const now = Number(options.now) || Date.now();
    return {
      schemaVersion: VERSION,
      character,
      displayName: DISPLAY_NAMES[character],
      generation: Math.max(1, Number(options.generation) || 1),
      stage: "kitten",
      xp: 0,
      bornAt: toIso(now),
      updatedAt: toIso(now),
      lastActionAt: null,
      lastAction: "idle",
      currentVisual: "idle",
      visualUntil: null,
      careStreak: 0,
      lastCareDate: null,
      needs: {
        fullness: 82,
        energy: 86,
        happiness: 78,
        cleanliness: 90,
        health: 100,
        affection: 64,
      },
      cooldowns: {},
      games: {
        date: dateKey(now),
        pawHuntPlays: 0,
        pawHuntWins: 0,
      },
      dailyCare: {
        date: dateKey(now),
        completed: [],
      },
      room: defaultRoom(),
      generationMemories: normalizeGenerationMemories(options.generationMemories, character, now),
      history: [],
    };
  }

  function normalizeState(input, now = Date.now()) {
    if (!input || typeof input !== "object") {
      throw new Error("A pet state object is required");
    }
    assertCharacter(input.character);
    const baseline = createInitialState(input.character, {
      now: Date.parse(input.bornAt) || now,
      generation: input.generation,
    });
    const defaultNeeds = clone(baseline.needs);
    const defaultGames = clone(baseline.games);
    const state = Object.assign(baseline, clone(input));
    state.schemaVersion = VERSION;
    state.needs = Object.assign(defaultNeeds, clone(input.needs || {}));
    NEED_KEYS.forEach((key) => { state.needs[key] = clamp(state.needs[key]); });
    state.xp = Math.max(0, Number(state.xp) || 0);
    state.stage = deriveStage(state.xp);
    state.cooldowns = clone(input.cooldowns || {});
    state.games = Object.assign(defaultGames, clone(input.games || {}));
    if (state.games.date !== dateKey(now)) {
      state.games = { date: dateKey(now), pawHuntPlays: 0, pawHuntWins: 0 };
    }
    state.games.pawHuntPlays = Math.min(GAME_DAILY_LIMIT, Math.max(0, Number(state.games.pawHuntPlays) || 0));
    state.games.pawHuntWins = Math.min(state.games.pawHuntPlays, Math.max(0, Number(state.games.pawHuntWins) || 0));
    state.room = normalizeRoom(input.room, state.xp);
    state.generationMemories = normalizeGenerationMemories(input.generationMemories, state.character, now);
    state.history = Array.isArray(input.history) ? input.history.slice(-30) : [];
    const today = dateKey(now);
    const legacyCompleted = state.history
      .filter((entry) => Number.isFinite(Date.parse(entry.at)) && dateKey(Date.parse(entry.at)) === today)
      .map((entry) => entry.action);
    const dailyCompleted = input.dailyCare?.date === today
      ? input.dailyCare.completed
      : input.dailyCare ? [] : legacyCompleted;
    state.dailyCare = {
      date: today,
      completed: [...new Set((Array.isArray(dailyCompleted) ? dailyCompleted : [])
        .filter((action) => DAILY_MISSION_ACTIONS.includes(action)))],
    };
    return state;
  }

  function tick(input, now = Date.now()) {
    const state = normalizeState(input, now);
    const previous = Date.parse(state.updatedAt) || now;
    const elapsedHours = Math.min(MAX_OFFLINE_HOURS, Math.max(0, (now - previous) / 3600000));

    Object.entries(DECAY_PER_HOUR).forEach(([key, rate]) => {
      state.needs[key] = clamp(state.needs[key] - rate * elapsedHours);
    });

    const strained = Math.min(state.needs.fullness, state.needs.energy, state.needs.cleanliness) < 15;
    state.needs.health = clamp(state.needs.health + (strained ? -2 * elapsedHours : 0.25 * elapsedHours));
    state.stage = deriveStage(state.xp);
    state.updatedAt = toIso(now);

    if (state.visualUntil && now >= Date.parse(state.visualUntil)) {
      state.currentVisual = state.needs.health < 35 ? "sick" : "idle";
      state.visualUntil = null;
    } else if (!state.visualUntil && state.needs.health < 35) {
      state.currentVisual = "sick";
    }
    return state;
  }

  function cooldownRemaining(input, actionId, now = Date.now()) {
    const until = Date.parse((input.cooldowns || {})[actionId]);
    return Number.isFinite(until) ? Math.max(0, until - now) : 0;
  }

  function updateStreak(state, now) {
    const today = dateKey(now);
    if (state.lastCareDate === today) return;
    if (state.lastCareDate) {
      const previous = new Date(`${state.lastCareDate}T00:00:00`);
      const current = new Date(`${today}T00:00:00`);
      const dayGap = Math.round((current - previous) / 86400000);
      state.careStreak = dayGap === 1 ? state.careStreak + 1 : 1;
    } else {
      state.careStreak = 1;
    }
    state.lastCareDate = today;
  }

  function applyAction(input, actionId, now = Date.now()) {
    const action = ACTIONS[actionId];
    if (!action) throw new Error(`Unknown pet action: ${actionId}`);
    const state = tick(input, now);
    const remaining = cooldownRemaining(state, actionId, now);
    if (remaining > 0) {
      return { ok: false, reason: "cooldown", remainingMs: remaining, state };
    }

    Object.entries(action.effects).forEach(([key, amount]) => {
      state.needs[key] = clamp(state.needs[key] + amount);
    });
    state.xp += action.xp;
    state.stage = deriveStage(state.xp);
    state.lastAction = actionId;
    state.lastActionAt = toIso(now);
    state.currentVisual = action.visual;
    state.visualUntil = toIso(now + (actionId === "sleep" ? 9000 : 4200));
    state.cooldowns[actionId] = toIso(now + action.cooldownMinutes * 60000);
    updateStreak(state, now);
    if (DAILY_MISSION_ACTIONS.includes(actionId) && !state.dailyCare.completed.includes(actionId)) {
      state.dailyCare.completed.push(actionId);
    }
    state.history.push({ action: actionId, at: toIso(now), xp: action.xp });
    state.history = state.history.slice(-30);
    return { ok: true, state, gainedXp: action.xp };
  }

  function deriveStatus(input, now = Date.now()) {
    const state = tick(input, now);
    if (state.needs.health < 35) return { id: "sick", label: "돌봄이 필요해요", priority: 1 };
    if (state.needs.fullness < 25) return { id: "hungry", label: "배가 고파요", priority: 2 };
    if (state.needs.energy < 25) return { id: "sleepy", label: "졸려요", priority: 3 };
    if (state.needs.cleanliness < 25) return { id: "messy", label: "빗질이 필요해요", priority: 4 };
    if (state.needs.happiness < 30) return { id: "bored", label: "같이 놀고 싶어요", priority: 5 };
    if (state.needs.affection < 30) return { id: "lonely", label: "쓰다듬어 주세요", priority: 6 };
    return { id: "content", label: "편안하고 행복해요", priority: 7 };
  }

  function getDailyCare(input, now = Date.now()) {
    const state = normalizeState(input, now);
    const today = dateKey(now);
    const completed = new Set(state.dailyCare.completed);
    const missions = DAILY_MISSION_ACTIONS.map((action) => ({ action, completed: completed.has(action) }));
    return {
      date: today,
      missions,
      completedCount: missions.filter((mission) => mission.completed).length,
      complete: missions.every((mission) => mission.completed),
    };
  }

  function getMilestones(input) {
    const state = normalizeState(input);
    return MILESTONES.map((milestone) => ({
      ...milestone,
      unlocked: state.xp >= milestone.xp,
      asset: milestone.visual === "adult"
        ? `./assets/mascot-v2/phase2a/static/${state.character}_breathe_frame_01_v01.png`
        : `${ROOT}/static/${state.character}_baby_${milestone.visual}_frame_01_v01.png`,
    }));
  }

  function playPawHunt(input, won, now = Date.now()) {
    const state = tick(input, now);
    if (state.games.pawHuntPlays >= GAME_DAILY_LIMIT) {
      return { ok: false, reason: "daily_limit", state, remaining: 0 };
    }
    const isWin = Boolean(won);
    const gainedXp = isWin ? 15 : 5;
    state.games.pawHuntPlays += 1;
    if (isWin) state.games.pawHuntWins += 1;
    state.xp += gainedXp;
    state.stage = deriveStage(state.xp);
    state.needs.happiness = clamp(state.needs.happiness + (isWin ? 12 : 5));
    state.needs.affection = clamp(state.needs.affection + (isWin ? 6 : 2));
    state.lastAction = "paw_hunt";
    state.lastActionAt = toIso(now);
    state.currentVisual = "play";
    state.visualUntil = toIso(now + 4200);
    updateStreak(state, now);
    state.history.push({ action: "paw_hunt", at: toIso(now), xp: gainedXp, won: isWin });
    state.history = state.history.slice(-30);
    return {
      ok: true,
      won: isWin,
      state,
      gainedXp,
      remaining: GAME_DAILY_LIMIT - state.games.pawHuntPlays,
    };
  }

  function getRoomCatalog(input) {
    const state = normalizeState(input);
    return ROOM_SLOT_ORDER.map((slot) => ({
      slot,
      selected: state.room[slot],
      items: ROOM_CATALOG[slot].map((item) => ({
        ...item,
        unlocked: state.xp >= item.minXp,
        selected: state.room[slot] === item.id,
      })),
    }));
  }

  function getRoomSummary(input) {
    const state = normalizeState(input);
    const catalog = getRoomCatalog(state);
    const allItems = catalog.flatMap((entry) => entry.items);
    const locked = allItems.filter((item) => !item.unlocked).sort((a, b) => a.minXp - b.minXp);
    return {
      room: clone(state.room),
      unlockedCount: allItems.length - locked.length,
      totalCount: allItems.length,
      nextUnlockXp: locked[0]?.minXp ?? null,
    };
  }

  function setRoomItem(input, slot, itemId, now = Date.now()) {
    if (!ROOM_SLOT_ORDER.includes(slot)) throw new Error(`Unknown room slot: ${slot}`);
    const state = tick(input, now);
    const item = ROOM_CATALOG[slot].find((candidate) => candidate.id === itemId);
    if (!item) throw new Error(`Unknown room item: ${itemId}`);
    if (state.xp < item.minXp) {
      return { ok: false, reason: "locked", requiredXp: item.minXp, state };
    }
    state.room[slot] = item.id;
    state.history.push({ action: "room_customize", slot, item: item.id, at: toIso(now) });
    state.history = state.history.slice(-30);
    return { ok: true, state, slot, item };
  }

  function resolveAsset(input, options = {}) {
    const state = normalizeState(input);
    const reducedMotion = Boolean(options.reducedMotion);
    if (state.stage === "adult") {
      return {
        stage: "adult",
        handoff: "mascot-v2",
        character: state.character,
        action: "breathe",
        src: `./assets/mascot-v2/phase2a/${reducedMotion ? "static" : "webp"}/${state.character}_breathe_${reducedMotion ? "frame_01_v01.png" : "512_v01.webp"}`,
      };
    }
    const visual = state.needs.health < 35 && !state.visualUntil ? "sick" : state.currentVisual || "idle";
    const id = `${state.character}_baby_${visual}`;
    return {
      stage: "kitten",
      handoff: null,
      character: state.character,
      action: visual,
      src: `${ROOT}/${reducedMotion ? "static" : "webp"}/${id}_${reducedMotion ? "frame_01_v01.png" : "512_v01.webp"}`,
      fallback: `${ROOT}/static/${id}_frame_01_v01.png`,
    };
  }

  function createGenerationMemory(input, now = Date.now()) {
    const state = normalizeState(input, now);
    return normalizeGenerationMemories([{
      generation: state.generation,
      bornAt: state.bornAt,
      completedAt: toIso(now),
      finalXp: state.xp,
      finalStage: state.stage,
      finalVisual: state.currentVisual,
      careStreak: state.careStreak,
      milestonesUnlocked: getMilestones(state).filter((milestone) => milestone.unlocked).length,
      room: state.room,
    }], state.character, now)[0];
  }

  function getGenerationMemories(input) {
    const state = normalizeState(input);
    return clone(state.generationMemories).sort((a, b) => b.generation - a.generation || Date.parse(b.completedAt) - Date.parse(a.completedAt));
  }

  function getGenerationMemorySummary(input) {
    const memories = getGenerationMemories(input);
    return {
      total: memories.length,
      adultCount: memories.filter((memory) => memory.finalStage === "adult").length,
      highestXp: memories.reduce((highest, memory) => Math.max(highest, memory.finalXp), 0),
      latestGeneration: memories[0]?.generation ?? null,
    };
  }

  function resolveGenerationMemoryAsset(input) {
    const character = input?.character;
    assertCharacter(character);
    if (input.finalStage === "adult") {
      return `./assets/mascot-v2/phase2a/static/${character}_breathe_frame_01_v01.png`;
    }
    const visual = MEMORY_VISUALS.includes(input.finalVisual) ? input.finalVisual : "idle";
    return `${ROOT}/static/${character}_baby_${visual}_frame_01_v01.png`;
  }

  function getResetToken(character) {
    assertCharacter(character);
    return `${DISPLAY_NAMES[character]} 다시 키우기`;
  }

  function resetToKitten(input, confirmation, now = Date.now()) {
    const current = normalizeState(input, now);
    if (confirmation !== getResetToken(current.character)) {
      throw new Error("Reset confirmation does not match this pet");
    }
    const next = createInitialState(current.character, {
      now,
      generation: current.generation + 1,
      generationMemories: [...current.generationMemories, createGenerationMemory(current, now)],
    });
    next.history.push({ action: "rebirth", at: toIso(now), fromGeneration: current.generation });
    return next;
  }

  function loadAll() {
    let parsed = {};
    try {
      parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_error) {
      parsed = {};
    }
    const pets = {};
    CHARACTERS.forEach((character) => {
      try {
        pets[character] = tick(parsed[character] || createInitialState(character));
      } catch (_error) {
        pets[character] = createInitialState(character);
      }
    });
    return pets;
  }

  function saveAll(pets) {
    const normalized = {};
    CHARACTERS.forEach((character) => {
      normalized[character] = normalizeState(pets[character] || createInitialState(character));
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function savePet(input) {
    const pets = loadAll();
    const state = normalizeState(input);
    pets[state.character] = state;
    saveAll(pets);
    return state;
  }

  window.BudgetPetNursery = Object.freeze({
    VERSION,
    STORAGE_KEY,
    CHARACTERS,
    NEED_KEYS,
    ACTIONS,
    MAX_OFFLINE_HOURS,
    ADULT_XP,
    GAME_DAILY_LIMIT,
    DAILY_MISSION_ACTIONS,
    MILESTONES,
    ROOM_SLOT_ORDER,
    ROOM_CATALOG,
    MEMORY_VISUALS,
    createInitialState,
    normalizeState,
    tick,
    applyAction,
    cooldownRemaining,
    deriveStatus,
    getDailyCare,
    getMilestones,
    playPawHunt,
    getRoomCatalog,
    getRoomSummary,
    setRoomItem,
    resolveAsset,
    createGenerationMemory,
    getGenerationMemories,
    getGenerationMemorySummary,
    resolveGenerationMemoryAsset,
    getResetToken,
    resetToKitten,
    loadAll,
    saveAll,
    savePet,
  });
})();
