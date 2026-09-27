// Aventuras · Memoria y turnos
//   secuencia — recuerda el orden de luces y sonidos (números o inglés)
//   turnos    — carrera de dado para dos (con un hermano o contra Zorrito)
// Sin tiempo límite, sin perder: si algo no sale, se vuelve a mirar.
(() => {
  const U = Aventura.util;

  // =====================================================================
  // A4 · Recuerda la secuencia
  // =====================================================================
  const NUM_WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six"];
  const NUM_ES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis"];
  const COLOR_PADS = [
    { label: "🔴", say: "rojo", cls: "seq-c1", freq: 392 },
    { label: "🟢", say: "verde", cls: "seq-c2", freq: 440 },
    { label: "🔵", say: "azul", cls: "seq-c3", freq: 494 },
    { label: "🟡", say: "amarillo", cls: "seq-c4", freq: 523 }
  ];
  const NUM_FREQS = [0, 392, 440, 494, 523, 587, 659];
  // largo de la secuencia por ronda según el nivel
  const LENGTHS = {
    1: [2, 2, 3, 3, 3],
    2: [3, 3, 4, 4, 4],
    3: [3, 4, 4, 5, 5]
  };

  const playTone = (freq) => GameAudio.playNote(freq, 0.45);

  Aventura.register({
    id: "secuencia",
    name: "Recuerda la secuencia",
    emoji: "🧠",
    area: "atencion",
    codes: [],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 5,
    intro: {
      text: "Mira cómo se iluminan los botones. Después tócalos en el mismo orden. Puedes verlo otra vez las veces que quieras.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">1️⃣</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">3️⃣</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">2️⃣</div></div>`
    },
    mount(stage, ctx) {
      const lite = ctx.mode === "lite";
      const T = ctx.speed === "normal" ? 620 : 820;
      stage.innerHTML = `
        <div class="seq-wrap">
          <div class="seq-shown" id="seq-shown"></div>
          <div class="seq-pads" id="seq-pads"></div>
          <p class="seq-msg" id="seq-msg"></p>
          <button class="av-btn av-btn-soft" id="seq-again"><span class="av-btn-emoji">🔁</span><span>Ver otra vez</span></button>
        </div>`;
      const padsEl = stage.querySelector("#seq-pads");
      const shownEl = stage.querySelector("#seq-shown");
      const msgEl = stage.querySelector("#seq-msg");
      const againBtn = stage.querySelector("#seq-again");
      let idx = 0;
      let seq = [];
      let pos = 0;
      let playing = false;
      let handles = [];
      let errs = 0;
      let replays = 0;
      let maxLen = 0;
      let pads = [];
      let variant = "num";

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };
      const clearHandles = () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
      };

      function levelNow() {
        const cap = lite ? 1 : 3;
        return Math.min(ctx.itemLevel(), cap);
      }

      function buildPads(level) {
        if (lite) {
          pads = COLOR_PADS.map((p, i) => ({ ...p, i, freq: p.freq }));
          variant = "color";
        } else if (level === 1) {
          pads = [1, 2, 3, 4].map((n) => ({ i: n - 1, label: String(n), say: NUM_ES[n], en: NUM_WORDS[n], cls: `seq-c${n}`, freq: NUM_FREQS[n] }));
          variant = "num";
        } else {
          const count = level === 2 ? 6 : 6;
          pads = Array.from({ length: count }, (_, k) => ({ i: k, label: String(k + 1), say: NUM_ES[k + 1], en: NUM_WORDS[k + 1], cls: `seq-c${(k % 4) + 1}`, freq: NUM_FREQS[k + 1] }));
          variant = level === 3 ? "en" : "num";
        }
        padsEl.className = `seq-pads seq-pads-${pads.length}`;
        padsEl.innerHTML = pads
          .map((p) => `<button class="seq-pad ${p.cls}" data-i="${p.i}" aria-label="${p.say}"><span class="seq-pad-n">${p.label}</span>${variant === "en" ? `<small>${p.en}</small>` : ""}</button>`)
          .join("");
        padsEl.querySelectorAll(".seq-pad").forEach((b) => b.addEventListener("click", () => onPad(Number(b.dataset.i))));
      }

      function setPadsEnabled(on) {
        padsEl.classList.toggle("seq-locked", !on);
      }

      function flash(i, ms) {
        const b = padsEl.querySelector(`[data-i="${i}"]`);
        if (!b) return;
        b.classList.add("on");
        playTone(pads[i].freq);
        later(ms || 420, () => b.classList.remove("on"));
      }

      function say(i) {
        const p = pads[i];
        if (variant === "en") Speech.speakEnglish(p.en);
        else if (variant === "color") Speech.speak(p.say);
      }

      function playSequence() {
        clearHandles();
        playing = true;
        pos = 0;
        setPadsEnabled(false);
        againBtn.disabled = true;
        ctx.setInstruction("👀", "Mira con atención.");
        msgEl.textContent = "Mira 👀";
        shownEl.textContent = errs >= 2 ? seq.map((k) => pads[k].label).join("  ·  ") : "";
        let t = 700;
        seq.forEach((k) => {
          later(t, () => {
            flash(k, T - 250);
            if (variant !== "num") say(k);
          });
          t += T;
        });
        later(t + 150, () => {
          playing = false;
          setPadsEnabled(true);
          againBtn.disabled = false;
          ctx.setInstruction("👆", "Ahora tú: toca en el mismo orden.");
          msgEl.textContent = "Ahora tú 👆";
          ctx.onReplay(() => ctx.say("Ahora tú. Toca los botones en el mismo orden."));
        });
      }

      function newRound() {
        clearHandles();
        if (idx >= ctx.total) {
          return ctx.complete({ secuenciaMax: maxLen, repeticiones: replays });
        }
        errs = 0;
        const level = levelNow();
        buildPads(level);
        const lens = LENGTHS[level] || LENGTHS[1];
        let len = lens[Math.min(idx, lens.length - 1)];
        if (lite) len = Math.min(len, idx < 2 ? 2 : 3);
        if (ctx.isLast()) len = Math.max(2, len - 1);
        seq = [];
        for (let k = 0; k < len; k++) {
          let n = U.randInt(0, pads.length - 1);
          if (k > 0 && n === seq[k - 1] && pads.length > 2) n = (n + 1) % pads.length;
          seq.push(n);
        }
        maxLen = Math.max(maxLen, len);
        shownEl.textContent = "";
        ctx.setInstruction("🧠", "Recuerda el orden.");
        ctx.onReplay(() => ctx.say("Mira cómo se iluminan los botones y repite el orden."));
        ctx.say("Mira cómo se iluminan los botones.");
        playSequence();
      }

      function onPad(i) {
        if (playing || ctx.isPaused()) return;
        flash(i, 320);
        if (variant !== "num") say(i);
        if (i === seq[pos]) {
          pos++;
          if (pos >= seq.length) {
            playing = true;
            setPadsEnabled(false);
            GameAudio.playMatch();
            ctx.attempt({ ok: true, helped: errs >= 2 });
            msgEl.textContent = "¡Lo recordaste! ✨";
            idx++;
            ctx.progress(idx);
            later(1300, newRound);
          }
        } else {
          // sin castigo: se vuelve a mirar la secuencia y se intenta otra vez
          errs++;
          ctx.attempt({ ok: false });
          pos = 0;
          playing = true;
          setPadsEnabled(false);
          msgEl.textContent = errs >= 2 ? "Te ayudo: mira los números arriba." : "¡Casi! Miremos otra vez 👀";
          later(1200, playSequence);
        }
      }

      againBtn.addEventListener("click", () => {
        if (playing) return;
        replays++;
        GameAudio.playClick();
        playSequence();
      });

      later(200, newRound);
      return () => clearHandles();
    }
  });

  // =====================================================================
  // A5 · Turnos con mi hermano/a
  // =====================================================================
  const TRACK = 12;
  const COLS = 6;

  Aventura.register({
    id: "turnos",
    name: "Turnos: carrera de dado",
    emoji: "🎲",
    area: "atencion",
    codes: ["SE-4", "SE-1"],
    role: null,
    modes: ["full", "lite"],
    maxLevel: 1,
    items: () => TRACK,
    intro: {
      text: "Cada quien tira el dado en su turno. Mientras esperas, descansa ✋. ¡Gana el que llega a la meta, y jugamos los dos!",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">🎲</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">🏁</div></div>`
    },
    mount(stage, ctx) {
      const me = ctx.profile;
      const others = Storage.listProfiles().filter((p) => p.id !== me.id).slice(0, 3);
      let players = [];
      let turn = 0;
      let busy = false;
      let waitStars = 0;
      let handles = [];
      let impulsive = 0;
      let rolls = 0;

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };

      function chooseOpponent() {
        const opts = [...others.map((p) => ({ id: p.id, emoji: p.emoji, name: p.name, human: true })), { id: "cpu", emoji: "🤖", name: "Zorrito", human: false }];
        stage.innerHTML = `
          <div class="tur-wrap">
            <p class="tur-q">¿Con quién juegas?</p>
            <div class="tur-choices">${opts.map((o, i) => `<button class="tur-choice" data-i="${i}"><span>${o.emoji}</span><b>${o.name}</b></button>`).join("")}</div>
          </div>`;
        ctx.setInstruction("🎲", "¿Con quién juegas?");
        ctx.onReplay(() => ctx.say("¿Con quién juegas?"));
        ctx.say("¿Con quién juegas?");
        stage.querySelectorAll(".tur-choice").forEach((b) =>
          b.addEventListener("click", () => {
            GameAudio.playClick();
            const o = opts[Number(b.dataset.i)];
            players = [
              { emoji: me.emoji, name: me.name, pos: 0, human: true, mine: true },
              { emoji: o.emoji, name: o.name, pos: 0, human: o.human, mine: false }
            ];
            board();
          })
        );
      }

      function board() {
        const cells = Array.from({ length: TRACK + 1 }, (_, i) => i);
        stage.innerHTML = `
          <div class="tur-wrap">
            <div class="tur-turn" id="tur-turn"></div>
            <div class="tur-board" id="tur-board">${cells
              .map((i) => `<div class="tur-cell ${i === 0 ? "start" : ""} ${i === TRACK ? "goal" : ""}" data-i="${i}"><span class="tur-num">${i === 0 ? "🏁" : i === TRACK ? "🎯" : i}</span><span class="tur-tokens"></span></div>`)
              .join("")}</div>
            <div class="tur-die-row">
              <div class="tur-die" id="tur-die">🎲</div>
              <button class="av-btn av-btn-primary tur-roll" id="tur-roll"><span class="av-btn-emoji">🎲</span><span>Tirar el dado</span></button>
            </div>
            <div class="tur-wait hidden" id="tur-wait"><span>✋</span><b>Espero mi turno</b></div>
          </div>`;
        stage.querySelector("#tur-roll").addEventListener("click", onRoll);
        ctx.setTotal(TRACK);
        ctx.progress(0);
        drawTokens();
        startTurn();
      }

      function drawTokens() {
        stage.querySelectorAll(".tur-tokens").forEach((t) => (t.textContent = ""));
        players.forEach((p) => {
          const cell = stage.querySelector(`.tur-cell[data-i="${p.pos}"] .tur-tokens`);
          if (cell) cell.textContent += p.emoji;
        });
        ctx.progress(Math.max(...players.map((p) => p.pos)));
      }

      function startTurn() {
        const p = players[turn];
        const turnEl = stage.querySelector("#tur-turn");
        const rollBtn = stage.querySelector("#tur-roll");
        const waitEl = stage.querySelector("#tur-wait");
        turnEl.innerHTML = `<span class="tur-turn-l">Turno de</span><span class="tur-turn-av">${p.emoji}</span><b>${p.name}</b>`;
        ctx.setInstruction("🎲", `Turno de ${p.name}`);
        ctx.onReplay(() => ctx.say(`Turno de ${p.name}.`));
        ctx.say(`Turno de ${p.name}.`);
        busy = false;
        const human = p.human;
        rollBtn.classList.toggle("hidden", !human);
        waitEl.classList.toggle("hidden", human);
        if (human) {
          rollBtn.innerHTML = `<span class="av-btn-emoji">${p.emoji}</span><span>Tirar el dado</span>`;
        } else {
          later(1800, () => doRoll());
        }
        // el que espera ve el pictograma ✋; con pareja humana, quien NO tiene el turno espera
        if (players.length === 2 && players[1].human) {
          waitEl.classList.remove("hidden");
          waitEl.innerHTML = `<span>✋</span><b>Espera, ${players[1 - turn].name}</b>`;
        } else if (!human) {
          waitEl.innerHTML = `<span>✋</span><b>Espero mi turno</b>`;
        }
      }

      function onRoll() {
        if (busy || ctx.isPaused()) return;
        doRoll();
      }

      function doRoll() {
        if (busy) return;
        busy = true;
        rolls++;
        const p = players[turn];
        const die = stage.querySelector("#tur-die");
        die.classList.add("num");
        const rollBtn = stage.querySelector("#tur-roll");
        rollBtn.classList.add("hidden");
        const value = U.randInt(1, 3);
        let n = 0;
        const spin = () => {
          if (n < 6) {
            die.textContent = String(U.randInt(1, 3));
            n++;
            later(120, spin);
          } else {
            die.textContent = String(value);
            GameAudio.playClick();
            ctx.say(`${p.name} avanza ${value}.`, null);
            later(700, () => move(p, value));
          }
        };
        spin();
      }

      function move(p, steps) {
        p.pos = Math.min(TRACK, p.pos + steps);
        drawTokens();
        GameAudio.playNeutralFlip();
        if (p.pos >= TRACK) return finish(p);
        later(900, () => {
          turn = 1 - turn;
          // quien esperaba recibe una estrella (máx. 2) al llegar su turno
          const waiter = players[turn];
          if (waiter.mine && waitStars < 2) {
            waitStars++;
            ctx.reward("espera", 1, "¡Esperaste tu turno!");
          }
          startTurn();
        });
      }

      function finish(winner) {
        const iWon = winner.mine;
        const other = players.find((x) => !x.mine);
        const msg = iWon ? `¡Llegó ${winner.name} a la meta!` : `¡${winner.name} llegó primero!`;
        stage.querySelector("#tur-turn").innerHTML = `<span class="tur-turn-av">${winner.emoji}</span><b>${msg}</b>`;
        stage.querySelector("#tur-roll").classList.add("hidden");
        stage.querySelector("#tur-wait").classList.add("hidden");
        GameAudio.playCelebration();
        const closing = iWon ? "¡Buen juego, los dos!" : "No pasa nada, ¡buen juego! La próxima vez puede ser tu turno de ganar.";
        ctx.toast(iWon ? "¡Buen juego, los dos! 🎉" : "¡Buen juego! 🎉", 3000);
        if (!iWon) ctx.reward("cambio", 1, "Aceptaste el resultado");
        ctx.say(`${msg} ${closing}`, () => later(700, () => ctx.complete({ gane: iWon, rival: other.human ? "hermano" : "compu", tiros: rolls })));
      }

      later(200, chooseOpponent);
      return () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
      };
    }
  });
})();
