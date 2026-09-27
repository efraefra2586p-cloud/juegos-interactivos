// Motor del apartado "Aventuras". Cada juego es un módulo pequeño que se
// registra con Aventura.register({...}) y recibe un `ctx` con todo lo común:
//   - pantalla estándar: instrucción arriba (pictograma + frase + 🔊),
//     juego al centro, progreso + botón de pausa abajo (siempre visible)
//   - avisos de "quedan N rondas / última ronda"
//   - pausa con rincón tranquilo (vuelve exactamente donde estaba)
//   - dificultad adaptativa (3 aciertos seguidos sin ayuda: sube; 2 errores
//     seguidos: baja) y "la última ronda siempre es un poco más fácil"
//   - estrellas por esfuerzo/calma (nunca se quitan), registro de intentos
//   - misión del día: check-in, agenda visual "primero / después", pausa activa
// Principios: sin límite de tiempo oculto, sin castigo, sin "game over",
// diseño sensorial tranquilo (ver css/aventura.css).
const Aventura = (() => {
  const games = {};
  let hooks = null;
  let el = {};
  let run = null;
  let mission = null;
  let overlayToken = 0;
  const timers = new Set();
  let tapTimes = [];
  let lastPauseOffer = 0;

  const EMOTIONS = [
    { id: "feliz", emoji: "😀", label: "Feliz" },
    { id: "tranquilo", emoji: "🙂", label: "Tranquilo" },
    { id: "enojado", emoji: "😠", label: "Enojado" },
    { id: "triste", emoji: "😢", label: "Triste" }
  ];

  const AREAS = {
    atencion: "Atención y autocontrol",
    letras: "Letras y sonidos",
    numeros: "Números",
    emociones: "Emociones",
    rutinas: "Rutinas",
    ingles: "Inglés"
  };

  // Álbum de colección: números, animales y palabras en inglés
  const STICKERS = [
    { id: "🐶", en: "Dog" }, { id: "🐱", en: "Cat" }, { id: "🦁", en: "Lion" },
    { id: "🐼", en: "Panda" }, { id: "🐸", en: "Frog" }, { id: "🦊", en: "Fox" },
    { id: "🐢", en: "Turtle" }, { id: "🦄", en: "Unicorn" }, { id: "🐙", en: "Octopus" },
    { id: "🦋", en: "Butterfly" }, { id: "🐝", en: "Bee" }, { id: "🐳", en: "Whale" },
    { id: "1️⃣", en: "One" }, { id: "2️⃣", en: "Two" }, { id: "3️⃣", en: "Three" },
    { id: "4️⃣", en: "Four" }, { id: "5️⃣", en: "Five" }, { id: "6️⃣", en: "Six" },
    { id: "7️⃣", en: "Seven" }, { id: "8️⃣", en: "Eight" }, { id: "9️⃣", en: "Nine" },
    { id: "🍎", en: "Apple" }, { id: "🌞", en: "Sun" }, { id: "🚀", en: "Rocket" }
  ];

  // ---------- utilidades para los juegos ----------
  const util = {
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },
    randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    },
    sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }
  };

  function register(def) {
    games[def.id] = def;
  }

  function currentProfile() {
    const id = Storage.getActiveProfile();
    const data = Storage.getProfileData();
    return data ? { id, ...data } : null;
  }

  function gamesFor(mode, pid) {
    const sett = pid ? AvStore.settings(pid) : null;
    return Object.values(games).filter((g) => {
      if (!(g.modes || ["full"]).includes(mode)) return false;
      if (sett && sett.activeGames && !sett.activeGames.includes(g.id)) return false;
      return true;
    });
  }

  // ---------- ajustes globales (volumen, movimiento) ----------
  function applySettings(profile) {
    profile = profile || currentProfile();
    const on = profile && profile.aventura;
    const s = on ? AvStore.settings(profile.id) : null;
    GameAudio.setVolume(s ? s.volume : 1);
    Speech.setVolume(s ? s.volume : 1);
    Speech.setRate(on ? 0.88 : 0.95);
    document.documentElement.classList.toggle("reduce-motion", !!(s && s.reduceMotion));
  }

  // ---------- estructura de la pantalla ----------
  function init(h) {
    hooks = h;
    const root = document.getElementById("screen-aventura");
    root.innerHTML = `
      <div class="av-top">
        <button class="icon-btn" id="av-exit" title="Salir">⬅️</button>
        <div class="av-instruction">
          <span class="av-picto" id="av-picto"></span>
          <span class="av-text" id="av-text"></span>
        </div>
        <button class="icon-btn" id="av-say" title="Escuchar otra vez">🔊</button>
      </div>
      <div class="av-toast hidden" id="av-toast"></div>
      <div class="av-stage" id="av-stage"></div>
      <div class="av-bottom">
        <div class="av-progress">
          <div class="av-bar"><div class="av-bar-fill" id="av-bar-fill"></div></div>
          <span class="av-progress-text" id="av-progress-text"></span>
        </div>
        <button class="av-pause" id="av-pause"><span class="av-pause-icon">✋</span><span class="av-pause-label">Necesito una pausa</span></button>
      </div>
      <div class="av-overlay hidden" id="av-overlay"></div>`;
    el = {
      root,
      picto: root.querySelector("#av-picto"),
      text: root.querySelector("#av-text"),
      toast: root.querySelector("#av-toast"),
      stage: root.querySelector("#av-stage"),
      fill: root.querySelector("#av-bar-fill"),
      ptext: root.querySelector("#av-progress-text"),
      overlay: root.querySelector("#av-overlay"),
      bottom: root.querySelector(".av-bottom"),
      pause: root.querySelector("#av-pause")
    };
    root.querySelector("#av-exit").addEventListener("click", () => {
      GameAudio.playClick();
      exit();
    });
    root.querySelector("#av-say").addEventListener("click", () => {
      if (run && run.onReplay) run.onReplay();
      else if (run && run.spoken) Speech.speak(run.spoken);
      else if (el.text.textContent) Speech.speak(el.text.textContent);
    });
    el.pause.addEventListener("click", () => {
      GameAudio.playClick();
      openPause();
    });
    // detectar toques muy rápidos (posible frustración) sin estorbar el juego
    el.stage.addEventListener(
      "pointerdown",
      () => {
        const now = Date.now();
        tapTimes = tapTimes.filter((t) => now - t < 2500);
        tapTimes.push(now);
        if (tapTimes.length >= 9) {
          tapTimes = [];
          offerPause();
        }
      },
      true
    );
  }

  // ---------- temporizadores que se congelan con la pausa ----------
  function later(ms, fn) {
    const t = { fn, remaining: ms, started: performance.now(), handle: null };
    t.handle = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  }

  function cancelLater(t) {
    if (!t) return;
    clearTimeout(t.handle);
    timers.delete(t);
  }

  function freezeTimers() {
    timers.forEach((t) => {
      clearTimeout(t.handle);
      t.remaining -= performance.now() - t.started;
    });
  }

  function thawTimers() {
    timers.forEach((t) => {
      t.started = performance.now();
      t.handle = setTimeout(() => {
        timers.delete(t);
        t.fn();
      }, Math.max(0, t.remaining));
    });
  }

  function clearTimers() {
    timers.forEach((t) => clearTimeout(t.handle));
    timers.clear();
  }

  // ---------- overlays (tarjetas de anticipación, check-in, pausa...) ----------
  function showOverlay(html) {
    overlayToken++;
    // siempre hay una salida a la vista: nadie queda "atrapado" en una tarjeta
    el.overlay.innerHTML = `<button class="icon-btn av-overlay-exit" title="Salir">⬅️</button>${html}`;
    el.overlay.classList.remove("hidden");
    el.overlay.querySelector(".av-overlay-exit").addEventListener("click", () => {
      GameAudio.playClick();
      exit();
    });
    return el.overlay;
  }

  function hideOverlay() {
    overlayToken++;
    el.overlay.classList.add("hidden");
    el.overlay.innerHTML = "";
  }

  // Tarjeta con botones; devuelve una promesa con el `value` del botón elegido.
  function card({ picto, title, text, demo, buttons, speak, mascot }) {
    return new Promise((resolve) => {
      const btns = (buttons || [{ label: "Seguir", value: true, primary: true }])
        .map((b, i) => `<button class="av-btn ${b.primary ? "av-btn-primary" : "av-btn-soft"}" data-i="${i}">${b.emoji ? `<span class="av-btn-emoji">${b.emoji}</span>` : ""}<span>${b.label}</span></button>`)
        .join("");
      const root = showOverlay(`
        <div class="av-card">
          ${mascot ? `<div class="av-mascot">🦊</div>` : ""}
          ${picto ? `<div class="av-card-picto">${picto}</div>` : ""}
          ${title ? `<h2 class="av-card-title">${title}</h2>` : ""}
          ${text ? `<div class="av-card-text">${text}</div>` : ""}
          ${demo ? `<div class="av-demo">${demo}</div>` : ""}
          <div class="av-card-buttons">${btns}</div>
        </div>`);
      const list = buttons || [{ label: "Seguir", value: true }];
      root.querySelectorAll(".av-btn").forEach((b) => {
        b.addEventListener("click", () => {
          GameAudio.playClick();
          Speech.stop();
          resolve(list[Number(b.dataset.i)].value);
        });
      });
      if (speak) Speech.speak(speak);
    });
  }

  // ---------- estrellas ----------
  function giveStars(reason, n, label) {
    if (!run && !mission) return;
    const pid = (run && run.pid) || (mission && mission.pid);
    AvStore.addStars(pid, reason, n);
    Storage.addStars("aventura", n);
    if (run) run.stars += n;
    if (mission) mission.stars += n;
    if (label) toast(`⭐ ${label}`);
  }

  function toast(text, ms) {
    if (!el.toast) return;
    el.toast.textContent = text;
    el.toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.toast.classList.add("hidden"), ms || 2600);
  }

  // ---------- instrucción y progreso ----------
  function setInstruction(picto, text, spoken) {
    el.picto.textContent = picto || "";
    el.text.textContent = text || "";
    if (run) run.spoken = spoken || text;
  }

  function setProgress(done, total) {
    if (run) run.done = done;
    const t = total || (run && run.total) || 1;
    el.fill.style.width = `${Math.min(100, Math.round((done / t) * 100))}%`;
    const left = t - done;
    let label = `${done} de ${t}`;
    if (left === 2) label = "Quedan 2 rondas";
    else if (left === 1) label = "¡Última ronda!";
    else if (left <= 0) label = "¡Terminaste!";
    el.ptext.textContent = label;
    if (left === 2 && done > 0) toast("Quedan 2 rondas 🙂", 2200);
    else if (left === 1) toast("Última ronda 🏁", 2200);
  }

  // ---------- dificultad adaptativa ----------
  function recordAttempt(a) {
    if (!run) return;
    const ok = !!a.ok;
    if (ok) run.aciertos++;
    else run.errores++;
    if (a.helped) run.ayudas++;
    if (a.impulsive) run.impulsivos++;
    if (ok && !a.helped) {
      run.streakOk++;
      run.streakBad = 0;
      run.consecErr = 0;
      if (run.streakOk >= 3 && run.level < (run.def.maxLevel || 3)) {
        run.level++;
        run.streakOk = 0;
      }
    } else if (!ok) {
      run.streakOk = 0;
      run.streakBad++;
      run.consecErr++;
      if (run.streakBad >= 2 && run.level > 1) {
        run.level--;
        run.streakBad = 0;
      }
      if (run.consecErr >= 3) {
        run.consecErr = 0;
        offerPause();
      }
    } else {
      run.streakOk = 0;
    }
  }

  // Oferta amable de pausa (no bloquea el juego).
  function offerPause() {
    if (!run || run.paused || Date.now() - lastPauseOffer < 90000) return;
    lastPauseOffer = Date.now();
    const bar = document.createElement("div");
    bar.className = "av-offer";
    bar.innerHTML = `<span>¿Quieres una pausa? 🌿</span><button class="av-btn av-btn-primary av-btn-small" data-y="1">✋ Sí</button><button class="av-btn av-btn-soft av-btn-small" data-y="0">Seguir</button>`;
    el.root.appendChild(bar);
    const close = () => bar.remove();
    bar.querySelector('[data-y="1"]').addEventListener("click", () => {
      close();
      openPause();
    });
    bar.querySelector('[data-y="0"]').addEventListener("click", close);
    setTimeout(close, 12000);
  }

  // ---------- contexto que reciben los juegos ----------
  function makeCtx(def) {
    const sett = AvStore.settings(run.pid);
    const ctx = {
      def,
      pid: run.pid,
      profile: run.profile,
      ageGroup: run.profile.ageGroup,
      mode: run.profile.aventura,
      settings: sett,
      speed: sett.speed,
      total: run.total,
      util,
      stage: el.stage,
      getLevel: () => run.level,
      // en la última ronda se baja un paso: cada juego termina con un acierto
      itemLevel: () => (run.done >= run.total - 1 && run.level > 1 ? run.level - 1 : run.level),
      isLast: () => run.done >= run.total - 1,
      setInstruction,
      progress: (done) => setProgress(done, run.total),
      setTotal: (n) => {
        run.total = n;
        ctx.total = n;
      },
      say: (text, cb) => Speech.speak(text, undefined, cb),
      onReplay: (fn) => {
        run.onReplay = fn;
      },
      attempt: recordAttempt,
      reward: (reason, n, label) => giveStars(reason, n || 1, label),
      later,
      cancelLater,
      toast,
      draggable: makeDraggable,
      complete: (extra) => finishRun(extra),
      // abre el rincón tranquilo desde dentro de un juego; al volver llama cb
      openCalm: (cb) => {
        if (!run) return;
        run.onResume = cb || null;
        openPause();
      },
      isPaused: () => run.paused
    };
    return ctx;
  }

  // ---------- ciclo de vida de una actividad ----------
  function runGame(def, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      stopRun();
      const profile = currentProfile();
      const pid = profile.id;
      const sett = AvStore.settings(pid);
      const baseLevel = AvStore.getLevel(pid, def.id);
      const level = util.clamp(baseLevel + (opts.levelBias || 0), 1, def.maxLevel || 3);
      const total = def.items ? def.items(sett, level) : 6;
      run = {
        def,
        pid,
        profile,
        level,
        startLevel: level,
        total,
        done: 0,
        aciertos: 0,
        errores: 0,
        ayudas: 0,
        impulsivos: 0,
        streakOk: 0,
        streakBad: 0,
        consecErr: 0,
        stars: 0,
        startedAt: Date.now(),
        sessionId: mission ? mission.sessionId : null,
        paused: false,
        cleanup: null,
        resolve,
        finished: false,
        onReplay: null,
        spoken: ""
      };
      hideOverlay();
      el.stage.innerHTML = "";
      el.stage.className = `av-stage av-stage-${def.id}`;
      el.pause.classList.remove("hidden");
      setInstruction(def.emoji, def.intro ? def.intro.text : def.name);
      setProgress(0, total);
      hooks.show("aventura");
      const ctx = makeCtx(def);
      run.cleanup = def.mount(el.stage, ctx) || null;
    });
  }

  function finishRun(extra) {
    if (!run || run.finished) return;
    run.finished = true;
    const r = run;
    const dur = Math.round((Date.now() - r.startedAt) / 1000);
    giveStars("terminar", 1);
    AvStore.addIntento(r.pid, {
      sesionId: r.sessionId,
      juegoId: r.def.id,
      area: r.def.area,
      nivel: r.startLevel,
      aciertos: r.aciertos,
      errores: r.errores,
      ayudasUsadas: r.ayudas,
      erroresImpulsivos: r.impulsivos,
      completado: true,
      duracionSeg: dur,
      extra: extra || null
    });
    AvStore.setLevel(r.pid, r.def.id, r.level);
    const newSticker = grantRandomSticker(r.pid);
    if (r.cleanup) {
      try {
        r.cleanup();
      } catch (e) {
        /* limpieza best-effort */
      }
    }
    clearTimers();
    setProgress(r.total, r.total);
    run = null;
    r.resolve({ completed: true, stars: r.stars, sticker: newSticker, level: r.level, aciertos: r.aciertos, errores: r.errores });
  }

  function stopRun() {
    if (!run) {
      clearTimers();
      return;
    }
    const r = run;
    run = null;
    if (r.cleanup) {
      try {
        r.cleanup();
      } catch (e) {
        /* limpieza best-effort */
      }
    }
    clearTimers();
    if (!r.finished) r.resolve({ completed: false, exited: true, stars: r.stars });
  }

  function grantRandomSticker(pid) {
    const owned = AvStore.stickers(pid);
    const left = STICKERS.filter((s) => !owned.includes(s.id));
    if (!left.length) return null;
    const s = util.pick(left);
    AvStore.grantSticker(pid, s.id);
    return s;
  }

  // ---------- pausa y rincón tranquilo ----------
  function openPause() {
    if (!run || run.paused) return;
    run.paused = true;
    freezeTimers();
    Speech.stop();
    GameAudio.playSoftBell();
    if (AvStore.settings(run.pid).music) GameAudio.startAmbient();
    pauseMenu(false);
  }

  function pauseMenu(usedCalm) {
    const p = card({
      picto: "🌿",
      title: "Tómate un ratito",
      text: usedCalm ? "¡Lo lograste! Usaste tu calma ⭐" : "Aquí puedes descansar. Tu juego te espera.",
      buttons: [
        { emoji: "🎈", label: "Respirar con el globo", value: "respirar" },
        { emoji: "🔢", label: "Contar hasta 10", value: "contar" },
        { emoji: "🐱", label: "Estirarme un poquito", value: "estirar" },
        { emoji: "▶️", label: "Volver al juego", value: "volver", primary: true }
      ],
      speak: usedCalm ? "Lo lograste. Usaste tu calma." : "Tómate un ratito. Tu juego te espera."
    });
    p.then(async (choice) => {
      if (!run) return;
      if (choice === "volver") {
        resumeFromPause();
      } else if (choice === "respirar") {
        await breathing();
        calmDone("globo");
      } else if (choice === "contar") {
        await counting();
        calmDone("contar");
      } else if (choice === "estirar") {
        const r = await guidedStretch();
        if (r === "hecho") calmDone("estirar");
        else pauseMenu(false);
      }
    });
  }

  function calmDone(tool) {
    if (!run) return;
    AvStore.addCalma(run.pid, run.sessionId, tool);
    giveStars("calma", 1);
    pauseMenu(true);
  }

  function resumeFromPause() {
    hideOverlay();
    GameAudio.stopAmbient();
    if (!run) return;
    run.paused = false;
    thawTimers();
    const back = run.onResume;
    run.onResume = null;
    if (back) back();
  }

  // Respiración guiada con un globo: inhala 4 s, exhala 4 s, 5 veces.
  function breathing() {
    return new Promise((resolve) => {
      let cycles = 5;
      showOverlay(`
        <div class="av-card av-calm">
          <div class="av-balloon" id="av-balloon">🎈</div>
          <h2 class="av-card-title" id="av-breath-text">Inhala…</h2>
          <div class="av-dots" id="av-breath-dots">${"<span></span>".repeat(cycles)}</div>
          <button class="av-btn av-btn-soft" id="av-breath-stop">Terminar</button>
        </div>`);
      const balloon = el.overlay.querySelector("#av-balloon");
      const text = el.overlay.querySelector("#av-breath-text");
      const dots = el.overlay.querySelectorAll("#av-breath-dots span");
      const token = overlayToken;
      let finished = false;
      const end = () => {
        if (finished) return;
        finished = true;
        resolve();
      };
      el.overlay.querySelector("#av-breath-stop").addEventListener("click", end);
      Speech.speak("Inhala despacio… y suelta el aire despacio.");
      const step = (i) => {
        if (finished || token !== overlayToken) return end();
        if (i >= cycles * 2) return end();
        const inhale = i % 2 === 0;
        text.textContent = inhale ? "Inhala…" : "Exhala…";
        balloon.style.transform = inhale ? "scale(1.5)" : "scale(1)";
        if (!inhale) dots[Math.floor(i / 2)].classList.add("on");
        setTimeout(() => step(i + 1), 4000);
      };
      setTimeout(() => step(0), 1800);
    });
  }

  // Contar hasta 10 con objetos: uno por cada toque.
  function counting() {
    return new Promise((resolve) => {
      const objs = util.pick(["⭐", "🍎", "🐟", "🌼", "🐣"]);
      showOverlay(`
        <div class="av-card av-calm">
          <div class="av-count-row" id="av-count-row"></div>
          <h2 class="av-card-title" id="av-count-text">Toca y cuenta conmigo</h2>
          <button class="av-btn av-btn-primary" id="av-count-btn">${objs} Uno más</button>
        </div>`);
      const row = el.overlay.querySelector("#av-count-row");
      const text = el.overlay.querySelector("#av-count-text");
      const btn = el.overlay.querySelector("#av-count-btn");
      const NAMES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];
      let n = 0;
      btn.addEventListener("click", () => {
        if (n >= 10) return;
        n++;
        const s = document.createElement("span");
        s.className = "av-count-item";
        s.textContent = objs;
        row.appendChild(s);
        text.textContent = String(n);
        Speech.speak(NAMES[n]);
        if (n >= 10) {
          btn.textContent = "¡Listo!";
          btn.onclick = () => resolve();
        }
      });
    });
  }

  // ---------- arrastrar con dedo o mouse (con alternativa de toque) ----------
  // el: ficha a arrastrar. opts.onDrop(zoneEl|null) se llama al soltar (zoneEl
  // es el elemento con data-drop más cercano bajo el puntero); opts.onTap()
  // si fue un toque sin arrastrar. La ficha vuelve sola si no se acepta.
  function makeDraggable(node, opts) {
    node.classList.add("av-draggable");
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let moved = false;
    node.addEventListener("pointerdown", (e) => {
      if (node.dataset.locked === "1") return;
      e.preventDefault();
      try {
        node.setPointerCapture(e.pointerId);
      } catch (err) {
        /* sin captura seguimos igual: el arrastre funciona con los eventos del nodo */
      }
      startX = e.clientX;
      startY = e.clientY;
      dragging = true;
      moved = false;
      node.classList.add("av-dragging");
      node.style.transition = "none";
      node.style.zIndex = 40;
    });
    node.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
      node.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      node.classList.remove("av-dragging");
      node.style.transition = "";
      node.style.zIndex = "";
      let zone = null;
      if (moved) {
        node.style.visibility = "hidden";
        const under = document.elementFromPoint(e.clientX, e.clientY);
        node.style.visibility = "";
        zone = under ? under.closest("[data-drop]") : null;
      }
      node.style.transform = "";
      if (!moved) {
        if (opts.onTap) opts.onTap();
      } else if (opts.onDrop) {
        opts.onDrop(zone);
      }
    };
    node.addEventListener("pointerup", end);
    node.addEventListener("pointercancel", end);
  }

  // ---------- agenda de la misión ----------
  function lastPlayedMap(pid) {
    const map = {};
    AvStore.get(pid).intentos.forEach((i) => {
      if (!map[i.juegoId] || i.fecha > map[i.juegoId]) map[i.juegoId] = i.fecha;
    });
    return map;
  }

  function buildAgenda(profile, emotion) {
    const sett = AvStore.settings(profile.id);
    const upset = emotion === "enojado" || emotion === "triste";
    const pool = gamesFor(profile.aventura, profile.id).filter((g) => g.role && !(upset && g.calmSkip));
    const last = lastPlayedMap(profile.id);
    const byOldest = (a, b) => (last[a.id] || "") < (last[b.id] || "") ? -1 : (last[a.id] || "") > (last[b.id] || "") ? 1 : Math.random() - 0.5;
    const interes = util.shuffle(pool.filter((g) => g.role === "interes")).sort(byOldest);
    const retos = util.shuffle(pool.filter((g) => g.role === "reto")).sort(byOldest);
    let n = util.clamp(Math.round(sett.sessionMin / 5), 2, 5);
    if (emotion === "enojado" || emotion === "triste") n = 2;
    // formato "sándwich": interés → reto → interés (y con pausa activa suave)
    const pattern = { 2: ["reto", "interes"], 3: ["interes", "reto", "interes"], 4: ["interes", "reto", "reto", "interes"], 5: ["interes", "reto", "interes", "reto", "interes"] }[n];
    const usedI = [];
    const usedR = [];
    const agenda = [];
    pattern.forEach((role) => {
      const source = role === "interes" ? interes : retos;
      const used = role === "interes" ? usedI : usedR;
      let g = source.find((x) => !used.includes(x.id));
      if (!g) g = source[used.length % Math.max(1, source.length)] || pool[0];
      if (g) {
        used.push(g.id);
        agenda.push(g.id);
      }
    });
    // pausa activa suave a mitad de la misión (opcional para el niño)
    if (n >= 3) agenda.splice(2, 0, "pausa");
    return agenda.filter(Boolean);
  }

  // ---------- pausa activa suave (30–60 s), siempre opcional ----------
  // Movimientos de intensidad baja, guiados con voz paso a paso. El botón
  // "Estoy cansado" está siempre a la vista y salta sin ningún reproche.
  const STRETCHES = [
    { emoji: "🐱", name: "Estírate como un gato", steps: ["Sube los brazos despacio.", "Estírate bien alto, como un gato al despertar.", "Baja los brazos suave y suelta el aire.", "Otra vez: arriba… y abajo, sin prisa."] },
    { emoji: "🦁", name: "Respira como un león", steps: ["Inhala por la nariz, despacio.", "Suelta el aire por la boca con un aaah suave.", "Inhala otra vez, llenando la barriga.", "Suelta el aire despacito, como un león tranquilo."] },
    { emoji: "🤖", name: "Camina como robot", steps: ["Camina en tu lugar como un robot.", "Levanta un pie… y luego el otro.", "Ahora más despacio todavía.", "Detente y respira profundo."] },
    { emoji: "🌳", name: "Sé un árbol", steps: ["Pon los pies firmes, como raíces.", "Estira las ramas hacia arriba.", "Muévete suave con el viento.", "Baja las ramas y respira."] },
    { emoji: "🐢", name: "Hombros de tortuga", steps: ["Sube los hombros hasta las orejas.", "Suéltalos despacio.", "Haz círculos suaves con los hombros.", "Respira y relájate."] },
    { emoji: "⭐", name: "Manos de estrella", steps: ["Abre las manos como estrellas.", "Ciérralas apretando suave.", "Sacúdelas como gotitas de agua.", "Déjalas descansar."] }
  ];

  function guidedStretch(preset) {
    return new Promise((resolve) => {
      const s = preset || util.pick(STRETCHES);
      showOverlay(`
        <div class="av-card av-stretch">
          <div class="av-stretch-emoji" id="av-st-emoji">${s.emoji}</div>
          <h2 class="av-card-title">${s.name}</h2>
          <div class="av-card-text" id="av-st-text">Vamos despacio…</div>
          <div class="av-dots" id="av-st-dots">${s.steps.map(() => "<span></span>").join("")}</div>
          <div class="av-card-buttons"><button class="av-btn av-btn-soft" id="av-st-skip"><span class="av-btn-emoji">😴</span><span>Estoy cansado, saltar</span></button></div>
        </div>`);
      const token = overlayToken;
      const text = el.overlay.querySelector("#av-st-text");
      const dots = el.overlay.querySelectorAll("#av-st-dots span");
      let finished = false;
      const end = (v) => {
        if (finished) return;
        finished = true;
        Speech.stop();
        resolve(v);
      };
      el.overlay.querySelector("#av-st-skip").addEventListener("click", () => {
        GameAudio.playClick();
        end("saltar");
      });
      const step = (i) => {
        if (finished || token !== overlayToken) return end("saltar");
        if (i >= s.steps.length) {
          text.textContent = "¡Muy bien! Tu cuerpo se siente más tranquilo.";
          Speech.speak("Muy bien. Tu cuerpo se siente más tranquilo.");
          setTimeout(() => end("hecho"), 2600);
          return;
        }
        text.textContent = s.steps[i];
        if (i > 0) dots[i - 1].classList.add("on");
        Speech.speak(s.steps[i]);
        setTimeout(() => step(i + 1), 8500);
      };
      setTimeout(() => step(0), 1200);
    });
  }

  async function activePause() {
    const s = util.pick(STRETCHES);
    const choice = await card({
      picto: s.emoji,
      title: "Pausa suave",
      text: `${s.name}. Nos movemos despacito un ratito.`,
      buttons: [
        { label: "Empezar", value: "hecho", primary: true },
        { emoji: "😴", label: "Estoy cansado, saltar", value: "saltar" }
      ],
      speak: `Pausa suave. ${s.name}.`
    });
    if (choice === "hecho") {
      const r = await guidedStretch(s);
      if (r === "hecho") giveStars("pausa", 1, "Cuidaste tu cuerpo");
    }
    hideOverlay();
  }

  // ---------- misión del día ----------
  async function startMission() {
    const profile = currentProfile();
    if (!profile || !profile.aventura) return;
    stopRun();
    const pid = profile.id;
    hooks.show("aventura");
    el.pause.classList.add("hidden");
    el.stage.innerHTML = "";
    el.stage.className = "av-stage";
    setInstruction("🦊", "Misión de hoy");
    el.fill.style.width = "0%";
    el.ptext.textContent = "";
    mission = { pid, stars: 0, alive: true, sessionId: null };
    const m = mission;
    const alive = () => mission === m && m.alive;

    // 1) check-in: ¿cómo amaneciste?
    const emotion = await emotionCard("¡Hola! Soy Zorrito. ¿Cómo amaneciste hoy?");
    if (!alive()) return;
    const session = AvStore.startSession(pid, emotion);
    m.sessionId = session.id;
    let levelBias = 0;

    // si viene enojado o triste: rincón tranquilo primero y sesión corta y fácil
    if (emotion === "enojado" || emotion === "triste") {
      levelBias = -1;
      const c = await card({
        mascot: true,
        title: "Vamos con calma",
        text: "Hoy haremos algo cortito. ¿Quieres primero respirar con el globo?",
        buttons: [
          { emoji: "🎈", label: "Sí, respirar", value: "si", primary: true },
          { label: "No, seguir", value: "no" }
        ],
        speak: "Vamos con calma. Hoy haremos algo cortito. ¿Quieres primero respirar con el globo?"
      });
      if (!alive()) return;
      if (c === "si") {
        await breathing();
        if (!alive()) return;
        AvStore.addCalma(pid, m.sessionId, "globo");
        giveStars("calma", 1, "Usaste tu calma");
      }
    }

    // 2) agenda visual "primero / después"
    const agenda = buildAgenda(profile, emotion);
    AvStore.updateSession(pid, m.sessionId, { agenda: agenda.filter((a) => a !== "pausa") });
    m.agenda = agenda;
    let doneCount = 0;
    const totalActs = agenda.filter((a) => a !== "pausa").length;

    for (let i = 0; i < agenda.length; i++) {
      if (!alive()) return;
      const id = agenda[i];
      if (id === "pausa") {
        await activePause();
        continue;
      }
      const def = games[id];
      await showAgenda(agenda, i, doneCount, totalActs, emotion);
      if (!alive()) return;
      const started = await showIntro(def, totalActs - doneCount);
      if (!alive() || started === "salir") return;
      const res = await runGame(def, { levelBias });
      if (!alive() || res.exited) return;
      doneCount++;
      await afterActivity(def, res, agenda, i, doneCount, totalActs);
    }
    if (!alive()) return;

    // 3) cierre: ¿cómo me siento ahora?
    const fin = await emotionCard("¡Terminaste la misión! ¿Cómo te sientes ahora?", true);
    if (!alive()) return;
    const dur = Math.round((Date.now() - new Date(session.fecha).getTime()) / 1000);
    AvStore.updateSession(pid, m.sessionId, { emocionFin: fin, duracionSeg: dur });
    const premios = AvStore.newPremios(pid);
    let extra = "";
    if (premios.length) {
      extra = `<div class="av-premio">🎁 ¡Ganaste: ${premios.map((p) => p.text).join(", ")}!</div>`;
      premios.forEach((p) => AvStore.markPremio(pid, p.key));
    }
    const total = AvStore.stars(pid);
    hideOverlay();
    await card({
      mascot: true,
      title: "¡Misión cumplida!",
      text: `Hoy ganaste ${m.stars} ⭐ y ya tienes ${total} en total.${extra}`,
      buttons: [{ label: "Terminar", value: true, primary: true }],
      speak: `Misión cumplida. Hoy ganaste ${m.stars} estrellas.`
    });
    m.alive = false;
    mission = null;
    hideOverlay();
    hooks.exit();
  }

  function emotionCard(question, closing) {
    return new Promise((resolve) => {
      const btns = EMOTIONS.map((e) => `<button class="av-emotion" data-id="${e.id}"><span class="av-emotion-face">${e.emoji}</span><span>${e.label}</span></button>`).join("");
      const root = showOverlay(`
        <div class="av-card">
          <div class="av-mascot">🦊</div>
          <h2 class="av-card-title">${question}</h2>
          <div class="av-emotions">${btns}</div>
        </div>`);
      root.querySelectorAll(".av-emotion").forEach((b) => {
        b.addEventListener("click", () => {
          GameAudio.playClick();
          Speech.stop();
          resolve(b.dataset.id);
        });
      });
      Speech.speak(question);
    });
  }

  function showAgenda(agenda, index, doneCount, totalActs, emotion) {
    const acts = agenda.filter((a) => a !== "pausa");
    const curActIdx = acts.findIndex((_, k) => k === doneCount);
    const items = agenda
      .map((id, i) => {
        if (id === "pausa") return `<div class="av-step av-step-pause ${i < index ? "done" : ""}"><span class="av-step-emoji">🌿</span></div>`;
        const g = games[id];
        const k = agenda.slice(0, i).filter((a) => a !== "pausa").length;
        const cls = k < doneCount ? "done" : k === doneCount ? "current" : "";
        return `<div class="av-step ${cls}"><span class="av-step-emoji">${g.emoji}</span>${k < doneCount ? '<span class="av-step-check">✔</span>' : ""}</div>`;
      })
      .join('<span class="av-arrow">→</span>');
    const next = games[acts[curActIdx + 1]];
    const now = games[acts[curActIdx]];
    return card({
      mascot: true,
      title: doneCount === 0 ? "Esta es nuestra misión" : `Faltan ${totalActs - doneCount}`,
      text: `<div class="av-agenda">${items}</div><div class="av-first-then"><b>Primero:</b> ${now.emoji} ${now.name}${next ? `<br><b>Después:</b> ${next.emoji} ${next.name}` : ""}</div>`,
      buttons: [{ label: doneCount === 0 ? "¡Vamos!" : "¡Sigamos!", value: true, primary: true }],
      speak: doneCount === 0 ? `Esta es nuestra misión. Primero: ${now.name}.` : `Faltan ${totalActs - doneCount}. Ahora sigue: ${now.name}.`
    });
  }

  async function showIntro(def, remaining) {
    const intro = def.intro || { text: def.name };
    const choice = await card({
      picto: def.emoji,
      title: def.name,
      text: intro.text,
      demo: intro.demo ? intro.demo() : "",
      buttons: [
        { label: "¡Empezar!", value: "ok", primary: true },
        ...(mission ? [] : [{ label: "Volver", value: "salir" }])
      ],
      speak: intro.text
    });
    if (choice === "salir") {
      hideOverlay();
      exit();
    }
    hideOverlay();
    return choice;
  }

  async function afterActivity(def, res, agenda, i, doneCount, totalActs) {
    GameAudio.playSoftBell();
    const left = totalActs - doneCount;
    let sticker = res.sticker ? `<div class="av-sticker-got">Nuevo sticker: <span>${res.sticker.id}</span> ${res.sticker.en}</div>` : "";
    await card({
      picto: "⭐".repeat(Math.max(1, Math.min(5, res.stars))),
      title: "¡Muy bien!",
      text: `Terminaste ${def.name}.${sticker}${left > 0 ? `<br>Faltan ${left}.` : ""}`,
      buttons: [{ label: left > 0 ? "Seguir" : "¡Casi listo!", value: true, primary: true }],
      speak: `Muy bien. Terminaste ${def.name}.`
    });
  }

  // ---------- juego suelto (sin misión) ----------
  async function openGame(gameId) {
    const def = games[gameId];
    if (!def) return;
    mission = null;
    hooks.show("aventura");
    el.pause.classList.add("hidden");
    el.stage.innerHTML = "";
    setInstruction(def.emoji, def.name);
    const c = await showIntro(def, 1);
    if (c === "salir") return;
    const res = await runGame(def, {});
    if (res.exited) return;
    GameAudio.playSoftBell();
    const again = await card({
      picto: "⭐".repeat(Math.max(1, Math.min(5, res.stars))),
      title: "¡Muy bien!",
      text: `Terminaste ${def.name}.${res.sticker ? `<div class="av-sticker-got">Nuevo sticker: <span>${res.sticker.id}</span> ${res.sticker.en}</div>` : ""}`,
      buttons: [
        { emoji: "🔁", label: "Otra vez", value: "otra", primary: true },
        { emoji: "🏠", label: "Volver", value: "volver" }
      ],
      speak: "Muy bien."
    });
    hideOverlay();
    if (again === "otra") return openGame(gameId);
    hooks.exit();
  }

  // ---------- álbum de stickers ----------
  function openAlbum() {
    const profile = currentProfile();
    if (!profile) return;
    mission = null;
    hooks.show("aventura");
    el.pause.classList.add("hidden");
    el.stage.innerHTML = "";
    setInstruction("📒", "Mi álbum");
    el.fill.style.width = "0%";
    el.ptext.textContent = "";
    const owned = AvStore.stickers(profile.id);
    const cells = STICKERS.map((s) => {
      const has = owned.includes(s.id);
      return `<div class="av-sticker ${has ? "has" : ""}"><span class="av-sticker-emoji">${has ? s.id : "❔"}</span><span class="av-sticker-word">${has ? s.en : "?"}</span></div>`;
    }).join("");
    const stars = AvStore.stars(profile.id);
    const prem = (AvStore.settings(profile.id).premios || []).filter((p) => p.stars > stars).sort((a, b) => a.stars - b.stars)[0];
    el.stage.innerHTML = `
      <div class="av-album">
        <p class="av-album-stars">⭐ ${stars} estrellas · ${owned.length} de ${STICKERS.length} stickers</p>
        ${prem ? `<p class="av-album-next">🎁 Con ${prem.stars} estrellas: ${prem.text}</p>` : ""}
        <div class="av-sticker-grid">${cells}</div>
      </div>`;
    el.stage.querySelectorAll(".av-sticker.has").forEach((c, i) => {
      c.addEventListener("click", () => Speech.speakEnglish(STICKERS.filter((s) => owned.includes(s.id))[i].en));
    });
  }

  function exit() {
    if (mission) mission.alive = false;
    mission = null;
    stopRun();
    Speech.stop();
    GameAudio.stopAmbient();
    hideOverlay();
    hooks.exit();
  }

  // Lo llama main.js al salir de la pantalla de Aventuras por cualquier camino.
  function stop() {
    if (mission) mission.alive = false;
    mission = null;
    stopRun();
    Speech.stop();
    GameAudio.stopAmbient();
    if (el.overlay) hideOverlay();
    document.querySelectorAll(".av-offer").forEach((n) => n.remove());
  }

  // ---------- tarjetas de la categoría "Aventuras" ----------
  // Nivel 1: Misión de hoy + grupos por tema + álbum. Nivel 2: los juegos del
  // grupo elegido. groupView recuerda el grupo para que, al salir de un juego,
  // se vuelva a la lista de ese grupo y no al principio.
  const GROUPS = [
    { id: "atencion", emoji: "🚦", label: "Atención y calma", blurb: "Esperar, cambiar de plan y recordar", areas: ["atencion"] },
    { id: "letras", emoji: "✏️", label: "Letras y lectura", blurb: "Trazar, leer y escribir palabras", areas: ["letras"] },
    { id: "numeros", emoji: "🔢", label: "Números e inglés", blurb: "Contar, sumar, comprar y hablar inglés", areas: ["numeros", "ingles"] },
    { id: "emociones", emoji: "💛", label: "Mis emociones", blurb: "Entender lo que siento y qué hacer", areas: ["emociones"] },
    { id: "rutinas", emoji: "🎒", label: "Mis rutinas", blurb: "Organizar cosas y saber qué va primero", areas: ["rutinas"] }
  ];
  let groupView = null;

  function setHeader(title, blurb) {
    const t = document.getElementById("category-title");
    const bl = document.getElementById("category-blurb");
    if (t) t.textContent = title;
    if (bl) bl.textContent = blurb || "";
  }

  function fillCategory(grid, profile) {
    grid.innerHTML = "";
    const add = (cls, emoji, label, sub, onClick) => {
      const b = document.createElement("button");
      b.className = `game-card ${cls}`;
      b.innerHTML = `<span class="game-emoji">${emoji}</span><span class="game-label">${label}</span>${sub ? `<span class="category-count">${sub}</span>` : ""}`;
      b.addEventListener("click", () => {
        GameAudio.playClick();
        onClick();
      });
      grid.appendChild(b);
    };
    const list = gamesFor(profile.aventura, profile.id);
    const group = GROUPS.find((g) => g.id === groupView);
    if (group) {
      setHeader(`${group.emoji} ${group.label}`, "Elige una actividad");
      list.filter((g) => group.areas.includes(g.area)).forEach((g) => add("", g.emoji, g.name, "", () => openGame(g.id)));
      return;
    }
    groupView = null;
    setHeader("🚀 Aventuras", "Tu misión y tus actividades");
    add("av-mission-card", "🦊", "Misión de hoy", "Zorrito te guía paso a paso", () => startMission());
    GROUPS.forEach((gr) => {
      const n = list.filter((g) => gr.areas.includes(g.area)).length;
      if (n) {
        add("av-group-card", gr.emoji, gr.label, `${n} ${n === 1 ? "actividad" : "actividades"}`, () => {
          groupView = gr.id;
          fillCategory(grid, profile);
        });
      }
    });
    add("", "📒", "Mi álbum", `${AvStore.stickers(profile.id).length} stickers`, () => openAlbum());
  }

  // Flecha ⬅️ de la pantalla de categoría: si hay un grupo abierto, sube un
  // nivel y devuelve true; si no, devuelve false (main.js vuelve al menú).
  function backFromGroup(grid) {
    if (!groupView) return false;
    groupView = null;
    fillCategory(grid, currentProfile());
    return true;
  }

  function resetView() {
    groupView = null;
  }

  return { defaults: {}, register, init, fillCategory, backFromGroup, resetView, applySettings, startMission, openGame, openAlbum, stop, util, games, AREAS, STICKERS, EMOTIONS, gamesFor, currentProfile };
})();
