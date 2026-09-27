// Aventuras · Atención y autocontrol
//   semaforo  — esperar antes de tocar (freno inhibitorio), ritmo lento
//   cambio    — clasificar y adaptarse a un cambio de regla avisado
//   mision    — tareas de varios pasos: empezar, seguir y terminar
(() => {
  const ANIMALS = ["🐶", "🐱", "🐰", "🐸", "🐵", "🐼", "🦁", "🐮", "🐷", "🐔", "🐯", "🐨"];

  // =====================================================================
  // A1 · Semáforo de animales
  // =====================================================================
  Aventura.register({
    id: "semaforo",
    name: "Semáforo de animales",
    emoji: "🚦",
    area: "atencion",
    codes: ["EJ-1"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 8,
    intro: {
      text: "Toca al animal cuando el fondo sea verde. Si es rojo, espera.",
      demo: () => `<div class="av-demo-row">
          <div class="av-demo-card g">🐶<span class="av-demo-hand">👆</span></div>
          <div class="av-demo-card r">🐱<span class="av-demo-hand">✋</span></div>
        </div>`
    },
    mount(stage, ctx) {
      const T = ctx.speed === "normal" ? { tapHint: 4500, wait: 2800, yellow: 1800 } : { tapHint: 6000, wait: 3500, yellow: 2200 };
      stage.innerHTML = `
        <div class="sem-wrap">
          <div class="sem-lights"><span class="sem-light r"></span><span class="sem-light y"></span><span class="sem-light g"></span></div>
          <button class="sem-card sem-none" id="sem-card" aria-label="animal"><span class="sem-animal"></span><span class="sem-cue"></span></button>
          <p class="sem-msg" id="sem-msg"></p>
          <div class="sem-banner hidden" id="sem-banner"></div>
        </div>`;
      const card = stage.querySelector("#sem-card");
      const animalEl = card.querySelector(".sem-animal");
      const cueEl = card.querySelector(".sem-cue");
      const msg = stage.querySelector("#sem-msg");
      const banner = stage.querySelector("#sem-banner");
      const lights = { r: stage.querySelector(".sem-light.r"), y: stage.querySelector(".sem-light.y"), g: stage.querySelector(".sem-light.g") };

      let idx = 0;
      let handles = [];
      let inverseLeft = 0;
      let inverseDone = false;
      let consecImpulsive = 0;
      let waitStarGiven = false;
      let reactTimes = [];
      let cur = null; // ítem en curso
      const rule = () => (inverseLeft > 0 ? "inverso" : "normal");

      ctx.setInstruction("🚦", "Verde: toca. Rojo: espera.");
      ctx.onReplay(() => ctx.say(inverseLeft > 0 ? "Ahora al revés. Rojo, toca. Verde, espera." : "Verde, toca. Rojo, espera."));

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };
      const clearHandles = () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
      };
      const setColor = (c) => {
        card.className = `sem-card sem-${c}`;
        ["r", "y", "g"].forEach((k) => lights[k].classList.remove("on"));
        if (c === "rojo") lights.r.classList.add("on");
        if (c === "amarillo") lights.y.classList.add("on");
        if (c === "verde") lights.g.classList.add("on");
      };

      function pickType(level) {
        const r = Math.random();
        if (level <= 1) return r < 0.6 ? "verde" : "rojo";
        if (rule() === "inverso") return r < 0.5 ? "verde" : "rojo";
        return r < 0.4 ? "verde" : r < 0.7 ? "rojo" : "amarillo";
      }

      function finishItem(ok) {
        clearHandles();
        cur.active = false;
        idx++;
        ctx.progress(idx);
        card.classList.add("sem-done");
        later(900, nextItem);
      }

      function nextItem() {
        clearHandles();
        if (idx >= ctx.total) {
          return ctx.complete({ reaccionMs: reactTimes.length ? Math.round(reactTimes.reduce((a, b) => a + b, 0) / reactTimes.length) : null });
        }
        const level = ctx.itemLevel();
        // un solo bloque "al revés", avisado antes, solo en nivel 3 y lejos del final
        if (level >= 3 && !inverseDone && inverseLeft === 0 && idx >= 3 && idx <= ctx.total - 4) {
          inverseDone = true;
          inverseLeft = 2;
          announce("¡Cambio! Ahora al revés: 🔴 toca, 🟢 espera", "Cambio. Ahora al revés. Rojo, toca. Verde, espera.", 3200, () => {
            ctx.setInstruction("🔄", "Al revés: rojo toca, verde espera.");
            startItem(level);
          });
          return;
        }
        startItem(level);
      }

      function announce(text, spoken, ms, then) {
        setColor("none");
        animalEl.textContent = "";
        cueEl.textContent = "";
        banner.textContent = text;
        banner.classList.remove("hidden");
        ctx.say(spoken);
        later(ms, () => {
          banner.classList.add("hidden");
          then();
        });
      }

      function startItem(level) {
        let type = pickType(level);
        // la última ronda siempre es un acierto seguro: verde y regla normal
        if (ctx.isLast()) {
          inverseLeft = 0;
          type = "verde";
        }
        const last = ctx.isLast();
        const inverse = rule() === "inverso";
        cur = { type, inverse, tapAllowed: false, impulsive: false, helped: false, shownAt: 0, active: true };
        animalEl.textContent = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        cueEl.textContent = "";
        msg.textContent = "";
        card.classList.remove("sem-done", "sem-shake");

        const needTap = (t) => (inverse ? t === "rojo" : t === "verde");
        if (type === "amarillo") {
          setColor("amarillo");
          cur.tapAllowed = false;
          later(T.yellow, () => {
            if (!cur.active) return;
            setColor("verde");
            cur.tapAllowed = true;
            cur.shownAt = performance.now();
            armTapHint();
          });
        } else if (needTap(type)) {
          setColor(type);
          cur.tapAllowed = true;
          cur.shownAt = performance.now();
          armTapHint();
        } else {
          // hay que esperar: el animal se va solo, y esperar es el acierto
          setColor(type);
          cur.tapAllowed = false;
          if (consecImpulsive >= 2) {
            cueEl.textContent = "✋";
            cur.helped = true;
          }
          later(T.wait, () => {
            if (!cur.active) return;
            if (!cur.impulsive) {
              ctx.attempt({ ok: true, helped: cur.helped });
              if (!waitStarGiven) {
                waitStarGiven = true;
                ctx.reward("espera", 1, "¡Esperaste muy bien!");
              }
              msg.textContent = "¡Muy bien, esperaste! ✋";
              consecImpulsive = 0;
            }
            animalEl.textContent = "";
            setColor("none");
            finishItem();
          });
        }
        if (last) msg.textContent = "";
      }

      // Si no toca a tiempo no pasa nada: aparece una ayuda y espera lo que necesite.
      function armTapHint() {
        later(T.tapHint, () => {
          if (!cur.active) return;
          cur.helped = true;
          cueEl.textContent = "👆";
          msg.textContent = "Ahora sí: ¡tócalo!";
        });
      }

      card.addEventListener("click", () => {
        if (!cur || !cur.active || ctx.isPaused()) return;
        if (cur.tapAllowed) {
          cur.active = false;
          const rt = Math.round(performance.now() - cur.shownAt);
          reactTimes.push(rt);
          GameAudio.playMatch();
          ctx.attempt({ ok: true, helped: cur.helped });
          consecImpulsive = 0;
          msg.textContent = "¡Bien!";
          cueEl.textContent = "";
          finishItem();
        } else if (!cur.impulsive) {
          // tocó antes de tiempo: se responde con calma
          cur.impulsive = true;
          consecImpulsive++;
          ctx.attempt({ ok: false, impulsive: true });
          card.classList.remove("sem-shake");
          void card.offsetWidth;
          card.classList.add("sem-shake");
          msg.textContent = cur.type === "amarillo" ? "¡Casi! Con amarillo esperamos ✋" : cur.inverse ? "¡Casi! Ahora es al revés 🔄" : "¡Casi! Con rojo esperamos ✋";
        }
      });

      ctx.later(300, nextItem);
      return () => clearHandles();
    }
  });

  // =====================================================================
  // A2 · Cambio de regla
  // =====================================================================
  Aventura.register({
    id: "cambio",
    name: "Cambio de regla",
    emoji: "🔄",
    area: "atencion",
    codes: ["EJ-2"],
    role: "reto",
    modes: ["full"],
    maxLevel: 3,
    items: (s, level) => [8, 10, 12][level - 1] || 8,
    intro: {
      text: "Pon cada tarjeta en su caja. Ojo: a veces la regla cambia, ¡te avisaremos!",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">🔴<br><small>por color</small></div><span class="av-demo-arrow">🔄</span><div class="av-demo-card">🟦<br><small>por forma</small></div></div>`
    },
    mount(stage, ctx) {
      // Cajas fijas: A = círculo rojo, B = cuadrado azul. Tarjetas que se cruzan
      // (círculo azul, cuadrado rojo) muestran si se cambió de regla o no.
      stage.innerHTML = `
        <div class="cam-wrap">
          <div class="cam-rule" id="cam-rule"></div>
          <div class="cam-card-zone"></div>
          <div class="cam-boxes">
            <div class="cam-box" data-drop="A" id="cam-box-a"><span class="cam-shape cam-circle cam-red"></span></div>
            <div class="cam-box" data-drop="B" id="cam-box-b"><span class="cam-shape cam-square cam-blue"></span></div>
          </div>
          <p class="sem-msg" id="cam-msg"></p>
        </div>`;
      const ruleEl = stage.querySelector("#cam-rule");
      const zone = stage.querySelector(".cam-card-zone");
      let cardEl = null;
      const boxA = stage.querySelector("#cam-box-a");
      const boxB = stage.querySelector("#cam-box-b");
      const msg = stage.querySelector("#cam-msg");
      const total = ctx.total;
      const switchAt = total >= 12 ? [4, 7, 10] : total >= 10 ? [4, 7] : [4];
      let idx = 0;
      let curRule = "color";
      let prevRule = null;
      let card = null;
      let errsItem = 0;
      let afterSwitch = 0; // cuántas tarjetas van desde el último cambio
      let afterSwitchOk = 0;
      let perseveraciones = 0;
      let waiting = false;

      const ruleLabel = () => (curRule === "color" ? "🎨 Por color" : "🔷 Por forma");
      const setRule = () => {
        ruleEl.textContent = ruleLabel();
        ctx.setInstruction(curRule === "color" ? "🎨" : "🔷", curRule === "color" ? "Ponla en la caja de su color." : "Ponla en la caja de su forma.");
      };
      ctx.onReplay(() => ctx.say(curRule === "color" ? "Ponla en la caja de su color. Rojo con rojo, azul con azul." : "Ponla en la caja de su forma. Círculo con círculo, cuadrado con cuadrado."));

      const answer = (c) => (curRule === "color" ? (c.color === "rojo" ? "A" : "B") : c.shape === "circulo" ? "A" : "B");
      const otherRule = (c) => (curRule === "color" ? (c.shape === "circulo" ? "A" : "B") : c.color === "rojo" ? "A" : "B");

      function makeCard() {
        const cross = Math.random() < 0.85;
        const color = Math.random() < 0.5 ? "rojo" : "azul";
        let shape;
        if (cross) shape = color === "rojo" ? "cuadrado" : "circulo";
        else shape = color === "rojo" ? "circulo" : "cuadrado";
        return { color, shape };
      }

      function showCard() {
        card = makeCard();
        errsItem = 0;
        boxA.classList.remove("cam-glow");
        boxB.classList.remove("cam-glow");
        // una ficha nueva por tarjeta (así no se duplican los eventos de arrastre)
        zone.innerHTML = "";
        cardEl = document.createElement("div");
        cardEl.className = "cam-card cam-in";
        cardEl.innerHTML = `<span class="cam-shape cam-${card.shape === "circulo" ? "circle" : "square"} cam-${card.color === "rojo" ? "red" : "blue"}"></span>`;
        zone.appendChild(cardEl);
        ctx.draggable(cardEl, { onDrop: (z) => z && place(z.dataset.drop), onTap: () => {} });
      }
      // alternativa al arrastre: tocar la caja
      boxA.addEventListener("click", () => card && place("A"));
      boxB.addEventListener("click", () => card && place("B"));

      function place(box) {
        if (waiting) return;
        const right = answer(card);
        if (box === right) {
          waiting = true;
          GameAudio.playMatch();
          ctx.attempt({ ok: true, helped: errsItem >= 2 });
          afterSwitch++;
          if (prevRule && afterSwitch <= 2 && errsItem === 0) afterSwitchOk++;
          if (prevRule && afterSwitch === 2 && afterSwitchOk === 2) ctx.reward("cambio", 1, "⭐ Estrella flexible: te adaptaste");
          msg.textContent = "¡Bien!";
          idx++;
          ctx.progress(idx);
          ctx.later(700, next);
        } else {
          errsItem++;
          ctx.attempt({ ok: false });
          if (prevRule && afterSwitch < 3 && box === otherRule(card)) perseveraciones++;
          const target = box === "A" ? boxA : boxB;
          target.classList.add("cam-shake");
          ctx.later(450, () => target.classList.remove("cam-shake"));
          msg.textContent = `¡Casi! Mira otra vez: ahora es ${curRule === "color" ? "por color 🎨" : "por forma 🔷"}`;
          if (errsItem >= 2) {
            (right === "A" ? boxA : boxB).classList.add("cam-glow");
          }
        }
      }

      function next() {
        waiting = false;
        msg.textContent = "";
        if (idx >= total) return ctx.complete({ perseveraciones });
        if (switchAt.includes(idx) && !ctx.isLast() && total - idx > 2) {
          const to = curRule === "color" ? "forma" : "color";
          announceSwitch(to);
          return;
        }
        showCard();
      }

      function announceSwitch(to) {
        waiting = true;
        zone.innerHTML = "";
        const emoji = to === "forma" ? "🔷" : "🎨";
        const root = document.createElement("div");
        root.className = "cam-switch";
        root.innerHTML = `<div class="cam-switch-emoji">🔄</div><h3>¡Cambio de plan!</h3><p>Ahora es por <b>${to}</b> ${emoji}</p><button class="av-btn av-btn-primary" id="cam-ok">¡Entendido!</button>`;
        zone.appendChild(root);
        ctx.say(`Cambio de plan. Ahora es por ${to}.`);
        root.querySelector("#cam-ok").addEventListener("click", () => {
          GameAudio.playClick();
          root.remove();
          prevRule = curRule;
          curRule = to === "forma" ? "forma" : "color";
          afterSwitch = 0;
          afterSwitchOk = 0;
          setRule();
          waiting = false;
          showCard();
        });
      }

      setRule();
      ctx.later(300, showCard);
      return () => {};
    }
  });

  // =====================================================================
  // A3 · Misión completa (iniciar, seguir y terminar una tarea)
  // =====================================================================
  const TARGETS = [
    { emoji: "🍎", name: "manzanas" },
    { emoji: "🍌", name: "plátanos" },
    { emoji: "⭐", name: "estrellas" },
    { emoji: "🐟", name: "peces" }
  ];
  const DISTRACT = ["🍇", "🍓", "🌼", "🐢", "🚗", "🎈", "🍄", "🧦"];
  const CONTAINERS = [
    { emoji: "🧺", name: "la canasta" },
    { emoji: "📦", name: "la caja" },
    { emoji: "🛍️", name: "la bolsa" }
  ];

  Aventura.register({
    id: "mision",
    name: "Misión completa",
    emoji: "🎯",
    area: "atencion",
    codes: ["EJ-3"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 3,
    intro: {
      text: "Cada misión tiene pasos. Hazlos en orden: cada uno se marca con ✔.",
      demo: () => `<div class="av-demo-steps"><div>✔ Encuentra 🍎🍎🍎</div><div>➜ Ponlas en 🧺</div><div>➜ Toca 🔔</div></div>`
    },
    mount(stage, ctx) {
      let idx = 0;
      let m = null;
      let redirect = 0;
      let stepsNoRedirect = 0;
      let totalSteps = 0;

      function newMission() {
        const level = ctx.itemLevel();
        const target = ctx.util.pick(TARGETS);
        const count = level === 1 ? 2 : level === 2 ? 3 : ctx.util.randInt(3, 4);
        const cont = ctx.util.pick(CONTAINERS);
        const steps = [
          { key: "find", text: `Encuentra ${count} ${target.emoji}` },
          { key: "put", text: `Ponlas en ${cont.name} ${cont.emoji}` }
        ];
        if (level >= 2) steps.push({ key: "bell", text: "Toca la campana 🔔" });
        if (level >= 3) steps.push({ key: "fox", text: "Dile gracias al zorro 🦊" });
        m = { target, count, cont, steps, step: 0, found: 0, placed: 0, redirected: false, stepRedirects: 0 };
        render();
      }

      function checklist() {
        return m.steps
          .map((s, i) => `<li class="mis-step ${i < m.step ? "done" : i === m.step ? "current" : ""}"><span class="mis-chk">${i < m.step ? "✔" : i + 1}</span><span>${s.text}</span></li>`)
          .join("");
      }

      function render() {
        const items = [];
        for (let i = 0; i < m.count; i++) items.push({ emoji: m.target.emoji, target: true });
        const nDis = 4 + Math.min(2, ctx.getLevel());
        for (let i = 0; i < nDis; i++) items.push({ emoji: ctx.util.pick(DISTRACT), target: false });
        const scene = ctx.util.shuffle(items)
          .map((it, i) => `<button class="mis-item ${it.target ? "is-target" : ""}" data-i="${i}" data-target="${it.target ? 1 : 0}">${it.emoji}</button>`)
          .join("");
        stage.innerHTML = `
          <div class="mis-wrap">
            <ul class="mis-list" id="mis-list">${checklist()}</ul>
            <div class="mis-scene" id="mis-scene">${scene}</div>
            <div class="mis-tray" id="mis-tray"></div>
            <div class="mis-actions">
              <div class="mis-container" data-drop="cont" id="mis-cont">${m.cont.emoji}</div>
              ${m.steps.some((s) => s.key === "bell") ? `<button class="mis-bell" id="mis-bell">🔔</button>` : ""}
              ${m.steps.some((s) => s.key === "fox") ? `<button class="mis-fox" id="mis-fox">🦊</button>` : ""}
            </div>
          </div>`;
        ctx.setInstruction("🎯", `Misión: ${m.steps.map((s) => s.text).join(" → ")}`.slice(0, 90), m.steps.map((s) => s.text).join(". Después, ") + ".");
        ctx.onReplay(() => ctx.say(m.steps.map((s, i) => `${i + 1}. ${s.text}`).join(". ")));
        wire();
      }

      function refreshList() {
        const ul = stage.querySelector("#mis-list");
        if (ul) ul.innerHTML = checklist();
      }

      function redirectNow(msg) {
        redirect++;
        m.stepRedirects++;
        ctx.toast(msg, 2200);
        const cur = stage.querySelector(".mis-step.current");
        if (cur) {
          cur.classList.remove("mis-pulse");
          void cur.offsetWidth;
          cur.classList.add("mis-pulse");
        }
      }

      function stepDone() {
        totalSteps++;
        if (m.stepRedirects === 0) stepsNoRedirect++;
        m.stepRedirects = 0;
        m.step++;
        GameAudio.playMatch();
        refreshList();
        if (m.step >= m.steps.length) {
          ctx.attempt({ ok: true, helped: redirect > 0 });
          idx++;
          ctx.progress(idx);
          ctx.later(900, () => (idx >= ctx.total ? ctx.complete({ pasosSinRedireccion: stepsNoRedirect, pasos: totalSteps }) : newMission()));
        }
      }

      function wire() {
        const tray = stage.querySelector("#mis-tray");
        stage.querySelectorAll(".mis-item").forEach((b) => {
          b.addEventListener("click", () => {
            if (b.disabled) return;
            const cur = m.steps[m.step];
            if (!cur || cur.key !== "find") {
              return redirectNow("Primero termina el paso que brilla 🙂");
            }
            if (b.dataset.target !== "1") {
              ctx.attempt({ ok: false });
              b.classList.add("mis-shake");
              ctx.later(400, () => b.classList.remove("mis-shake"));
              return ctx.toast(`Busca las ${m.target.emoji}`, 1800);
            }
            b.disabled = true;
            b.classList.add("mis-gone");
            m.found++;
            const t = document.createElement("button");
            t.className = "mis-tray-item";
            t.textContent = m.target.emoji;
            tray.appendChild(t);
            ctx.draggable(t, {
              onDrop: (zone) => zone && zone.dataset.drop === "cont" && put(t),
              onTap: () => put(t)
            });
            GameAudio.playClick();
            if (m.found >= m.count) stepDone();
          });
        });
        const bell = stage.querySelector("#mis-bell");
        if (bell)
          bell.addEventListener("click", () => {
            const cur = m.steps[m.step];
            if (cur && cur.key === "bell") {
              GameAudio.playSoftBell();
              stepDone();
            } else redirectNow("Todavía no: sigue el paso que brilla ✨");
          });
        const fox = stage.querySelector("#mis-fox");
        if (fox)
          fox.addEventListener("click", () => {
            const cur = m.steps[m.step];
            if (cur && cur.key === "fox") {
              ctx.say("¡Gracias, amigo!");
              stepDone();
            } else redirectNow("Todavía no: sigue el paso que brilla ✨");
          });
      }

      function put(t) {
        const cur = m.steps[m.step];
        if (!cur || cur.key !== "put") return redirectNow("Primero encuentra todas 🙂");
        if (t.dataset.done === "1") return;
        t.dataset.done = "1";
        t.classList.add("mis-gone");
        m.placed++;
        GameAudio.playClick();
        stage.querySelector("#mis-cont").classList.add("mis-cont-ok");
        ctx.later(300, () => stage.querySelector("#mis-cont") && stage.querySelector("#mis-cont").classList.remove("mis-cont-ok"));
        if (m.placed >= m.count) stepDone();
      }

      ctx.later(200, newMission);
      return () => {};
    }
  });
})();
