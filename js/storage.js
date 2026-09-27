// Capa de persistencia. Todo el estado del jugador vive en localStorage
// bajo una sola clave. Los juegos nunca deben tocar localStorage directo.
//
// Perfiles: son dinámicos (se pueden agregar jugadores nuevos), pero la
// dificultad de cada juego solo conoce dos "arquetipos" de edad: "5" y "8"
// (ver DIFFICULTY en cada js/games/*.js). Por eso cada perfil guarda un
// `ageGroup` ("5" o "8") además de su nombre/emoji propios — el `ageGroup`
// es lo que se le pasa a `Game.start(ageGroup, level, els)`, nunca el id
// real del perfil (que puede ser cualquier string).
const Storage = (() => {
  const KEY = "ji_state_v1";

  function defaultState() {
    return {
      activeProfile: null,
      profileOrder: ["5", "8"],
      profiles: {
        "5": { name: "Sergio", emoji: "🐣", ageGroup: "5", stars: 0, games: {} },
        "8": { name: "Luciano", emoji: "🦁", ageGroup: "8", stars: 0, games: {} }
      }
    };
  }

  // Compatibilidad con el formato anterior (perfiles fijos "5"/"8" sin
  // nombre/emoji/ageGroup propios) — les agrega esos campos sin tocar sus
  // estrellas/progreso ya guardados.
  function migrate(state) {
    if (!state.profileOrder) state.profileOrder = Object.keys(state.profiles);
    const NAME_BY_ID = { "5": "Sergio", "8": "Luciano" };
    const EMOJI_BY_ID = { "5": "🐣", "8": "🦁" };
    Object.keys(state.profiles).forEach((id) => {
      const p = state.profiles[id];
      if (!p.ageGroup) p.ageGroup = id === "8" ? "8" : "5";
      if (!p.name) p.name = NAME_BY_ID[id] || "Jugador";
      if (!p.emoji) p.emoji = EMOJI_BY_ID[id] || "🙂";
      if (!p.games) p.games = {};
      if (typeof p.stars !== "number") p.stars = 0;
      // Apartado "Aventuras": "full" (todo) para el perfil "8" de fábrica,
      // "lite" (versión reducida) para el "5". Los perfiles nuevos no lo
      // tienen hasta que un adulto lo active. null = desactivado a propósito.
      if (p.aventura === undefined) p.aventura = id === "8" ? "full" : id === "5" ? "lite" : null;
    });
    return state;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return migrate(defaultState());
      const parsed = JSON.parse(raw);
      const base = defaultState();
      const merged = {
        ...base,
        ...parsed,
        profiles: { ...base.profiles, ...(parsed.profiles || {}) }
      };
      return migrate(merged);
    } catch (e) {
      return migrate(defaultState());
    }
  }

  function persist(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage no disponible (modo privado, etc.) — seguimos sin guardar
    }
  }

  let state = load();

  function get() {
    return state;
  }

  function listProfiles() {
    return state.profileOrder
      .filter((id) => state.profiles[id])
      .map((id) => ({ id, ...state.profiles[id] }));
  }

  function createProfile(name, emoji, ageGroup) {
    const id = "p_" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
    state.profiles[id] = { name: name.trim() || "Jugador", emoji, ageGroup, stars: 0, games: {}, aventura: null };
    state.profileOrder.push(id);
    persist(state);
    return id;
  }

  function setActiveProfile(id) {
    state.activeProfile = id;
    persist(state);
  }

  function getActiveProfile() {
    return state.activeProfile;
  }

  function getProfileData(id) {
    const pid = id || state.activeProfile;
    if (!pid) return null;
    return state.profiles[pid] || null;
  }

  function getGameData(gameId, profileId) {
    const profile = getProfileData(profileId);
    if (!profile) return null;
    if (!profile.games[gameId]) profile.games[gameId] = { stars: 0, plays: 0, level: "medio" };
    if (!profile.games[gameId].level) profile.games[gameId].level = "medio";
    return profile.games[gameId];
  }

  function addStars(gameId, count) {
    const profile = getProfileData();
    if (!profile) return;
    const game = getGameData(gameId);
    game.stars += count;
    game.plays += 1;
    profile.stars += count;
    persist(state);
  }

  function getLevel(gameId) {
    const game = getGameData(gameId);
    return game ? game.level : "medio";
  }

  function setLevel(gameId, level) {
    const game = getGameData(gameId);
    if (!game) return;
    game.level = level;
    persist(state);
  }

  function clearProfile() {
    state.activeProfile = null;
    persist(state);
  }

  function setAventura(profileId, mode) {
    const p = state.profiles[profileId];
    if (!p) return;
    p.aventura = mode || null;
    persist(state);
  }

  return {
    setAventura,
    get,
    listProfiles,
    createProfile,
    setActiveProfile,
    getActiveProfile,
    getProfileData,
    getGameData,
    addStars,
    getLevel,
    setLevel,
    clearProfile
  };
})();
