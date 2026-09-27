// Aventuras · Regulación de emociones
//   termometro — E2: deslizar el termómetro para decir cuánto molesta algo
//   gane       — E5: "Hoy no gané, pero…" (a veces se pierde a propósito y se
//                practica la frase; siempre con calma y sin castigo)
(() => {
  const U = Aventura.util;

  // =====================================================================
  // E2 · Termómetro de mis emociones
  // =====================================================================
  const SCENARIOS = [
    { e: "📵", t: "Se acabó el tiempo de tablet." },
    { e: "🔊", t: "Hay mucho ruido a tu alrededor." },
    { e: "🧸", t: "Un amigo no quiere prestarte su juguete." },
    { e: "🔄", t: "Cambiaron el plan de hoy." },
    { e: "🎲", t: "Perdiste un juego." },
    { e: "🍽️", t: "La comida de hoy no te gusta." },
    { e: "🧹", t: "Te piden guardar tus juguetes." },
    { e: "⏳", t: "Tienes que esperar mucho tiempo." }
  ];
  const TOOLS = [
    { e: "🎈", t: "Respirar profundo" },
    { e: "🗣️", t: "Contarle a un adulto" },
    { e: "⏳", t: "Esperar un ratito" }
  ];

  Aventura.register({
    id: "termometro",
    name: "Termómetro de emociones",
    emoji: "🌡️",
    area: "emociones",
    codes: ["SE-3", "SE-1"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 2,
    items: () => 4,
    intro: {
      text: "Te cuento algo que pasa. Desliza el termómetro para decir cuánto te molesta. No hay respuestas malas.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card g">🙂</div><div class="av-demo-card">😐</div><div class="av-demo-card r">😠</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="ter-wrap">
          <div class="ter-story"><span class="ter-emoji" id="ter-emoji"></span><p id="ter-text"></p></div>
          <p class="ter-q">¿Cuánto te molesta?</p>
          <div class="ter-meter">
            <div class="ter-track" id="ter-track" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <div class="ter-fill" id="ter-fill"></div>
              <div class="ter-thumb" id="ter-thumb">🌡️</div>
            </div>
            <div class="ter-scale"><span>🙂 Nada</span><span>😐 Un poco</span><span>😠 Mucho</span></div>
          </div>
          <div class="ter-zone" id="ter-zone">Toca o desliza el termómetro</div>
          <button class="av-btn av-btn-primary" id="ter-ok" disabled><span class="av-btn-emoji">✔</span><span>Listo</span></button>
          <div class="ter-reply hidden" id="ter-reply"></div>
        </div>`;
      const track = stage.querySelector("#ter-track");
      const fill = stage.querySelector("#ter-fill");
      const thumb = stage.querySelector("#ter-thumb");
      const zoneEl = stage.querySelector("#ter-zone");
      const okBtn = stage.querySelector("#ter-ok");
      const reply = stage.querySelector("#ter-reply");
      let idx = 0;
      let order = U.shuffle(SCENARIOS);
      let value = 0;
      let touched = false;
      let dragging = false;
      let locked = false;
      let handles = [];
      const zones = { verde: 0, amarillo: 0, rojo: 0 };

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };
      const zoneOf = (v) => (v < 34 ? "verde" : v < 67 ? "amarillo" : "rojo");
      const ZONE_TEXT = { verde: "Poquito 🙂", amarillo: "Un poco 😐", rojo: "Mucho 😠" };

      function setValue(v) {
        value = U.clamp(Math.round(v), 0, 100);
        const z = zoneOf(value);
        fill.style.width = `${value}%`;
        fill.className = `ter-fill ter-${z}`;
        thumb.style.left = `${value}%`;
        track.setAttribute("aria-valuenow", String(value));
        zoneEl.textContent = ZONE_TEXT[z];
        zoneEl.className = `ter-zone ter-zone-${z}`;
      }

      function fromEvent(e) {
        const r = track.getBoundingClientRect();
        setValue(((e.clientX - r.left) / r.width) * 100);
        if (!touched) {
          touched = true;
          okBtn.disabled = false;
        }
      }

      track.addEventListener("pointerdown", (e) => {
        if (locked || ctx.isPaused()) return;
        dragging = true;
        try {
          track.setPointerCapture(e.pointerId);
        } catch (err) {
          /* sin captura seguimos igual */
        }
        fromEvent(e);
      });
      track.addEventListener("pointermove", (e) => {
        if (dragging && !locked) fromEvent(e);
      });
      const stopDrag = () => {
        dragging = false;
      };
      track.addEventListener("pointerup", stopDrag);
      track.addEventListener("pointercancel", stopDrag);

      function nextItem() {
        if (idx >= ctx.total) {
          return ctx.complete({ verde: zones.verde, amarillo: zones.amarillo, rojo: zones.rojo });
        }
        const sc = order[idx % order.length];
        locked = false;
        touched = false;
        okBtn.disabled = true;
        okBtn.classList.remove("hidden");
        reply.classList.add("hidden");
        reply.innerHTML = "";
        setValue(0);
        zoneEl.textContent = "Toca o desliza el termómetro";
        zoneEl.className = "ter-zone";
        stage.querySelector("#ter-emoji").textContent = sc.e;
        stage.querySelector("#ter-text").textContent = sc.t;
        ctx.setInstruction("🌡️", "¿Cuánto te molesta?");
        ctx.onReplay(() => ctx.say(`${sc.t} ¿Cuánto te molesta?`));
        ctx.say(`${sc.t} ¿Cuánto te molesta? Desliza el termómetro.`);
      }

      function next() {
        idx++;
        ctx.progress(idx);
        later(900, nextItem);
      }

      function showReply(html, buttons) {
        reply.classList.remove("hidden");
        reply.innerHTML = `<p>${html}</p><div class="ter-reply-btns">${buttons
          .map((b, i) => `<button class="av-btn ${b.primary ? "av-btn-primary" : "av-btn-soft"}" data-i="${i}">${b.e ? `<span class="av-btn-emoji">${b.e}</span>` : ""}<span>${b.t}</span></button>`)
          .join("")}</div>`;
        reply.querySelectorAll("button").forEach((b) =>
          b.addEventListener("click", () => {
            GameAudio.playClick();
            buttons[Number(b.dataset.i)].fn();
          })
        );
      }

      okBtn.addEventListener("click", () => {
        if (locked || !touched) return;
        locked = true;
        okBtn.classList.add("hidden");
        const z = zoneOf(value);
        zones[z]++;
        ctx.attempt({ ok: true });
        GameAudio.playMatch();
        if (z === "verde") {
          const t = "¡Qué bien! Estás tranquilo. Sigue así.";
          showReply(`${t} 🌿`, []);
          ctx.say(t, next);
        } else if (z === "amarillo") {
          if (ctx.getLevel() >= 2 || ctx.mode === "lite") {
            const t = "Estás un poquito molesto. Es normal. ¿Qué te ayuda?";
            showReply(t, TOOLS.map((tl) => ({ e: tl.e, t: tl.t, fn: () => { ctx.toast("¡Buena idea! 💡", 1800); ctx.say(`Buena idea. ${tl.t} ayuda.`, next); reply.querySelectorAll("button").forEach((x) => (x.disabled = true)); } })));
            ctx.say(t);
          } else {
            const t = "Estás un poquito molesto. Es normal sentirlo.";
            showReply(t, []);
            ctx.say(t, next);
          }
        } else {
          const t = "Es mucho. También está bien sentirlo. ¿Vamos a la caja de calma?";
          showReply(t, [
            { e: "🌿", t: "Ir a la calma", primary: true, fn: () => ctx.openCalm(() => { ctx.toast("¡Usaste tu calma! 🌿", 2200); next(); }) },
            { t: "Seguir", fn: next }
          ]);
          ctx.say(t);
        }
      });

      later(200, nextItem);
      return () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
      };
    }
  });

  // =====================================================================
  // E5 · Hoy no gané, pero…
  // =====================================================================
  const PHRASES = [
    { e: "🙂", t: "No pasa nada, la próxima vez" },
    { e: "💪", t: "Lo intenté y me divertí" },
    { e: "🤝", t: "Felicito a mi compañero" }
  ];
  const WHEEL = [
    { c: "🔴", n: "rojo" },
    { c: "🟡", n: "amarillo" },
    { c: "🔵", n: "azul" },
    { c: "🟢", n: "verde" }
  ];

  Aventura.register({
    id: "gane",
    name: "Hoy no gané, pero…",
    emoji: "🎯",
    area: "emociones",
    codes: ["SE-1"],
    role: "reto",
    calmSkip: true,
    modes: ["full", "lite"],
    maxLevel: 2,
    items: (sett, level) => (level >= 2 ? 5 : 4),
    intro: {
      text: "Vamos a jugar con la suerte. A veces se gana y a veces no. Cuando no se gana, decimos algo amable y seguimos.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">🎲</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">🙂</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="gan-wrap">
          <div class="gan-scene" id="gan-scene"></div>
          <p class="gan-msg" id="gan-msg"></p>
          <div class="gan-actions" id="gan-actions"></div>
        </div>`;
      const sceneEl = stage.querySelector("#gan-scene");
      const msgEl = stage.querySelector("#gan-msg");
      const actEl = stage.querySelector("#gan-actions");
      const me = ctx.profile;
      let idx = 0;
      let handles = [];
      let outcomes = [];
      let acceptStars = 0;
      let losses = 0;
      let angle = 0;

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };

      // Decide de antemano qué rondas se pierden (nunca la primera, ni la última,
      // ni dos seguidas). El resto se gana.
      function planOutcomes() {
        const total = ctx.total;
        const nLoss = ctx.getLevel() >= 2 && ctx.mode !== "lite" ? 2 : 1;
        outcomes = Array(total).fill(true);
        const slots = [];
        for (let i = 1; i < total - 1; i++) slots.push(i);
        U.shuffle(slots);
        const chosen = [];
        slots.forEach((s) => {
          if (chosen.length < nLoss && !chosen.some((c) => Math.abs(c - s) < 2)) chosen.push(s);
        });
        chosen.forEach((s) => (outcomes[s] = false));
      }

      function round() {
        if (idx >= ctx.total) return ctx.complete({ perdidas: losses, aceptadas: acceptStars });
        const win = outcomes[idx];
        const useWheel = ctx.mode !== "lite" && ctx.getLevel() >= 2 && idx % 2 === 1;
        msgEl.textContent = "";
        actEl.innerHTML = "";
        if (useWheel) wheelRound(win);
        else diceRound(win);
      }

      // ---------- dados ----------
      function diceRound(win) {
        sceneEl.innerHTML = `
          <div class="gan-side"><span class="gan-av">${me.emoji}</span><div class="gan-die" id="gan-d1">🎲</div></div>
          <span class="gan-vs">contra</span>
          <div class="gan-side"><span class="gan-av">🦊</span><div class="gan-die" id="gan-d2">🎲</div></div>`;
        ctx.setInstruction("🎲", "Tira tu dado.");
        ctx.onReplay(() => ctx.say("Tira tu dado. El número más alto gana."));
        ctx.say("Tira tu dado. El número más alto gana.");
        actEl.innerHTML = `<button class="av-btn av-btn-primary" id="gan-go"><span class="av-btn-emoji">🎲</span><span>Tirar</span></button>`;
        const d1 = sceneEl.querySelector("#gan-d1");
        const d2 = sceneEl.querySelector("#gan-d2");
        actEl.querySelector("#gan-go").addEventListener("click", () => {
          actEl.innerHTML = "";
          const mine = win ? U.randInt(4, 6) : U.randInt(1, 3);
          const theirs = win ? U.randInt(1, 3) : U.randInt(4, 6);
          let n = 0;
          const spin = () => {
            if (n < 7) {
              d1.textContent = String(U.randInt(1, 6));
              d2.textContent = String(U.randInt(1, 6));
              n++;
              later(110, spin);
            } else {
              d1.textContent = String(mine);
              d2.textContent = String(theirs);
              GameAudio.playClick();
              later(500, () => result(win));
            }
          };
          spin();
        });
      }

      // ---------- ruleta ----------
      function wheelRound(win) {
        sceneEl.innerHTML = `
          <div class="gan-wheel-box">
            <div class="gan-pointer">▼</div>
            <div class="gan-wheel" id="gan-wheel"></div>
          </div>`;
        ctx.setInstruction("🎡", "Elige un color.");
        ctx.onReplay(() => ctx.say("Elige un color y gira la ruleta."));
        ctx.say("Elige un color y gira la ruleta.");
        actEl.innerHTML = `<div class="gan-colors">${WHEEL.map((w, i) => `<button class="gan-color" data-i="${i}">${w.c}</button>`).join("")}</div>`;
        actEl.querySelectorAll(".gan-color").forEach((b) =>
          b.addEventListener("click", () => {
            const pick = Number(b.dataset.i);
            actEl.innerHTML = "";
            GameAudio.playClick();
            const land = win ? pick : (pick + U.randInt(1, 3)) % 4;
            const center = land * 90 + 45;
            angle += 360 * 3 + (360 - center) - (angle % 360);
            const wheel = sceneEl.querySelector("#gan-wheel");
            wheel.style.transform = `rotate(${angle}deg)`;
            ctx.say(`Elegiste el ${WHEEL[pick].n}.`);
            later(3000, () => result(win));
          })
        );
      }

      // ---------- resultado ----------
      function result(win) {
        if (win) {
          GameAudio.playMatch();
          msgEl.textContent = "¡Esta vez ganaste! 🎉";
          ctx.attempt({ ok: true });
          ctx.say("¡Esta vez ganaste!", () => later(700, advance));
          return;
        }
        losses++;
        msgEl.textContent = "Esta vez no salió 🌥️";
        ctx.say("Esta vez no salió.");
        later(1500, () => {
          ctx.setInstruction("🗣️", "Hoy no gané, pero…");
          ctx.onReplay(() => ctx.say("Hoy no gané, pero. Elige qué puedes decir."));
          msgEl.textContent = "Hoy no gané, pero…";
          ctx.say("Hoy no gané, pero. ¿Qué puedes decir?");
          actEl.innerHTML = `<div class="gan-phrases">${PHRASES.map((p, i) => `<button class="gan-phrase" data-i="${i}"><span class="gan-phrase-e">${p.e}</span><span>${p.t}</span></button>`).join("")}</div>`;
          actEl.querySelectorAll(".gan-phrase").forEach((b) =>
            b.addEventListener("click", () => {
              const p = PHRASES[Number(b.dataset.i)];
              actEl.querySelectorAll(".gan-phrase").forEach((x) => (x.disabled = true));
              b.classList.add("choice-correct");
              GameAudio.playMatch();
              ctx.attempt({ ok: true });
              if (acceptStars < 2) {
                acceptStars++;
                ctx.reward("aceptar", 1, "Aceptaste el resultado");
              }
              ctx.say(`${p.t}. ¡Muy bien!`, () => later(600, advance));
            })
          );
        });
      }

      function advance() {
        idx++;
        ctx.progress(idx);
        round();
      }

      planOutcomes();
      later(200, round);
      return () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
      };
    }
  });
})();
