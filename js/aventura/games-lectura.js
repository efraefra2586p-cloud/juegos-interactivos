// Aventuras · Lectura
//   lee — "Lee conmigo": textos muy breves con imagen. Primero la app lee y
//   resalta cada palabra (karaoke); después lee el niño (puede tocar una
//   palabra para oírla). Al final, 2 preguntas con opciones en imagen.
// Cada nivel quita un poco de ayuda: el 3 ya no lee primero la app.
(() => {
  const U = Aventura.util;

  // level = nivel mínimo en el que aparece el texto
  const TEXTS = [
    {
      level: 1, emoji: "🐱",
      lines: ["El gato Simón duerme en la cama.", "Le gusta el sol de la mañana."],
      qs: [
        { q: "¿Quién duerme?", line: 0, opts: [{ e: "🐱", t: "El gato", ok: true }, { e: "🐶", t: "El perro" }, { e: "🐦", t: "El pájaro" }] },
        { q: "¿Qué le gusta al gato?", line: 1, opts: [{ e: "☀️", t: "El sol", ok: true }, { e: "🌧️", t: "La lluvia" }, { e: "❄️", t: "La nieve" }] }
      ]
    },
    {
      level: 1, emoji: "🐸",
      lines: ["La rana salta en el charco.", "Hace croac, croac."],
      qs: [
        { q: "¿Qué animal salta?", line: 0, opts: [{ e: "🐸", t: "La rana", ok: true }, { e: "🐘", t: "El elefante" }, { e: "🐟", t: "El pez" }] },
        { q: "¿Dónde salta?", line: 0, opts: [{ e: "💦", t: "En el charco", ok: true }, { e: "🏠", t: "En la casa" }, { e: "🌵", t: "En el desierto" }] }
      ]
    },
    {
      level: 1, emoji: "🍎",
      lines: ["Ana tiene una manzana roja.", "Se la come en el recreo."],
      qs: [
        { q: "¿Qué tiene Ana?", line: 0, opts: [{ e: "🍎", t: "Una manzana", ok: true }, { e: "🍌", t: "Un plátano" }, { e: "🍇", t: "Uvas" }] },
        { q: "¿Cuándo se la come?", line: 1, opts: [{ e: "🏫", t: "En el recreo", ok: true }, { e: "🌙", t: "De noche" }, { e: "🛁", t: "En el baño" }] }
      ]
    },
    {
      level: 2, emoji: "🚲",
      lines: ["Luis tiene una bicicleta azul.", "Todas las tardes sale a pasear con su papá.", "Siempre se pone el casco."],
      qs: [
        { q: "¿De qué color es la bicicleta?", line: 0, opts: [{ e: "🔵", t: "Azul", ok: true }, { e: "🔴", t: "Roja" }, { e: "🟢", t: "Verde" }] },
        { q: "¿Qué se pone Luis?", line: 2, opts: [{ e: "⛑️", t: "El casco", ok: true }, { e: "🎩", t: "Un sombrero" }, { e: "🧤", t: "Guantes" }] }
      ]
    },
    {
      level: 2, emoji: "🐶",
      lines: ["Sara tiene un perro llamado Coco.", "Coco corre en el parque y busca la pelota.", "Cuando se cansa, se echa a dormir."],
      qs: [
        { q: "¿Qué busca Coco?", line: 1, opts: [{ e: "⚽", t: "La pelota", ok: true }, { e: "🦴", t: "Un hueso" }, { e: "🧦", t: "Un calcetín" }] },
        { q: "¿Qué hace cuando se cansa?", line: 2, opts: [{ e: "😴", t: "Duerme", ok: true }, { e: "🏃", t: "Corre más" }, { e: "🍽️", t: "Cena" }] }
      ]
    },
    {
      level: 2, emoji: "🌧️",
      lines: ["Hoy llovió mucho en la ciudad.", "Los niños se pusieron botas y paraguas.", "Saltaron en los charcos y se rieron."],
      qs: [
        { q: "¿Qué pasó hoy?", line: 0, opts: [{ e: "🌧️", t: "Llovió", ok: true }, { e: "☀️", t: "Hizo sol" }, { e: "❄️", t: "Nevó" }] },
        { q: "¿Qué se pusieron los niños?", line: 1, opts: [{ e: "☂️", t: "Botas y paraguas", ok: true }, { e: "🕶️", t: "Gafas de sol" }, { e: "🧣", t: "Bufanda" }] }
      ]
    },
    {
      level: 3, emoji: "🌱",
      lines: ["Pedro sembró una semilla en una maceta.", "Todos los días la regaba con un poquito de agua.", "Una semana después salió una hojita verde.", "Pedro estaba feliz y le puso un nombre."],
      qs: [
        { q: "¿Qué sembró Pedro?", line: 0, opts: [{ e: "🌰", t: "Una semilla", ok: true }, { e: "🍎", t: "Una manzana" }, { e: "🐛", t: "Un gusano" }] },
        { q: "¿Qué salió después de una semana?", line: 2, opts: [{ e: "🌿", t: "Una hojita", ok: true }, { e: "🌸", t: "Una flor" }, { e: "🍅", t: "Un tomate" }] }
      ]
    },
    {
      level: 3, emoji: "🏖️",
      lines: ["En vacaciones fuimos a la playa.", "Sacamos la sombrilla y la pelota.", "Hicimos un castillo de arena muy grande.", "Al final del día vimos cómo se ponía el sol."],
      qs: [
        { q: "¿A dónde fueron?", line: 0, opts: [{ e: "🏖️", t: "A la playa", ok: true }, { e: "🏔️", t: "A la montaña" }, { e: "🏙️", t: "A la ciudad" }] },
        { q: "¿Qué hicieron con la arena?", line: 2, opts: [{ e: "🏰", t: "Un castillo", ok: true }, { e: "🚗", t: "Un carro" }, { e: "⛵", t: "Un barco" }] }
      ]
    }
  ];

  Aventura.register({
    id: "lee",
    name: "Lee conmigo",
    emoji: "📖",
    area: "letras",
    codes: ["LE-5", "LG-1"],
    role: "reto",
    modes: ["full"],
    maxLevel: 3,
    items: () => 3,
    intro: {
      text: "Primero yo leo y las palabras se iluminan. Después lees tú. Al final, dos preguntas con dibujos.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">📖</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">🗣️</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">❓</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="lee-wrap">
          <div class="lee-pic" id="lee-pic"></div>
          <div class="lee-text" id="lee-text"></div>
          <div class="lee-actions" id="lee-actions"></div>
          <div class="lee-q hidden" id="lee-qbox">
            <p class="lee-question" id="lee-question"></p>
            <div class="lee-options" id="lee-options"></div>
          </div>
        </div>`;
      const picEl = stage.querySelector("#lee-pic");
      const textEl = stage.querySelector("#lee-text");
      const actEl = stage.querySelector("#lee-actions");
      const qbox = stage.querySelector("#lee-qbox");
      const questionEl = stage.querySelector("#lee-question");
      const optsEl = stage.querySelector("#lee-options");
      let idx = 0;
      let used = [];
      let handles = [];
      let reading = 0; // token para cancelar una lectura en curso
      let text = null;
      let qi = 0;
      let errs = 0;
      let usedText = false;

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };
      const clearHandles = () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
      };

      function pickText(level) {
        const ok = TEXTS.filter((t) => t.level <= level && !used.includes(t));
        const same = ok.filter((t) => t.level === level);
        const t = U.pick(same.length ? same : ok.length ? ok : TEXTS);
        used.push(t);
        return t;
      }

      function renderText(interactiveWords) {
        textEl.innerHTML = text.lines
          .map((line, li) => `<p class="lee-line" data-l="${li}">${line
            .split(" ")
            .map((w, wi) => `<span class="lee-w" data-l="${li}" data-w="${wi}">${w}</span>`)
            .join(" ")}</p>`)
          .join("");
        if (interactiveWords) {
          textEl.querySelectorAll(".lee-w").forEach((w) =>
            w.addEventListener("click", () => {
              w.classList.add("on");
              ctx.say(w.textContent.replace(/[.,¿?¡!]/g, ""));
              later(900, () => w.classList.remove("on"));
            })
          );
        }
      }

      // Lee una línea resaltando palabra por palabra. Continúa cuando terminaron
      // tanto la voz como el resaltado (así funciona igual sin voz disponible).
      function readLine(li, token, done) {
        const words = Array.from(textEl.querySelectorAll(`.lee-w[data-l="${li}"]`));
        const lineText = text.lines[li];
        const weights = words.map((w) => w.textContent.length + 1);
        const total = weights.reduce((a, b) => a + b, 0);
        const totalMs = Math.max(1500, total * 78);
        let speechDone = false;
        let hlDone = false;
        const check = () => {
          if (token !== reading) return;
          if (speechDone && hlDone) done();
        };
        textEl.querySelectorAll(".lee-line").forEach((p) => p.classList.toggle("now", Number(p.dataset.l) === li));
        let t = 0;
        words.forEach((w, i) => {
          later(t, () => {
            if (token !== reading) return;
            words.forEach((x) => x.classList.remove("on"));
            w.classList.add("on");
            w.classList.add("read");
          });
          t += (weights[i] / total) * totalMs;
        });
        later(t + 200, () => {
          hlDone = true;
          check();
        });
        ctx.say(lineText, () => {
          speechDone = true;
          check();
        });
      }

      function karaoke(then) {
        const token = ++reading;
        textEl.querySelectorAll(".lee-w").forEach((w) => w.classList.remove("on", "read"));
        actEl.innerHTML = `<span class="lee-listening">🔊 Escucha y sigue con el dedo…</span>`;
        ctx.setInstruction("👂", "Escucha y sigue con el dedo.");
        let li = 0;
        const next = () => {
          if (token !== reading) return;
          textEl.querySelectorAll(".lee-w").forEach((x) => x.classList.remove("on"));
          if (li >= text.lines.length) {
            textEl.querySelectorAll(".lee-line").forEach((p) => p.classList.remove("now"));
            return then();
          }
          const cur = li++;
          readLine(cur, token, () => later(350, next));
        };
        later(300, next);
      }

      function readerStep(withHelp) {
        reading++; // cancela cualquier karaoke pendiente
        renderText(true);
        ctx.setInstruction("🗣️", "Ahora lee tú en voz alta.");
        ctx.onReplay(() => ctx.say(text.lines.join(" ")));
        ctx.say("Ahora lee tú en voz alta. Si no sabes una palabra, tócala.");
        actEl.innerHTML = `
          <button class="av-btn av-btn-soft" id="lee-listen"><span class="av-btn-emoji">🔊</span><span>Escuchar</span></button>
          <button class="av-btn av-btn-primary" id="lee-done"><span class="av-btn-emoji">✔</span><span>Ya leí</span></button>`;
        actEl.querySelector("#lee-listen").addEventListener("click", () => {
          usedText = true;
          karaoke(() => readerStep(true));
        });
        actEl.querySelector("#lee-done").addEventListener("click", () => {
          GameAudio.playClick();
          startQuestions();
        });
      }

      function startItem() {
        clearHandles();
        if (idx >= ctx.total) return ctx.complete();
        const level = ctx.itemLevel();
        text = pickText(level);
        qi = 0;
        usedText = false;
        qbox.classList.add("hidden");
        actEl.classList.remove("hidden");
        textEl.classList.remove("lee-hidden");
        picEl.textContent = text.emoji;
        renderText(false);
        ctx.setInstruction("📖", "Vamos a leer.");
        if (level >= 3) {
          // nivel 3: lee primero el niño; la app solo ayuda si se lo pide
          readerStep(false);
        } else {
          karaoke(() => readerStep(true));
        }
      }

      function startQuestions() {
        reading++;
        actEl.classList.add("hidden");
        qbox.classList.remove("hidden");
        askQuestion();
      }

      function askQuestion() {
        Feedback.hide(optsEl);
        errs = 0;
        textEl.querySelectorAll(".lee-line").forEach((p) => p.classList.remove("lee-hint"));
        const q = text.qs[qi];
        const level = ctx.itemLevel();
        questionEl.textContent = q.q;
        ctx.setInstruction("❓", q.q);
        ctx.onReplay(() => ctx.say(q.q));
        ctx.say(q.q);
        // nivel 3: el texto se esconde, se puede volver a mirar con un botón
        const hide = level >= 3;
        textEl.classList.toggle("lee-hidden", hide);
        let peek = qbox.querySelector("#lee-peek");
        if (peek) peek.remove();
        if (hide) {
          peek = document.createElement("button");
          peek.id = "lee-peek";
          peek.className = "av-btn av-btn-soft av-btn-small";
          peek.innerHTML = "<span>📖 Ver el texto</span>";
          peek.addEventListener("click", () => {
            usedText = true;
            textEl.classList.toggle("lee-hidden");
          });
          qbox.insertBefore(peek, questionEl);
        }
        const opts = U.shuffle(q.opts);
        optsEl.innerHTML = opts.map((o, i) => `<button class="lee-opt" data-i="${i}"><span class="lee-opt-e">${o.e}</span><span class="lee-opt-t">${o.t}</span></button>`).join("");
        optsEl.querySelectorAll(".lee-opt").forEach((b) =>
          b.addEventListener("click", () => {
            if (b.disabled) return;
            const o = opts[Number(b.dataset.i)];
            Speech.speak(o.t);
            if (o.ok) {
              optsEl.querySelectorAll(".lee-opt").forEach((x) => (x.disabled = true));
              b.classList.add("choice-correct");
              Feedback.hide(optsEl);
              GameAudio.playMatch();
              ctx.attempt({ ok: true, helped: errs >= 2 || usedText });
              qi++;
              if (qi >= text.qs.length) {
                idx++;
                ctx.progress(idx);
                later(1300, () => {
                  textEl.classList.remove("lee-hidden");
                  startItem();
                });
              } else later(1100, askQuestion);
            } else {
              errs++;
              ctx.attempt({ ok: false });
              b.disabled = true;
              b.classList.add("choice-wrong");
              // pista: se ilumina la línea del texto donde está la respuesta
              textEl.classList.remove("lee-hidden");
              textEl.querySelectorAll(".lee-line").forEach((p) => p.classList.toggle("lee-hint", Number(p.dataset.l) === q.line));
              if (errs >= 2) optsEl.querySelectorAll(".lee-opt").forEach((x, i) => opts[i].ok && x.classList.add("choice-hint"));
              Feedback.show(optsEl, "Vuelve a leer", errs >= 2 ? "Mira la respuesta que brilla." : "Mira la parte del texto que se ilumina. Ahí está la respuesta.");
            }
          })
        );
      }

      later(200, startItem);
      return () => {
        reading++;
        clearHandles();
      };
    }
  });
})();
