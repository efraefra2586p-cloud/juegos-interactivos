// Datos del apartado "Aventuras": sesiones, intentos, uso del rincón
// tranquilo, niveles por juego, estrellas con su motivo, ajustes y notas de
// los padres. Todo queda SOLO en este dispositivo (localStorage), bajo una
// clave propia, separado del progreso general de los juegos. No guarda
// ningún informe ni dato clínico: solo el uso de la app.
const AvStore = (() => {
  const KEY = "ji_aventura_v1";
  const MAX_INTENTOS = 800;
  const MAX_SESIONES = 300;

  function defaultSettings() {
    return {
      sessionMin: 15,
      activeGames: null, // null = todos los del modo del perfil
      speed: "slow", // ritmo de los juegos con velocidad: slow | normal
      volume: 0.8,
      music: false,
      reduceMotion: false,
      trazoChars: null, // null = prioridad por defecto
      words: [], // palabras o frases extra que los padres quieren practicar
      routines: null, // null = rutinas por defecto
      premios: [] // [{ stars, text }]
    };
  }

  function defaultProfile() {
    return {
      settings: defaultSettings(),
      sesiones: [],
      intentos: [],
      calma: [],
      levels: {},
      recompensa: { estrellas: 0, motivos: {}, stickers: [], reclamados: [] },
      notas: {}
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { pin: null, profiles: {} };
      const parsed = JSON.parse(raw);
      return { pin: parsed.pin || null, profiles: parsed.profiles || {} };
    } catch (e) {
      return { pin: null, profiles: {} };
    }
  }

  let state = load();

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // sin almacenamiento disponible: seguimos sin guardar
    }
  }

  function get(pid) {
    if (!state.profiles[pid]) state.profiles[pid] = defaultProfile();
    const p = state.profiles[pid];
    // completar campos que falten (datos guardados por una versión anterior)
    const d = defaultProfile();
    p.settings = { ...d.settings, ...(p.settings || {}) };
    p.sesiones = p.sesiones || [];
    p.intentos = p.intentos || [];
    p.calma = p.calma || [];
    p.levels = p.levels || {};
    p.recompensa = { ...d.recompensa, ...(p.recompensa || {}) };
    p.notas = p.notas || {};
    return p;
  }

  function settings(pid) {
    return get(pid).settings;
  }

  function setSettings(pid, patch) {
    const p = get(pid);
    p.settings = { ...p.settings, ...patch };
    persist();
    return p.settings;
  }

  function newId() {
    return "s" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
  }

  function startSession(pid, emocionInicio) {
    const p = get(pid);
    const s = { id: newId(), fecha: new Date().toISOString(), emocionInicio: emocionInicio || null, emocionFin: null, agenda: [], duracionSeg: 0 };
    p.sesiones.push(s);
    if (p.sesiones.length > MAX_SESIONES) p.sesiones.shift();
    persist();
    return s;
  }

  function updateSession(pid, sessionId, patch) {
    const s = get(pid).sesiones.find((x) => x.id === sessionId);
    if (s) {
      Object.assign(s, patch);
      persist();
    }
  }

  function addIntento(pid, intento) {
    const p = get(pid);
    p.intentos.push({ fecha: new Date().toISOString(), ...intento });
    if (p.intentos.length > MAX_INTENTOS) p.intentos.shift();
    persist();
  }

  function addCalma(pid, sessionId, herramienta) {
    get(pid).calma.push({ fecha: new Date().toISOString(), sesionId: sessionId || null, herramienta });
    persist();
  }

  function getLevel(pid, gameId) {
    return get(pid).levels[gameId] || 1;
  }

  function setLevel(pid, gameId, level) {
    get(pid).levels[gameId] = Math.max(1, level);
    persist();
  }

  function addStars(pid, motivo, n) {
    const r = get(pid).recompensa;
    r.estrellas += n;
    r.motivos[motivo] = (r.motivos[motivo] || 0) + n;
    persist();
    return r.estrellas;
  }

  function stars(pid) {
    return get(pid).recompensa.estrellas;
  }

  function grantSticker(pid, sticker) {
    const r = get(pid).recompensa;
    if (!r.stickers.includes(sticker)) {
      r.stickers.push(sticker);
      persist();
      return true;
    }
    return false;
  }

  function stickers(pid) {
    return get(pid).recompensa.stickers;
  }

  // Premios que los padres definieron ("10 estrellas = elegir el postre")
  // y que ya se alcanzaron pero todavía no se le han mostrado.
  function newPremios(pid) {
    const p = get(pid);
    const total = p.recompensa.estrellas;
    const out = [];
    (p.settings.premios || []).forEach((prem, i) => {
      const key = `${i}:${prem.stars}:${prem.text}`;
      if (total >= prem.stars && !p.recompensa.reclamados.includes(key)) {
        out.push({ key, ...prem });
      }
    });
    return out;
  }

  function markPremio(pid, key) {
    const r = get(pid).recompensa;
    if (!r.reclamados.includes(key)) {
      r.reclamados.push(key);
      persist();
    }
  }

  function setNote(pid, day, text) {
    const n = get(pid).notas;
    if (text && text.trim()) n[day] = text.trim();
    else delete n[day];
    persist();
  }

  // ---- PIN de los padres (protege el panel; es una barrera para niños, no
  // seguridad fuerte: todo vive en el dispositivo) ----
  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return String(h);
  }

  function hasPin() {
    return !!state.pin;
  }

  function setPin(pin) {
    state.pin = hash(String(pin));
    persist();
  }

  function checkPin(pin) {
    return state.pin === hash(String(pin));
  }

  function dayKey(d) {
    const x = d ? new Date(d) : new Date();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${x.getFullYear()}-${m}-${day}`;
  }

  return {
    get,
    settings,
    setSettings,
    startSession,
    updateSession,
    addIntento,
    addCalma,
    getLevel,
    setLevel,
    addStars,
    stars,
    grantSticker,
    stickers,
    newPremios,
    markPremio,
    setNote,
    hasPin,
    setPin,
    checkPin,
    dayKey
  };
})();
