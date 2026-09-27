// Aventuras · Emociones y rutinas
//   emociones — ¿cómo se siente? y ¿qué pasó?
//   puedo     — ¿qué puedo hacer? (historias cortas ante un "no" o un cambio)
//   rutina    — mis rutinas con pictogramas (se marcan en la vida real)
// Tono: siempre con calma. Nunca se regaña; una opción menos buena se
// responde mostrando qué pasaría y una mejor alternativa.
(() => {
  const U = Aventura.util;

  // =====================================================================
  // E1 · ¿Cómo se siente?
  // =====================================================================
  const EMO = [
    { id: "alegria", label: "Alegre", face: "😄" },
    { id: "tristeza", label: "Triste", face: "😢" },
    { id: "enojo", label: "Enojado", face: "😠" },
    { id: "miedo", label: "Con miedo", face: "😨" },
    { id: "sorpresa", label: "Sorprendido", face: "😮" }
  ];
  const SCENES = [
    { emo: "alegria", cause: { e: "🎂", t: "Es su cumpleaños" }, other: { e: "💔", t: "Se rompió su juguete" } },
    { emo: "alegria", cause: { e: "⚽", t: "Metió un gol" }, other: { e: "🌧️", t: "Se mojó con la lluvia" } },
    { emo: "tristeza", cause: { e: "🍦", t: "Se le cayó el helado" }, other: { e: "🏆", t: "Ganó un premio" } },
    { emo: "tristeza", cause: { e: "🐶", t: "Su mascota está enferma" }, other: { e: "🎁", t: "Le dieron un regalo" } },
    { emo: "enojo", cause: { e: "🧸", t: "Le quitaron su juguete" }, other: { e: "🤗", t: "Le dieron un abrazo" } },
    { emo: "enojo", cause: { e: "🚫", t: "Le dijeron que no" }, other: { e: "🍰", t: "Comió pastel" } },
    { emo: "miedo", cause: { e: "⛈️", t: "Hay una tormenta fuerte" }, other: { e: "🎈", t: "Tiene un globo nuevo" } },
    { emo: "miedo", cause: { e: "🌑", t: "Está muy oscuro" }, other: { e: "🍪", t: "Hay galletas" } },
    { emo: "sorpresa", cause: { e: "🎉", t: "Le hicieron una fiesta sorpresa" }, other: { e: "😴", t: "Se fue a dormir" } },
    { emo: "sorpresa", cause: { e: "🐰", t: "Salió un conejo del sombrero" }, other: { e: "📚", t: "Leyó un libro" } }
  ];

  Aventura.register({
    id: "emociones",
    name: "¿Cómo se siente?",
    emoji: "😊",
    area: "emociones",
    codes: ["SE-3"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 6,
    intro: {
      text: "Mira la carita. ¿Cómo se siente? Después piensa qué pudo pasar.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">😢</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">🍦💧</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="emo-wrap">
          <div class="emo-face" id="emo-face"></div>
          <div class="emo-options" id="emo-options"></div>
        </div>`;
      const faceEl = stage.querySelector("#emo-face");
      const optsEl = stage.querySelector("#emo-options");
      let idx = 0;
      let scene = null;
      let errs = 0;

      function nextItem() {
        if (idx >= ctx.total) return ctx.complete();
        scene = U.pick(SCENES);
        askFeeling();
      }

      function askFeeling() {
        errs = 0;
        Feedback.hide(optsEl);
        const level = ctx.itemLevel();
        const nOpts = level === 1 ? 2 : level === 2 ? 3 : 4;
        const correct = EMO.find((e) => e.id === scene.emo);
        const others = U.shuffle(EMO.filter((e) => e.id !== scene.emo)).slice(0, nOpts - 1);
        const opts = U.shuffle([correct, ...others]);
        faceEl.textContent = correct.face;
        ctx.setInstruction("😊", "¿Cómo se siente?");
        ctx.onReplay(() => ctx.say("¿Cómo se siente?"));
        ctx.say("Mira la carita. ¿Cómo se siente?");
        optsEl.className = "emo-options";
        optsEl.innerHTML = opts.map((o) => `<button class="emo-opt" data-id="${o.id}"><span class="emo-opt-face">${o.face}</span><span>${o.label}</span></button>`).join("");
        optsEl.querySelectorAll(".emo-opt").forEach((b) =>
          b.addEventListener("click", () => {
            if (b.disabled) return;
            Speech.speak(EMO.find((e) => e.id === b.dataset.id).label);
            if (b.dataset.id === scene.emo) {
              optsEl.querySelectorAll(".emo-opt").forEach((x) => (x.disabled = true));
              b.classList.add("choice-correct");
              Feedback.hide(optsEl);
              GameAudio.playMatch();
              ctx.attempt({ ok: true, helped: errs >= 2 });
              if (level >= 2) ctx.later(1100, askCause);
              else finishItem();
            } else {
              errs++;
              ctx.attempt({ ok: false });
              b.disabled = true;
              b.classList.add("choice-wrong");
              if (errs >= 2) optsEl.querySelector(`[data-id="${scene.emo}"]`).classList.add("choice-hint");
              Feedback.show(optsEl, "¡Casi!", errs >= 2 ? "Mira la carita que brilla." : "Mira otra vez la carita y cómo tiene la boca y los ojos.");
            }
          })
        );
      }

      function askCause() {
        errs = 0;
        Feedback.hide(optsEl);
        const opts = U.shuffle([{ ...scene.cause, ok: true }, { ...scene.other, ok: false }]);
        ctx.setInstruction("🤔", "¿Qué pasó para que se sienta así?");
        ctx.onReplay(() => ctx.say("¿Qué pasó para que se sienta así?"));
        ctx.say("¿Qué pasó para que se sienta así?");
        optsEl.className = "emo-options emo-causes";
        optsEl.innerHTML = opts.map((o) => `<button class="emo-opt emo-cause" data-ok="${o.ok ? 1 : 0}"><span class="emo-opt-face">${o.e}</span><span>${o.t}</span></button>`).join("");
        optsEl.querySelectorAll(".emo-cause").forEach((b) =>
          b.addEventListener("click", () => {
            if (b.disabled) return;
            Speech.speak(b.textContent);
            if (b.dataset.ok === "1") {
              optsEl.querySelectorAll(".emo-cause").forEach((x) => (x.disabled = true));
              b.classList.add("choice-correct");
              Feedback.hide(optsEl);
              GameAudio.playMatch();
              ctx.attempt({ ok: true, helped: errs >= 2 });
              finishItem();
            } else {
              errs++;
              ctx.attempt({ ok: false });
              b.disabled = true;
              b.classList.add("choice-wrong");
              optsEl.querySelector('[data-ok="1"]').classList.add("choice-hint");
              Feedback.show(optsEl, "Piénsalo otra vez", "Mira la carita y elige lo que pudo hacerla sentir así.");
            }
          })
        );
      }

      function finishItem() {
        idx++;
        ctx.progress(idx);
        ctx.later(1100, nextItem);
      }

      ctx.later(200, nextItem);
      return () => {};
    }
  });

  // =====================================================================
  // E4 · ¿Qué puedo hacer?
  // =====================================================================
  const STORIES = [
    {
      e: "📵",
      t: "Mamá dice: “Hoy ya no hay tablet”.",
      good: [
        { e: "🗣️", t: "Decir “no me gusta, pero está bien”" },
        { e: "🎈", t: "Respirar y pedir jugar otra cosa" }
      ],
      bad: { e: "😡", t: "Gritar", why: "Gritar hace que todos se sientan mal y la tablet sigue guardada.", better: "Mejor: respirar y pedir jugar otra cosa." }
    },
    {
      e: "🎲",
      t: "Perdiste el juego.",
      good: [
        { e: "🙂", t: "Decir “no pasa nada, la próxima vez”" },
        { e: "🤝", t: "Pedir jugar otra vez" }
      ],
      bad: { e: "💥", t: "Tirar las piezas", why: "Tirar las piezas asusta a los demás y ya no quieren jugar.", better: "Mejor: decir “no pasa nada, la próxima vez”." }
    },
    {
      e: "🌳",
      t: "Cambiaron el plan: hoy no vamos al parque.",
      good: [
        { e: "🗣️", t: "Decir “estoy un poco triste”" },
        { e: "💡", t: "Proponer otro plan divertido" }
      ],
      bad: { e: "😭", t: "Llorar sin parar", why: "Llorar sin parar no cambia el plan y nos cansa.", better: "Mejor: contar que estás triste y proponer otro plan." }
    },
    {
      e: "🧸",
      t: "Tu hermano no quiere prestarte su juguete.",
      good: [
        { e: "⏳", t: "Esperar tu turno" },
        { e: "🗣️", t: "Pedirlo con cariño otra vez" }
      ],
      bad: { e: "✋", t: "Quitárselo", why: "Quitar el juguete lastima y termina en pelea.", better: "Mejor: esperar tu turno o pedirlo con cariño." }
    },
    {
      e: "🍪",
      t: "Se acabaron las galletas.",
      good: [
        { e: "🍎", t: "Pedir otra cosa rica" },
        { e: "🎈", t: "Respirar y esperar a mañana" }
      ],
      bad: { e: "😡", t: "Patalear", why: "Patalear no hace aparecer más galletas y nos pone de mal humor.", better: "Mejor: pedir otra cosa rica." }
    },
    {
      e: "🎨",
      t: "Te equivocaste al dibujar.",
      good: [
        { e: "🙋", t: "Pedir ayuda" },
        { e: "🧽", t: "Borrar y probar otra vez" }
      ],
      bad: { e: "📄", t: "Romper la hoja", why: "Al romper la hoja se pierde todo lo que ya hiciste bien.", better: "Mejor: borrar y probar otra vez." }
    },
    {
      e: "🧩",
      t: "Es hora de guardar el juego.",
      good: [
        { e: "⏳", t: "Pedir un ratito más y luego guardar" },
        { e: "🧹", t: "Guardar y elegir qué jugar mañana" }
      ],
      bad: { e: "🙈", t: "Esconderme para no guardar", why: "Si te escondes, el juego se puede perder o romper.", better: "Mejor: pedir un ratito más y luego guardar." }
    },
    {
      e: "🚦",
      t: "Hay que esperar en la fila.",
      good: [
        { e: "🎵", t: "Cantar bajito mientras espero" },
        { e: "🔢", t: "Contar hasta 10" }
      ],
      bad: { e: "🏃", t: "Colarme adelante", why: "Colarse molesta a los demás, que también estaban esperando.", better: "Mejor: contar hasta 10 mientras esperas." }
    }
  ];

  Aventura.register({
    id: "puedo",
    name: "¿Qué puedo hacer?",
    emoji: "💡",
    area: "emociones",
    codes: ["SE-1", "SE-2"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 5,
    intro: {
      text: "A veces las cosas no salen como queremos. Vamos a pensar qué podemos hacer.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">🧸</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">💡</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="pue-wrap">
          <div class="pue-story"><span class="pue-emoji" id="pue-emoji"></span><p id="pue-text"></p></div>
          <div class="pue-options" id="pue-options"></div>
        </div>`;
      const emojiEl = stage.querySelector("#pue-emoji");
      const textEl = stage.querySelector("#pue-text");
      const optsEl = stage.querySelector("#pue-options");
      let idx = 0;
      let order = U.shuffle(STORIES);
      let errs = 0;

      function nextItem() {
        if (idx >= ctx.total) return ctx.complete();
        const st = order[idx % order.length];
        errs = 0;
        Feedback.hide(optsEl);
        const level = ctx.itemLevel();
        emojiEl.textContent = st.e;
        textEl.textContent = st.t;
        // siempre 2 opciones: nivel 2 = dos buenas (cualquiera sirve); resto = una buena y una menos buena
        const twoGood = level === 2;
        const opts = U.shuffle(
          twoGood
            ? [{ ...st.good[0], ok: true }, { ...st.good[1], ok: true }]
            : [{ ...U.pick(st.good), ok: true }, { ...st.bad, ok: false, isBad: true }]
        );
        ctx.setInstruction("💡", "¿Qué puedo hacer?");
        ctx.onReplay(() => ctx.say(`${st.t} ¿Qué puedo hacer?`));
        ctx.say(`${st.t} ¿Qué puedo hacer?`);
        optsEl.innerHTML = opts.map((o, i) => `<button class="pue-opt" data-i="${i}"><span class="pue-opt-emoji">${o.e}</span><span>${o.t}</span></button>`).join("");
        optsEl.querySelectorAll(".pue-opt").forEach((b) =>
          b.addEventListener("click", () => {
            if (b.disabled) return;
            const o = opts[Number(b.dataset.i)];
            Speech.speak(o.t);
            if (o.ok) {
              optsEl.querySelectorAll(".pue-opt").forEach((x) => (x.disabled = true));
              b.classList.add("choice-correct");
              GameAudio.playMatch();
              ctx.attempt({ ok: true, helped: errs >= 1 });
              const note = twoGood ? "¡Muy bien! Hay varias formas de resolverlo, y esta ayuda." : "¡Muy bien! Eso ayuda a que todos estemos tranquilos.";
              Feedback.hide(optsEl);
              ctx.toast(note, 3000);
              ctx.later(2200, () => {
                idx++;
                ctx.progress(idx);
                nextItem();
              });
            } else {
              // se responde con calma: qué pasaría y una mejor alternativa. Nunca se regaña.
              errs++;
              ctx.attempt({ ok: false });
              b.disabled = true;
              b.classList.add("choice-wrong");
              const good = optsEl.querySelector(".pue-opt:not(.choice-wrong)");
              if (good) good.classList.add("choice-hint");
              Feedback.show(optsEl, "Mmm, pensemos juntos", `${o.why} ${o.better}`);
            }
          })
        );
      }

      ctx.later(200, nextItem);
      return () => {};
    }
  });

  // =====================================================================
  // R1 · Mi rutina
  // =====================================================================
  const DEFAULT_ROUTINES = [
    {
      id: "manana",
      name: "Mi mañana",
      emoji: "🌅",
      when: "am",
      steps: [
        { emoji: "🛏️", text: "Levantarme" },
        { emoji: "🚽", text: "Ir al baño" },
        { emoji: "🪥", text: "Lavarme los dientes" },
        { emoji: "👕", text: "Vestirme" },
        { emoji: "🍽️", text: "Desayunar" },
        { emoji: "🎒", text: "Alistar la mochila" }
      ]
    },
    {
      id: "tareas",
      name: "Mis tareas",
      emoji: "📚",
      when: "pm",
      steps: [
        { emoji: "🧼", text: "Lavarme las manos" },
        { emoji: "📓", text: "Sacar mis cuadernos" },
        { emoji: "✏️", text: "Hacer la tarea" },
        { emoji: "🎒", text: "Guardar todo en la mochila" }
      ]
    },
    {
      id: "noche",
      name: "Mi noche",
      emoji: "🌙",
      when: "night",
      steps: [
        { emoji: "🍽️", text: "Cenar" },
        { emoji: "🛁", text: "Bañarme" },
        { emoji: "🪥", text: "Lavarme los dientes" },
        { emoji: "📖", text: "Leer un cuento" },
        { emoji: "😴", text: "A dormir" }
      ]
    }
  ];
  Aventura.defaults = Aventura.defaults || {};
  Aventura.defaults.routines = DEFAULT_ROUTINES;

  Aventura.register({
    id: "rutina",
    name: "Mi rutina",
    emoji: "📋",
    area: "rutinas",
    codes: ["AU-1"],
    role: null,
    modes: ["full", "lite"],
    maxLevel: 1,
    items: () => 1,
    intro: { text: "Toca ✔ cada vez que termines un paso de verdad. ¡Tú puedes solo!" },
    mount(stage, ctx) {
      const routines = ctx.settings.routines && ctx.settings.routines.length ? ctx.settings.routines : DEFAULT_ROUTINES;
      const h = new Date().getHours();
      const now = h < 12 ? "am" : h < 18 ? "pm" : "night";
      const suggested = routines.find((r) => r.when === now) || routines[0];
      const other = routines.find((r) => r !== suggested);
      let routine = null;
      let done = [];

      function choose() {
        const list = [suggested, other].filter(Boolean);
        stage.innerHTML = `
          <div class="rut-wrap">
            <p class="rut-q">¿Cuál rutina hacemos?</p>
            <div class="rut-choices">${list.map((r, i) => `<button class="rut-choice" data-i="${i}"><span>${r.emoji}</span><b>${r.name}</b></button>`).join("")}</div>
          </div>`;
        ctx.setInstruction("📋", "Elige tu rutina.");
        ctx.onReplay(() => ctx.say("Elige tu rutina."));
        ctx.say("¿Cuál rutina hacemos?");
        stage.querySelectorAll(".rut-choice").forEach((b) =>
          b.addEventListener("click", () => {
            GameAudio.playClick();
            routine = list[Number(b.dataset.i)];
            done = routine.steps.map(() => false);
            steps();
          })
        );
      }

      function steps() {
        stage.innerHTML = `<div class="rut-wrap"><ul class="rut-list" id="rut-list"></ul></div>`;
        const ul = stage.querySelector("#rut-list");
        routine.steps.forEach((s, i) => {
          const li = document.createElement("li");
          li.className = "rut-step";
          li.innerHTML = `<span class="rut-emoji">${s.emoji}</span><span class="rut-text">${s.text}</span><button class="rut-check" aria-label="Hecho">✔</button>`;
          li.querySelector(".rut-text").addEventListener("click", () => ctx.say(s.text));
          li.querySelector(".rut-check").addEventListener("click", () => {
            done[i] = !done[i];
            li.classList.toggle("done", done[i]);
            GameAudio.playClick();
            const n = done.filter(Boolean).length;
            ctx.setTotal(routine.steps.length);
            ctx.progress(n);
            if (n === routine.steps.length) {
              ctx.attempt({ ok: true });
              GameAudio.playMatch();
              ctx.toast("¡Lo hiciste solo! ✨", 2500);
              ctx.later(1500, () => ctx.complete({ rutina: routine.name }));
            }
          });
          ul.appendChild(li);
        });
        ctx.setInstruction(routine.emoji, routine.name);
        ctx.onReplay(() => ctx.say(`${routine.name}. Toca cada paso cuando lo termines.`));
        ctx.setTotal(routine.steps.length);
        ctx.progress(0);
        ctx.say(`${routine.name}. Toca cada paso cuando lo termines.`);
      }

      ctx.later(200, choose);
      return () => {};
    }
  });
})();
