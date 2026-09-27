// Aventuras · Cálculo con material
//   bloques — sumas y restas con llevadas usando bloques de base 10
//   ranas   — saltos de rana: contar de 2 en 2, de 3 en 3... y grupos iguales
// Distintos a "Sumas y restas" (que es de elegir la respuesta): aquí se
// manipula el material y se entiende POR QUÉ se lleva o se presta. Sin tiempo.
(() => {
  const U = Aventura.util;

  // =====================================================================
  // N3 · Bloques mágicos
  // =====================================================================
  const COL_NAME = ["unidades", "decenas", "centenas"];
  const COL_ONE = ["unidad", "decena", "centena"];
  const digits = (n) => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10];

  function makeSum(level) {
    for (let guard = 0; guard < 500; guard++) {
      let a;
      let b;
      if (level === 1) {
        a = U.randInt(4, 9);
        b = U.randInt(4, 9);
      } else if (level === 2) {
        a = U.randInt(12, 68);
        b = U.randInt(6, 49);
      } else {
        a = U.randInt(120, 699);
        b = U.randInt(45, 399);
      }
      const da = digits(a);
      const db = digits(b);
      const carry = da[0] + db[0] >= 10 || da[1] + db[1] >= 10;
      const limit = level === 3 ? 1000 : 100;
      if ((level === 1 ? a + b >= 11 : carry) && a + b < limit) return { op: "+", a, b, ans: a + b };
    }
    return { op: "+", a: 8, b: 7, ans: 15 };
  }

  function makeSub(level) {
    for (let guard = 0; guard < 800; guard++) {
      let a;
      let b;
      if (level === 2) {
        a = U.randInt(31, 92);
        b = U.randInt(8, a - 6);
      } else {
        a = U.randInt(230, 890);
        b = U.randInt(45, a - 30);
      }
      const da = digits(a);
      const db = digits(b);
      // hay que "prestar": unidades insuficientes, y las decenas de a no son cero
      if (db[0] > da[0] && da[1] >= 1 && a - b > 0) return { op: "-", a, b, ans: a - b };
    }
    return { op: "-", a: 42, b: 17, ans: 25 };
  }

  function sumOptions(p) {
    const da = digits(p.a);
    const db = digits(p.b);
    const noCarry = ((da[0] + db[0]) % 10) + ((da[1] + db[1]) % 10) * 10 + ((da[2] + db[2]) % 10) * 100;
    return uniqueOptions(p.ans, [noCarry, p.ans - 10, p.ans + 10, p.ans + 1, p.ans - 1]);
  }
  function subOptions(p) {
    const da = digits(p.a);
    const db = digits(p.b);
    const noBorrow = Math.abs(da[0] - db[0]) + Math.abs(da[1] - db[1]) * 10 + Math.abs(da[2] - db[2]) * 100;
    return uniqueOptions(p.ans, [noBorrow, p.ans + 10, p.ans - 10, p.ans + 1, p.ans - 1]);
  }
  function uniqueOptions(ans, candidates) {
    const out = [ans];
    candidates.forEach((c) => {
      if (out.length < 3 && c > 0 && !out.includes(c)) out.push(c);
    });
    let k = 2;
    while (out.length < 3) {
      if (!out.includes(ans + k)) out.push(ans + k);
      k++;
    }
    return U.shuffle(out);
  }

  Aventura.register({
    id: "bloques",
    name: "Bloques mágicos",
    emoji: "🧱",
    area: "numeros",
    codes: ["MA-2"],
    role: "interes",
    modes: ["full"],
    maxLevel: 3,
    items: () => 4,
    intro: {
      text: "Vamos a sumar y restar con bloques. Cuando juntas 10 unidades, ¡se cambian por una decena!",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">🟦🟦<br>🟦🟦</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">🟩</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="blk-wrap">
          <div class="blk-problem" id="blk-problem"></div>
          <p class="blk-guide" id="blk-guide"></p>
          <div class="blk-board" id="blk-board"></div>
          <div class="blk-opts hidden" id="blk-opts"></div>
        </div>`;
      const probEl = stage.querySelector("#blk-problem");
      const guideEl = stage.querySelector("#blk-guide");
      const boardEl = stage.querySelector("#blk-board");
      const optsEl = stage.querySelector("#blk-opts");

      let idx = 0;
      let prob = null;
      let cols = [[], [], []]; // bloques por columna: 0 unidades, 1 decenas, 2 centenas
      let rem = [0, 0, 0]; // en la resta: cuánto queda por quitar en cada columna
      let sel = { col: -1, set: new Set() };
      let ncols = 2;
      let busy = false;
      let phase = "work";
      let errs = 0;
      let helped = false;
      let hintHandle = null;
      let handles = [];
      let newBlock = null;
      let warned = false;

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };
      const clearHandles = () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
        hintHandle = null;
      };

      // ---------- dibujo ----------
      function render() {
        const order = ncols === 3 ? [2, 1, 0] : [1, 0];
        boardEl.innerHTML = order
          .map((c) => {
            const blocks = cols[c]
              .map((b, i) => `<button class="blk blk-${"udc"[c]} ${b.origin === "b" ? "blk-b" : b.origin === "n" ? "blk-n" : ""} ${sel.col === c && sel.set.has(i) ? "sel" : ""} ${newBlock && newBlock.c === c && newBlock.i === i ? "pop" : ""}" data-c="${c}" data-i="${i}" aria-label="${COL_ONE[c]}"></button>`)
              .join("");
            const extra = prob.op === "-" && rem[c] > 0 ? `<span class="blk-rem">quitar ${rem[c]}</span>` : "";
            return `<div class="blk-col" data-c="${c}"><div class="blk-area blk-area-${"udc"[c]}">${blocks}</div><div class="blk-count"><b>${cols[c].length}</b> ${cols[c].length === 1 ? COL_ONE[c] : COL_NAME[c]}</div>${extra}</div>`;
          })
          .join("");
        newBlock = null;
        boardEl.querySelectorAll(".blk").forEach((b) => b.addEventListener("click", () => onBlock(Number(b.dataset.c), Number(b.dataset.i))));
      }

      function lowestFull() {
        for (let c = 0; c < ncols - 1; c++) if (cols[c].length >= 10) return c;
        return -1;
      }
      function curSub() {
        for (let c = 0; c < ncols; c++) if (rem[c] > 0) return c;
        return -1;
      }

      function guide(speak) {
        let text;
        if (phase === "answer") {
          text = `¿Cuánto es ${prob.a} ${prob.op === "+" ? "más" : "menos"} ${prob.b}?`;
        } else if (prob.op === "+") {
          const c = lowestFull();
          text = `Hay ${cols[c].length} ${COL_NAME[c]}. Toca 10 para cambiarlas por 1 ${COL_ONE[c + 1]}.`;
        } else {
          const c = curSub();
          if (cols[c].length >= rem[c]) text = `Quita ${rem[c]} ${COL_NAME[c]}. Toca los bloques.`;
          else text = `No alcanzan las ${COL_NAME[c]}. Toca 1 ${COL_ONE[c + 1]} para cambiarla por 10 ${COL_NAME[c]}.`;
        }
        guideEl.textContent = text;
        ctx.setInstruction("🧱", prob.op === "+" ? "Suma con bloques" : "Resta con bloques");
        ctx.onReplay(() => ctx.say(text));
        if (speak) ctx.say(text);
      }

      // ---------- ayuda si se queda quieto ----------
      function armHint() {
        ctx.cancelLater(hintHandle);
        if (phase !== "work") return;
        hintHandle = later(11000, () => {
          if (phase !== "work" || busy) return;
          helped = true;
          if (prob.op === "+") {
            const c = lowestFull();
            boardEl.querySelectorAll(`.blk[data-c="${c}"]`).forEach((b, i) => i < 10 && b.classList.add("hint"));
          } else {
            const c = curSub();
            if (cols[c].length >= rem[c]) {
              boardEl.querySelectorAll(`.blk[data-c="${c}"]`).forEach((b, i) => i < rem[c] && b.classList.add("hint"));
            } else {
              let k = c + 1;
              while (k < ncols && cols[k].length === 0) k++;
              const src = boardEl.querySelector(`.blk[data-c="${k}"]`);
              if (src) src.classList.add("hint");
            }
          }
          guide(true);
        });
      }

      // ---------- interacción ----------
      function onBlock(c, i) {
        if (busy || phase !== "work" || ctx.isPaused()) return;
        GameAudio.playClick();
        if (prob.op === "+") sumTap(c, i);
        else subTap(c, i);
        armHint();
      }

      function sumTap(c, i) {
        if (cols[c].length < 10 || c >= ncols - 1) {
          ctx.toast("Aquí todavía no hay 10 para cambiar", 1800);
          return;
        }
        if (sel.col !== c) sel = { col: c, set: new Set() };
        if (sel.set.has(i)) sel.set.delete(i);
        else if (sel.set.size < 10) sel.set.add(i);
        const el = boardEl.querySelector(`.blk[data-c="${c}"][data-i="${i}"]`);
        if (el) el.classList.toggle("sel", sel.set.has(i));
        if (sel.set.size === 10) convertUp(c);
      }

      function convertUp(c) {
        busy = true;
        const chosen = [...sel.set];
        boardEl.querySelectorAll(`.blk[data-c="${c}"]`).forEach((b, i) => chosen.includes(i) && b.classList.add("melt"));
        GameAudio.playMatch();
        ctx.say(`Diez ${COL_NAME[c]} son una ${COL_ONE[c + 1]}.`);
        later(700, () => {
          cols[c] = cols[c].filter((_, i) => !chosen.includes(i));
          cols[c + 1].push({ origin: "n" });
          newBlock = { c: c + 1, i: cols[c + 1].length - 1 };
          sel = { col: -1, set: new Set() };
          busy = false;
          render();
          afterStep();
        });
      }

      function subTap(c, i) {
        const cur = curSub();
        if (c === cur) {
          if (cols[c].length < rem[c]) {
            ctx.toast("Faltan bloques: cámbialos primero", 1800);
            return;
          }
          busy = true;
          const el = boardEl.querySelector(`.blk[data-c="${c}"][data-i="${i}"]`);
          if (el) el.classList.add("melt");
          later(320, () => {
            cols[c].splice(i, 1);
            rem[c]--;
            busy = false;
            render();
            afterStep();
          });
          return;
        }
        // tocar una columna de más arriba: cambiar 1 bloque por 10 de la columna de abajo
        const deficient = cols[cur].length < rem[cur];
        let empty = true;
        for (let k = cur + 1; k < c; k++) if (cols[k].length) empty = false;
        if (c > cur && deficient && empty) {
          busy = true;
          const el = boardEl.querySelector(`.blk[data-c="${c}"][data-i="${i}"]`);
          if (el) el.classList.add("melt");
          GameAudio.playMatch();
          ctx.say(`Una ${COL_ONE[c]} son diez ${COL_NAME[c - 1]}.`);
          later(700, () => {
            cols[c].splice(i, 1);
            for (let k = 0; k < 10; k++) cols[c - 1].push({ origin: "n" });
            busy = false;
            render();
            afterStep();
          });
        } else {
          ctx.toast(c > cur ? "Todavía no hace falta cambiar" : "Primero las unidades", 1800);
        }
      }

      function afterStep() {
        if (prob.op === "+") {
          if (lowestFull() < 0) return toAnswer();
        } else if (curSub() < 0) return toAnswer();
        guide(true);
        armHint();
      }

      // ---------- respuesta ----------
      function toAnswer() {
        phase = "answer";
        clearHandles();
        errs = 0;
        guide(true);
        const opts = prob.op === "+" ? sumOptions(prob) : subOptions(prob);
        optsEl.classList.remove("hidden");
        optsEl.innerHTML = opts.map((n) => `<button class="blk-opt" data-n="${n}">${n}</button>`).join("");
        optsEl.querySelectorAll(".blk-opt").forEach((b) =>
          b.addEventListener("click", () => {
            if (b.disabled) return;
            const n = Number(b.dataset.n);
            Speech.speak(String(n));
            if (n === prob.ans) {
              optsEl.querySelectorAll(".blk-opt").forEach((x) => (x.disabled = true));
              b.classList.add("choice-correct");
              Feedback.hide(optsEl);
              GameAudio.playMatch();
              ctx.attempt({ ok: true, helped: helped || errs >= 2 });
              idx++;
              ctx.progress(idx);
              later(1600, nextItem);
            } else {
              errs++;
              ctx.attempt({ ok: false });
              b.disabled = true;
              b.classList.add("choice-wrong");
              const parts = [2, 1, 0]
                .filter((c) => c < ncols)
                .map((c) => `${cols[c].length} ${cols[c].length === 1 ? COL_ONE[c] : COL_NAME[c]}`);
              if (errs >= 2) {
                optsEl.querySelector(`[data-n="${prob.ans}"]`).classList.add("choice-hint");
                Feedback.show(optsEl, "Mira los bloques", `Hay ${parts.join(", ")}. Eso es ${prob.ans}.`);
              } else {
                Feedback.show(optsEl, "Casi", `Cuenta lo que hay en los bloques: ${parts.join(", ")}. ¿Qué número se forma?`);
              }
            }
          })
        );
      }

      // ---------- ronda ----------
      function nextItem() {
        clearHandles();
        if (idx >= ctx.total) return ctx.complete();
        const level = ctx.itemLevel();
        phase = "work";
        busy = false;
        helped = false;
        errs = 0;
        sel = { col: -1, set: new Set() };
        Feedback.hide(optsEl);
        optsEl.classList.add("hidden");
        optsEl.innerHTML = "";
        ncols = level >= 3 ? 3 : 2;
        const sub = level >= 2 && (ctx.isLast() ? false : Math.random() < 0.5);
        prob = sub ? makeSub(level) : makeSum(level);
        const da = digits(prob.a);
        const db = digits(prob.b);
        if (prob.op === "+") {
          cols = [0, 1, 2].map((c) => [...Array(da[c]).fill(0).map(() => ({ origin: "a" })), ...Array(db[c]).fill(0).map(() => ({ origin: "b" }))]);
          rem = [0, 0, 0];
          probEl.innerHTML = `<span>${prob.a}</span><span class="blk-op">+</span><span class="blk-b-num">${prob.b}</span>`;
          ctx.say(`Vamos a sumar ${prob.a} más ${prob.b}. Junté todos los bloques.`, () => {
            guide(true);
            armHint();
          });
        } else {
          cols = [0, 1, 2].map((c) => Array(da[c]).fill(0).map(() => ({ origin: "a" })));
          rem = [db[0], db[1], db[2]];
          probEl.innerHTML = `<span>${prob.a}</span><span class="blk-op">−</span><span class="blk-b-num">${prob.b}</span>`;
          ctx.say(`Vamos a restar ${prob.a} menos ${prob.b}. Tenemos ${prob.a} en bloques y hay que quitar ${prob.b}.`, () => {
            guide(true);
            armHint();
          });
        }
        render();
        guideEl.textContent = prob.op === "+" ? "Juntamos todos los bloques." : `Tenemos ${prob.a}. Vamos a quitar ${prob.b}.`;
        ctx.setInstruction("🧱", prob.op === "+" ? "Suma con bloques" : "Resta con bloques");
        ctx.onReplay(() => ctx.say(guideEl.textContent));
        // si por casualidad ya no hay nada que cambiar, pasa directo a la respuesta
        if (prob.op === "+" && lowestFull() < 0) toAnswer();
      }

      later(200, nextItem);
      return () => clearHandles();
    }
  });

  // =====================================================================
  // N4 · Saltos de rana
  // =====================================================================
  Aventura.register({
    id: "ranas",
    name: "Saltos de rana",
    emoji: "🐸",
    area: "numeros",
    codes: ["MA-2"],
    role: "interes",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 6,
    intro: {
      text: "La rana salta de 2 en 2, de 3 en 3… Cuenta los saltos y elige dónde cae. También contamos ranas en grupos.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">3</div><span class="av-demo-arrow">+3</span><div class="av-demo-card">6</div><span class="av-demo-arrow">+3</span><div class="av-demo-card">🐸</div></div>`
    },
    mount(stage, ctx) {
      const lite = ctx.mode === "lite";
      stage.innerHTML = `
        <div class="ran-wrap">
          <p class="ran-story" id="ran-story"></p>
          <div class="ran-pond" id="ran-pond"></div>
          <div class="ran-count hidden" id="ran-count"></div>
          <div class="ran-opts hidden" id="ran-opts"></div>
        </div>`;
      const storyEl = stage.querySelector("#ran-story");
      const pondEl = stage.querySelector("#ran-pond");
      const countEl = stage.querySelector("#ran-count");
      const optsEl = stage.querySelector("#ran-opts");
      let idx = 0;
      let errs = 0;
      let handles = [];

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };
      const clearHandles = () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
      };

      function tablesFor(level) {
        if (lite) return [2];
        if (level === 1) return [2, 3];
        return [2, 3, 4, 5, 10];
      }

      function options(ans, step, taken) {
        const cands = [ans + step, ans - step, ans + 1, ans - 1, ans + 2];
        const out = [ans];
        cands.forEach((c) => {
          if (out.length < 3 && c > 0 && !out.includes(c) && !taken.includes(c)) out.push(c);
        });
        let k = 3;
        while (out.length < 3) {
          if (!out.includes(ans + k)) out.push(ans + k);
          k++;
        }
        return U.shuffle(out);
      }

      function showOptions(ans, step, taken, hint1, hint2, onOk) {
        errs = 0;
        optsEl.classList.remove("hidden");
        Feedback.hide(optsEl);
        const opts = options(ans, step, taken);
        optsEl.innerHTML = opts.map((n) => `<button class="ran-opt" data-n="${n}">${n}</button>`).join("");
        optsEl.querySelectorAll(".ran-opt").forEach((b) =>
          b.addEventListener("click", () => {
            if (b.disabled) return;
            const n = Number(b.dataset.n);
            Speech.speak(String(n));
            if (n === ans) {
              optsEl.querySelectorAll(".ran-opt").forEach((x) => (x.disabled = true));
              b.classList.add("choice-correct");
              Feedback.hide(optsEl);
              GameAudio.playMatch();
              ctx.attempt({ ok: true, helped: errs >= 2 });
              onOk();
            } else {
              errs++;
              ctx.attempt({ ok: false });
              b.disabled = true;
              b.classList.add("choice-wrong");
              if (errs >= 2) {
                optsEl.querySelector(`[data-n="${ans}"]`).classList.add("choice-hint");
                Feedback.show(optsEl, "Mira el que brilla", hint2);
              } else {
                Feedback.show(optsEl, "Casi", hint1);
              }
            }
          })
        );
      }

      function finishItem(spoken) {
        idx++;
        ctx.progress(idx);
        const go = () => later(900, nextItem);
        if (spoken) ctx.say(spoken, go);
        else go();
      }

      // ---- tipo A: hojas con números y una escondida ----
      function pads(level) {
        const step = U.pick(tablesFor(level));
        const first = level >= 3 && !lite ? step * U.randInt(2, 5) : step;
        const n = 6;
        const seq = Array.from({ length: n }, (_, i) => first + i * step);
        const miss = U.randInt(2, n - 1);
        const ans = seq[miss];
        storyEl.textContent = `La rana salta de ${step} en ${step}. ¿En qué hoja cae?`;
        ctx.setInstruction("🐸", `Salta de ${step} en ${step}.`);
        ctx.onReplay(() => ctx.say(`La rana salta de ${step} en ${step}. ¿En qué hoja cae?`));
        ctx.say(`La rana salta de ${step} en ${step}. ¿En qué hoja cae?`);
        countEl.classList.add("hidden");
        pondEl.innerHTML = seq
          .map((v, i) => {
            const cls = i === miss ? "miss" : i < miss ? "past" : "";
            const frog = i === miss - 1 ? `<span class="ran-frog">🐸</span>` : "";
            return `<div class="ran-step"><div class="ran-pad ${cls}" data-i="${i}">${frog}<b>${i === miss ? "❓" : v}</b></div>${i < n - 1 ? `<span class="ran-jump">+${step}</span>` : ""}</div>`;
          })
          .join("");
        showOptions(
          ans,
          step,
          seq,
          `Cada salto suma ${step}. Mira la hoja donde está la rana: ${seq[miss - 1]}. ¿Cuánto es ${seq[miss - 1]} y ${step} más?`,
          `${seq[miss - 1]} más ${step} es ${ans}.`,
          () => {
            const pad = pondEl.querySelector(".ran-pad.miss");
            pad.classList.remove("miss");
            pad.classList.add("landed");
            pad.querySelector("b").textContent = ans;
            const f = pondEl.querySelector(".ran-frog");
            if (f) pad.prepend(f);
            finishItem(seq.slice(0, miss + 1).join(", "));
          }
        );
      }

      // ---- tipo B: grupos iguales de ranas ----
      function groups(level) {
        const step = lite ? U.pick([2, 3]) : U.pick(tablesFor(level));
        const g = lite ? U.randInt(2, 3) : level === 1 ? U.randInt(2, 4) : U.randInt(3, level === 3 ? 6 : 5);
        const per = Math.min(step, 5);
        const total = g * per;
        storyEl.textContent = `Hay ${g} charcos con ${per} ranas en cada uno. Toca cada charco para contar. ¿Cuántas ranas hay en total?`;
        ctx.setInstruction("🐸", "Toca cada charco y cuenta.");
        ctx.onReplay(() => ctx.say(`Hay ${g} charcos con ${per} ranas en cada uno. Toca cada charco para contar.`));
        ctx.say(`Hay ${g} charcos con ${per} ranas en cada uno. Toca cada charco para contar.`);
        let tapped = 0;
        optsEl.classList.add("hidden");
        countEl.classList.remove("hidden");
        countEl.textContent = "0";
        pondEl.innerHTML = Array.from({ length: g }, (_, i) => `<button class="ran-group" data-i="${i}"><span class="ran-frogs">${"🐸".repeat(per)}</span><span class="ran-water">💧</span></button>`).join("");
        pondEl.querySelectorAll(".ran-group").forEach((b) =>
          b.addEventListener("click", () => {
            if (b.classList.contains("counted")) return;
            b.classList.add("counted");
            tapped++;
            GameAudio.playClick();
            const running = tapped * per;
            countEl.textContent = String(running);
            Speech.speak(String(running));
            if (tapped === g) {
              later(900, () => {
                ctx.say("¿Cuántas ranas hay en total?");
                showOptions(
                  total,
                  per,
                  [],
                  `Cuenta de ${per} en ${per}: fuiste diciendo ${Array.from({ length: g }, (_, k) => (k + 1) * per).slice(0, 3).join(", ")}… ¿hasta dónde llegaste?`,
                  `Hay ${g} grupos de ${per}: ${Array.from({ length: g }, (_, k) => (k + 1) * per).join(", ")}. En total ${total}.`,
                  () => finishItem(`${g} grupos de ${per} son ${total} ranas.`)
                );
              });
            }
          })
        );
      }

      function nextItem() {
        clearHandles();
        if (idx >= ctx.total) return ctx.complete();
        const level = lite ? 1 : ctx.itemLevel();
        optsEl.innerHTML = "";
        optsEl.classList.add("hidden");
        Feedback.hide(optsEl);
        let type;
        if (level === 1) type = lite ? (idx % 2 ? "B" : "A") : idx % 3 === 2 ? "B" : "A";
        else type = Math.random() < 0.5 ? "A" : "B";
        if (ctx.isLast()) type = "A";
        if (type === "A") pads(level);
        else groups(level);
      }

      later(200, nextItem);
      return () => clearHandles();
    }
  });
})();
