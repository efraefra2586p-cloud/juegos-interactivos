// Panel de padres de "Aventuras": PIN, progreso por área, configuración,
// notas del día y reporte imprimible (para compartir con su docente o especialista).
// El PIN es una barrera para que un niño no entre por accidente; no es
// seguridad fuerte (los datos viven en este dispositivo).
const Panel = (() => {
  let hooks = null;
  let root = null;
  let selected = null; // id del perfil que se está viendo
  let tab = "progreso";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DAY = 86400000;

  function profilesWithAventura() {
    return Storage.listProfiles().filter((p) => p.aventura);
  }

  function init(h) {
    hooks = h;
    root = document.getElementById("screen-panel");
  }

  // ---------- PIN ----------
  function open() {
    hooks.show("panel");
    if (!AvStore.hasPin()) return pinSetup();
    pinAsk();
  }

  function pinScreen(title, sub, onDone) {
    let value = "";
    root.innerHTML = `
      <div class="pn-pin">
        <button class="icon-btn pn-back" id="pn-back">⬅️</button>
        <h2>${title}</h2>
        <p>${sub}</p>
        <div class="pn-dots" id="pn-dots">${"<span></span>".repeat(4)}</div>
        <div class="pn-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k) => (k === "" ? "<span></span>" : `<button class="pn-key" data-k="${k}">${k}</button>`)).join("")}</div>
        <p class="pn-err" id="pn-err"></p>
      </div>`;
    root.querySelector("#pn-back").addEventListener("click", () => hooks.exit());
    const dots = root.querySelectorAll("#pn-dots span");
    const paint = () => dots.forEach((d, i) => d.classList.toggle("on", i < value.length));
    root.querySelectorAll(".pn-key").forEach((b) =>
      b.addEventListener("click", () => {
        const k = b.dataset.k;
        if (k === "⌫") value = value.slice(0, -1);
        else if (value.length < 4) value += k;
        paint();
        if (value.length === 4) {
          const v = value;
          setTimeout(() => {
            value = "";
            paint();
            onDone(v, (msg) => (root.querySelector("#pn-err").textContent = msg));
          }, 150);
        }
      })
    );
  }

  function pinSetup() {
    pinScreen("Crea tu PIN", "4 números. Solo los adultos lo sabrán.", (first) => {
      pinScreen("Repite el PIN", "Escríbelo otra vez para confirmar.", (second, err) => {
        if (second === first) {
          AvStore.setPin(first);
          start();
        } else err("No coincide. Vuelve a intentarlo.");
      });
    });
  }

  function pinAsk() {
    pinScreen("Zona de adultos", "Escribe tu PIN.", (v, err) => {
      if (AvStore.checkPin(v)) start();
      else err("PIN incorrecto.");
    });
  }

  function start() {
    const list = profilesWithAventura();
    selected = (list[0] || Storage.listProfiles()[0] || {}).id;
    tab = "progreso";
    render();
  }

  // ---------- estadísticas ----------
  function stats(pid, days) {
    const p = AvStore.get(pid);
    const cutoff = Date.now() - days * DAY;
    const intentos = p.intentos.filter((i) => new Date(i.fecha).getTime() >= cutoff);
    const sesiones = p.sesiones.filter((s) => new Date(s.fecha).getTime() >= cutoff);
    const calma = p.calma.filter((c) => new Date(c.fecha).getTime() >= cutoff);
    const byArea = {};
    intentos.forEach((i) => {
      const a = (byArea[i.area] = byArea[i.area] || { n: 0, ok: 0, err: 0, ayudas: 0, seg: 0 });
      a.n++;
      a.ok += i.aciertos || 0;
      a.err += i.errores || 0;
      a.ayudas += i.ayudasUsadas || 0;
      a.seg += i.duracionSeg || 0;
    });
    const byGame = {};
    intentos.forEach((i) => {
      const g = (byGame[i.juegoId] = byGame[i.juegoId] || { n: 0, ok: 0, err: 0, imp: 0 });
      g.n++;
      g.ok += i.aciertos || 0;
      g.err += i.errores || 0;
      g.imp += i.erroresImpulsivos || 0;
    });
    const emo = { ini: {}, fin: {} };
    sesiones.forEach((s) => {
      if (s.emocionInicio) emo.ini[s.emocionInicio] = (emo.ini[s.emocionInicio] || 0) + 1;
      if (s.emocionFin) emo.fin[s.emocionFin] = (emo.fin[s.emocionFin] || 0) + 1;
    });
    const tools = {};
    calma.forEach((c) => (tools[c.herramienta] = (tools[c.herramienta] || 0) + 1));
    const totalSeg = intentos.reduce((a, i) => a + (i.duracionSeg || 0), 0);
    return { intentos, sesiones, calma, byArea, byGame, emo, tools, totalSeg };
  }

  const pct = (ok, err) => (ok + err ? Math.round((ok / (ok + err)) * 100) : null);
  const bar = (v, color) => `<div class="pn-bar"><div class="pn-bar-fill" style="width:${v == null ? 0 : v}%;background:${color || "#6aa9e0"}"></div></div>`;
  const EMO_FACE = { feliz: "😀", tranquilo: "🙂", enojado: "😠", triste: "😢" };

  function dailyBars(pid) {
    const p = AvStore.get(pid);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      days.push({ key: AvStore.dayKey(d), label: ["D", "L", "M", "M", "J", "V", "S"][d.getDay()], n: 0, min: 0 });
    }
    p.intentos.forEach((it) => {
      const d = days.find((x) => x.key === AvStore.dayKey(it.fecha));
      if (d) {
        d.n++;
        d.min += (it.duracionSeg || 0) / 60;
      }
    });
    const max = Math.max(1, ...days.map((d) => d.n));
    return `<div class="pn-days">${days.map((d) => `<div class="pn-day"><div class="pn-day-bar" style="height:${Math.round((d.n / max) * 90)}px"></div><span class="pn-day-n">${d.n}</span><span class="pn-day-l">${d.label}</span></div>`).join("")}</div>`;
  }

  // ---------- pantalla principal ----------
  function render() {
    const profs = Storage.listProfiles();
    const tabs = [
      ["progreso", "📊 Progreso"],
      ["config", "⚙️ Configuración"],
      ["notas", "📝 Notas"],
      ["reporte", "🖨️ Reporte"]
    ];
    root.innerHTML = `
      <div class="pn-wrap">
        <div class="pn-top">
          <button class="icon-btn" id="pn-exit">⬅️</button>
          <h2>Zona de adultos</h2>
        </div>
        <div class="pn-profiles">${profs.map((p) => `<button class="pn-prof ${p.id === selected ? "on" : ""}" data-id="${p.id}">${p.emoji} ${esc(p.name)}</button>`).join("")}</div>
        <div class="pn-tabs">${tabs.map(([id, l]) => `<button class="pn-tab ${id === tab ? "on" : ""}" data-t="${id}">${l}</button>`).join("")}</div>
        <div class="pn-body" id="pn-body"></div>
      </div>`;
    root.querySelector("#pn-exit").addEventListener("click", () => hooks.exit());
    root.querySelectorAll(".pn-prof").forEach((b) => b.addEventListener("click", () => ((selected = b.dataset.id), render())));
    root.querySelectorAll(".pn-tab").forEach((b) => b.addEventListener("click", () => ((tab = b.dataset.t), render())));
    const body = root.querySelector("#pn-body");
    if (tab === "progreso") renderProgreso(body);
    else if (tab === "config") renderConfig(body);
    else if (tab === "notas") renderNotas(body);
    else renderReporte(body);
  }

  // ---------- Progreso ----------
  function renderProgreso(body) {
    const prof = Storage.getProfileData(selected);
    if (!prof.aventura) {
      body.innerHTML = `<p class="pn-note">El apartado Aventuras no está activo para ${esc(prof.name)}. Puedes activarlo en Configuración.</p>`;
      return;
    }
    const s7 = stats(selected, 7);
    const s28 = stats(selected, 28);
    const areaRows = Object.keys(Aventura.AREAS)
      .map((a) => {
        const d = s28.byArea[a];
        const v = d ? pct(d.ok, d.err) : null;
        return `<div class="pn-row"><span class="pn-row-l">${Aventura.AREAS[a]}</span>${bar(v, v != null && v < 60 ? "#e6a25b" : "#5bb98b")}<span class="pn-row-v">${v == null ? "—" : v + "%"}</span><span class="pn-row-s">${d ? d.n + " act." : "sin datos"}</span></div>`;
      })
      .join("");
    const games = Object.values(Aventura.games).filter((g) => (g.modes || []).includes(prof.aventura));
    const gameRows = games
      .map((g) => {
        const d = s28.byGame[g.id];
        const lvl = AvStore.getLevel(selected, g.id);
        return `<tr><td>${g.emoji} ${esc(g.name)}</td><td>${g.codes && g.codes.length ? g.codes.join(", ") : "—"}</td><td>${d ? d.n : 0}</td><td>${d ? pct(d.ok, d.err) + "%" : "—"}</td><td>${d && d.imp ? d.imp : "—"}</td><td>${g.role ? "Nivel " + lvl : "—"}</td></tr>`;
      })
      .join("");
    const emoRow = (o) => Object.keys(EMO_FACE).map((k) => `${EMO_FACE[k]} ${o[k] || 0}`).join("  ");
    body.innerHTML = `
      <div class="pn-cards">
        <div class="pn-stat"><b>${s7.sesiones.length}</b><span>sesiones (7 días)</span></div>
        <div class="pn-stat"><b>${Math.round(s7.totalSeg / 60)}</b><span>minutos jugados</span></div>
        <div class="pn-stat"><b>${AvStore.stars(selected)}</b><span>⭐ en total</span></div>
        <div class="pn-stat"><b>${s28.calma.length}</b><span>veces usó la calma (28 d)</span></div>
      </div>
      <h3>Actividades por día (últimos 7 días)</h3>
      ${dailyBars(selected)}
      <h3>Aciertos por área (últimas 4 semanas)</h3>
      <div class="pn-rows">${areaRows}</div>
      <h3>Detalle por juego (últimas 4 semanas)</h3>
      <div class="pn-tablewrap"><table class="pn-table"><thead><tr><th>Juego</th><th>Código</th><th>Veces</th><th>Aciertos</th><th>Toques impulsivos</th><th>Nivel actual</th></tr></thead><tbody>${gameRows}</tbody></table></div>
      <h3>Cómo se sintió (últimas 4 semanas)</h3>
      <p class="pn-emo">Al entrar: ${emoRow(s28.emo.ini)}<br>Al salir: ${emoRow(s28.emo.fin)}</p>
      <p class="pn-note">Herramientas de calma usadas: ${Object.keys(s28.tools).length ? Object.entries(s28.tools).map(([k, v]) => `${k}: ${v}`).join(" · ") : "ninguna todavía"}.</p>`;
  }

  // ---------- Configuración ----------
  function renderConfig(body) {
    const prof = Storage.getProfileData(selected);
    const st = AvStore.settings(selected);
    const mode = prof.aventura;
    const allGames = Object.values(Aventura.games).filter((g) => mode && (g.modes || []).includes(mode));
    const active = st.activeGames || allGames.map((g) => g.id);
    const glyphKeys = (Aventura.defaults && Aventura.defaults.glyphs) || [];
    const routines = st.routines && st.routines.length ? st.routines : Aventura.defaults.routines;
    body.innerHTML = `
      <div class="pn-section">
        <h3>Apartado Aventuras para cada perfil</h3>
        ${Storage.listProfiles()
          .map((p) => `<label class="pn-line">${p.emoji} ${esc(p.name)} <select data-mode="${p.id}"><option value="" ${!p.aventura ? "selected" : ""}>No</option><option value="lite" ${p.aventura === "lite" ? "selected" : ""}>Versión reducida</option><option value="full" ${p.aventura === "full" ? "selected" : ""}>Completo</option></select></label>`)
          .join("")}
      </div>
      ${
        !mode
          ? `<p class="pn-note">Activa Aventuras para ${esc(prof.name)} para ver sus ajustes.</p>`
          : `
      <div class="pn-section">
        <h3>Sesión</h3>
        <label class="pn-line">Duración de la misión
          <select id="cf-min">${[10, 15, 20, 25].map((m) => `<option value="${m}" ${st.sessionMin === m ? "selected" : ""}>${m} minutos</option>`).join("")}</select></label>
        <label class="pn-line">Ritmo del semáforo
          <select id="cf-speed"><option value="slow" ${st.speed === "slow" ? "selected" : ""}>Lento (recomendado)</option><option value="normal" ${st.speed === "normal" ? "selected" : ""}>Normal</option></select></label>
      </div>
      <div class="pn-section">
        <h3>Juegos activos</h3>
        <div class="pn-checks">${allGames.map((g) => `<label class="pn-check"><input type="checkbox" data-g="${g.id}" ${active.includes(g.id) ? "checked" : ""}> ${g.emoji} ${esc(g.name)}</label>`).join("")}</div>
      </div>
      <div class="pn-section">
        <h3>Letras y números para trazar</h3>
        <p class="pn-note">Si no eliges ninguno, se usa el conjunto recomendado.</p>
        <div class="pn-chips">${glyphKeys.map((k) => `<label class="pn-chip"><input type="checkbox" data-c="${esc(k)}" ${st.trazoChars && st.trazoChars.includes(k) ? "checked" : ""}><span>${esc(k)}</span></label>`).join("")}</div>
      </div>
      <div class="pn-section">
        <h3>Palabras y frases para practicar</h3>
        <p class="pn-note">Una por línea. Aparecen en "Construye la palabra" (por ejemplo, las que trabajan en la escuela).</p>
        <textarea id="cf-words" rows="5" placeholder="sol&#10;mi mamá me ama">${esc((st.words || []).join("\n"))}</textarea>
      </div>
      <div class="pn-section">
        <h3>Rutinas</h3>
        <p class="pn-note">Cada paso en una línea: primero un emoji y luego el texto (ej. 🪥 Lavarme los dientes).</p>
        <div id="cf-routines">${routines.map((r, i) => routineEditor(r, i)).join("")}</div>
        <button class="pn-btn" id="cf-add-routine">➕ Agregar rutina</button>
        <button class="pn-btn pn-btn-soft" id="cf-reset-routines">Restablecer las de siempre</button>
      </div>
      <div class="pn-section">
        <h3>Premios reales</h3>
        <p class="pn-note">Se muestran cuando junta las estrellas (ej. 10 ⭐ = elegir el postre).</p>
        <div id="cf-premios">${(st.premios || []).map((p, i) => premioRow(p, i)).join("")}</div>
        <button class="pn-btn" id="cf-add-premio">➕ Agregar premio</button>
      </div>
      <div class="pn-section">
        <h3>Sonido y movimiento</h3>
        <label class="pn-line">Volumen <input type="range" id="cf-vol" min="0" max="100" value="${Math.round(st.volume * 100)}"></label>
        <label class="pn-line"><input type="checkbox" id="cf-music" ${st.music ? "checked" : ""}> Música suave en el rincón tranquilo</label>
        <label class="pn-line"><input type="checkbox" id="cf-motion" ${st.reduceMotion ? "checked" : ""}> Reducir movimiento (sin animaciones)</label>
        <p class="pn-note">Voz que se está usando: <b>${esc(Speech.voiceName())}</b>. Para que la "c" y la "s" suenen igual que en Ecuador, conviene una voz de español latinoamericano (México, US, Colombia…). Se puede instalar en los ajustes de voz del dispositivo.</p>
      </div>`
      }
      <div class="pn-section">
        <h3>PIN</h3>
        <button class="pn-btn pn-btn-soft" id="cf-pin">Cambiar PIN</button>
      </div>`;
    bindConfig(body, prof, allGames);
  }

  function routineEditor(r, i) {
    return `<div class="pn-routine" data-i="${i}">
      <div class="pn-line"><input class="pn-emoji" data-f="emoji" value="${esc(r.emoji)}" maxlength="4"><input class="pn-name" data-f="name" value="${esc(r.name)}" placeholder="Nombre">
      <select data-f="when"><option value="am" ${r.when === "am" ? "selected" : ""}>Mañana</option><option value="pm" ${r.when === "pm" ? "selected" : ""}>Tarde</option><option value="night" ${r.when === "night" ? "selected" : ""}>Noche</option></select>
      <button class="pn-x" data-del="${i}" title="Quitar">✕</button></div>
      <textarea data-f="steps" rows="4">${esc(r.steps.map((s) => `${s.emoji} ${s.text}`).join("\n"))}</textarea></div>`;
  }

  function premioRow(p, i) {
    return `<div class="pn-line" data-p="${i}"><input type="number" min="1" value="${p.stars}" data-f="stars"> ⭐ = <input type="text" value="${esc(p.text)}" data-f="text" placeholder="Elegir el postre"><button class="pn-x" data-delp="${i}">✕</button></div>`;
  }

  function collectRoutines(body) {
    return [...body.querySelectorAll(".pn-routine")]
      .map((box, i) => {
        const steps = box
          .querySelector('[data-f="steps"]')
          .value.split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => {
            const m = l.match(/^(\S+)\s+(.*)$/u);
            return m ? { emoji: m[1], text: m[2] } : { emoji: "✅", text: l };
          });
        return { id: "r" + i, emoji: box.querySelector('[data-f="emoji"]').value || "📋", name: box.querySelector('[data-f="name"]').value || "Mi rutina", when: box.querySelector('[data-f="when"]').value, steps };
      })
      .filter((r) => r.steps.length);
  }

  function bindConfig(body, prof, allGames) {
    body.querySelectorAll("[data-mode]").forEach((sel) =>
      sel.addEventListener("change", () => {
        Storage.setAventura(sel.dataset.mode, sel.value || null);
        render();
      })
    );
    if (!prof.aventura) return;
    const save = (patch) => AvStore.setSettings(selected, patch);
    const $ = (id) => body.querySelector(id);
    $("#cf-min").addEventListener("change", (e) => save({ sessionMin: Number(e.target.value) }));
    $("#cf-speed").addEventListener("change", (e) => save({ speed: e.target.value }));
    body.querySelectorAll("[data-g]").forEach((c) =>
      c.addEventListener("change", () => {
        const ids = [...body.querySelectorAll("[data-g]")].filter((x) => x.checked).map((x) => x.dataset.g);
        save({ activeGames: ids.length === allGames.length ? null : ids });
      })
    );
    body.querySelectorAll("[data-c]").forEach((c) =>
      c.addEventListener("change", () => {
        const ids = [...body.querySelectorAll("[data-c]")].filter((x) => x.checked).map((x) => x.dataset.c);
        save({ trazoChars: ids.length ? ids : null });
      })
    );
    $("#cf-words").addEventListener("change", (e) => save({ words: e.target.value.split("\n").map((w) => w.trim()).filter(Boolean) }));
    body.querySelector("#cf-routines").addEventListener("change", () => save({ routines: collectRoutines(body) }));
    body.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        const list = collectRoutines(body);
        list.splice(Number(b.dataset.del), 1);
        save({ routines: list });
        render();
      })
    );
    $("#cf-add-routine").addEventListener("click", () => {
      const list = collectRoutines(body);
      list.push({ id: "r" + list.length, emoji: "📋", name: "Nueva rutina", when: "pm", steps: [{ emoji: "✅", text: "Primer paso" }] });
      save({ routines: list });
      render();
    });
    $("#cf-reset-routines").addEventListener("click", () => {
      save({ routines: null });
      render();
    });
    const collectPremios = () =>
      [...body.querySelectorAll("[data-p]")].map((row) => ({ stars: Number(row.querySelector('[data-f="stars"]').value) || 1, text: row.querySelector('[data-f="text"]').value.trim() })).filter((p) => p.text);
    body.querySelector("#cf-premios").addEventListener("change", () => save({ premios: collectPremios() }));
    body.querySelectorAll("[data-delp]").forEach((b) =>
      b.addEventListener("click", () => {
        const list = AvStore.settings(selected).premios.slice();
        list.splice(Number(b.dataset.delp), 1);
        save({ premios: list });
        render();
      })
    );
    $("#cf-add-premio").addEventListener("click", () => {
      save({ premios: [...(AvStore.settings(selected).premios || []), { stars: 10, text: "Elegir el postre" }] });
      render();
    });
    $("#cf-vol").addEventListener("input", (e) => {
      save({ volume: Number(e.target.value) / 100 });
      Aventura.applySettings(Aventura.currentProfile() || undefined);
    });
    $("#cf-music").addEventListener("change", (e) => save({ music: e.target.checked }));
    $("#cf-motion").addEventListener("change", (e) => {
      save({ reduceMotion: e.target.checked });
      document.documentElement.classList.toggle("reduce-motion", e.target.checked);
    });
    const pinBtn = body.querySelector("#cf-pin");
    if (pinBtn) pinBtn.addEventListener("click", () => pinSetup());
  }

  // ---------- Notas ----------
  function renderNotas(body) {
    const p = AvStore.get(selected);
    const today = AvStore.dayKey();
    const days = Object.keys(p.notas).sort().reverse();
    body.innerHTML = `
      <div class="pn-section">
        <h3>Nota de hoy (${today})</h3>
        <textarea id="nt-text" rows="4" placeholder="¿Cómo estuvo hoy? ¿Algo que quieras recordar o contarle a la terapeuta?">${esc(p.notas[today] || "")}</textarea>
        <button class="pn-btn" id="nt-save">Guardar nota</button>
      </div>
      <h3>Notas anteriores</h3>
      ${days.filter((d) => d !== today).map((d) => `<div class="pn-noteitem"><b>${d}</b><p>${esc(p.notas[d])}</p></div>`).join("") || `<p class="pn-note">Todavía no hay notas.</p>`}`;
    body.querySelector("#nt-save").addEventListener("click", () => {
      AvStore.setNote(selected, today, body.querySelector("#nt-text").value);
      renderNotas(body);
    });
  }

  // ---------- Reporte imprimible ----------
  function reportHtml(pid) {
    const prof = Storage.getProfileData(pid);
    const s = stats(pid, 30);
    const p = AvStore.get(pid);
    const rows = Object.keys(Aventura.AREAS)
      .map((a) => {
        const d = s.byArea[a];
        return `<tr><td>${Aventura.AREAS[a]}</td><td>${d ? d.n : 0}</td><td>${d ? pct(d.ok, d.err) + "%" : "—"}</td><td>${d ? d.ayudas : "—"}</td></tr>`;
      })
      .join("");
    const gameRows = Object.values(Aventura.games)
      .filter((g) => g.role && (g.modes || []).includes(prof.aventura))
      .map((g) => {
        const d = s.byGame[g.id];
        return `<tr><td>${esc(g.name)}</td><td>${g.codes.join(", ") || "—"}</td><td>${d ? d.n : 0}</td><td>${d ? pct(d.ok, d.err) + "%" : "—"}</td><td>${d && d.imp ? d.imp : "—"}</td><td>${AvStore.getLevel(pid, g.id)}</td></tr>`;
      })
      .join("");
    const notes = Object.keys(p.notas)
      .sort()
      .filter((d) => new Date(d).getTime() >= Date.now() - 30 * DAY)
      .map((d) => `<p><b>${d}:</b> ${esc(p.notas[d])}</p>`)
      .join("");
    const emo = (o) => Object.keys(EMO_FACE).map((k) => `${EMO_FACE[k]} ${k}: ${o[k] || 0}`).join(" · ");
    return `
      <h1>Reporte de actividades — ${esc(prof.name)}</h1>
      <p>Período: últimos 30 días · Generado el ${AvStore.dayKey()}</p>
      <p>Este reporte resume el uso de la aplicación. Es un complemento del acompañamiento profesional, no lo reemplaza.</p>
      <h2>Resumen</h2>
      <ul>
        <li>Sesiones: ${s.sesiones.length} · Minutos jugados: ${Math.round(s.totalSeg / 60)}</li>
        <li>Estrellas acumuladas: ${AvStore.stars(pid)}</li>
        <li>Veces que usó el rincón tranquilo: ${s.calma.length}</li>
        <li>Estado de ánimo al entrar — ${emo(s.emo.ini)}</li>
        <li>Estado de ánimo al salir — ${emo(s.emo.fin)}</li>
      </ul>
      <h2>Por área</h2>
      <table><thead><tr><th>Área</th><th>Actividades</th><th>Aciertos</th><th>Ayudas usadas</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Por juego</h2>
      <table><thead><tr><th>Juego</th><th>Código</th><th>Veces</th><th>Aciertos</th><th>Toques impulsivos</th><th>Nivel actual</th></tr></thead><tbody>${gameRows}</tbody></table>
      <h2>Notas de los padres</h2>${notes || "<p>Sin notas en este período.</p>"}`;
  }

  function renderReporte(body) {
    const prof = Storage.getProfileData(selected);
    if (!prof.aventura) {
      body.innerHTML = `<p class="pn-note">Activa Aventuras para ${esc(prof.name)} para generar su reporte.</p>`;
      return;
    }
    body.innerHTML = `
      <div class="pn-section">
        <h3>Reporte de ${esc(prof.name)}</h3>
        <p class="pn-note">Resumen de los últimos 30 días para compartir con su docente o especialista. Se abre la ventana de impresión: elige "Guardar como PDF" o imprímelo.</p>
        <button class="pn-btn" id="rp-print">🖨️ Imprimir / guardar PDF</button>
        <button class="pn-btn pn-btn-soft" id="rp-json">💾 Copia de seguridad (archivo)</button>
      </div>
      <div class="pn-preview">${reportHtml(selected)}</div>`;
    body.querySelector("#rp-print").addEventListener("click", () => {
      const host = document.getElementById("av-report");
      host.innerHTML = reportHtml(selected);
      host.classList.remove("hidden");
      window.print();
      setTimeout(() => host.classList.add("hidden"), 500);
    });
    body.querySelector("#rp-json").addEventListener("click", () => {
      const data = JSON.stringify({ perfil: prof.name, fecha: AvStore.dayKey(), datos: AvStore.get(selected) }, null, 2);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
      a.download = `aventuras-${prof.name}-${AvStore.dayKey()}.json`;
      a.click();
    });
  }

  return { init, open };
})();
