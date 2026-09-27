// Aventuras · Letras y sonidos
//   trazo      — trazo guiado de letras y números (dirección, tamaño, orden)
//   discrimina — ¿cuál es la correcta? (letras giradas / en espejo)
//   silabas    — tren de sílabas (contar sílabas, sonido inicial y final)
//   construye  — dictado mágico con fichas de letras
// Nota sobre s/c: en el español de Ecuador suenan igual (ante e/i), por eso
// se trabajan como forma de la letra + palabra con imagen, no por el oído.
(() => {
  const U = Aventura.util;

  // =====================================================================
  // L1 · Trazo guiado
  // =====================================================================
  // Coordenadas en un cuadro de 0 a 100. Ángulos en grados con y hacia abajo:
  // al aumentar el ángulo se gira en sentido horario.
  function arcPts(cx, cy, rx, ry, a0, a1) {
    const pts = [];
    const steps = Math.max(8, Math.round(Math.abs(a1 - a0) / 10));
    for (let i = 0; i <= steps; i++) {
      const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return pts;
  }

  const GLYPHS = {
    s: { low: true, kind: "letra", label: "la s", say: "La s de sol", strokes: [[...arcPts(50, 53, 15, 8, -20, -270), ...arcPts(50, 69, 15, 8, -90, 160)]] },
    c: { low: true, kind: "letra", label: "la c", say: "La c de casa", strokes: [arcPts(52, 61, 19, 16, -42, -318)] },
    o: { low: true, kind: "letra", label: "la o", say: "La o de oso", strokes: [arcPts(50, 62, 18, 16, -90, -450)] },
    a: { low: true, kind: "letra", label: "la a", say: "La a de avión", strokes: [arcPts(47, 62, 15, 16, -30, -390), [[63, 47], [63, 78]]] },
    l: { kind: "letra", label: "la l", say: "La l de luna", strokes: [[[50, 20], [50, 80]]] },
    i: { low: true, kind: "letra", label: "la i", say: "La i de iglesia", strokes: [[[50, 46], [50, 80]], [[50, 34], [50, 35.5]]] },
    S: { kind: "letra", label: "la S mayúscula", say: "La S mayúscula", strokes: [[...arcPts(50, 35, 18, 15, -20, -270), ...arcPts(50, 65, 18, 15, -90, 160)]] },
    C: { kind: "letra", label: "la C mayúscula", say: "La C mayúscula", strokes: [arcPts(54, 50, 24, 30, -40, -320)] },
    O: { kind: "letra", label: "la O mayúscula", say: "La O mayúscula", strokes: [arcPts(50, 50, 24, 30, -90, -450)] },
    0: { kind: "número", label: "el 0", say: "El cero", strokes: [arcPts(50, 50, 20, 30, -90, -450)] },
    1: { kind: "número", label: "el 1", say: "El uno", strokes: [[[38, 32], [52, 20], [52, 80]]] },
    2: { kind: "número", label: "el 2", say: "El dos", strokes: [[...arcPts(50, 38, 19, 18, -165, 25), [30, 80], [72, 80]]] },
    3: { kind: "número", label: "el 3", say: "El tres", strokes: [[...arcPts(48, 36, 18, 16, -150, 90), ...arcPts(48, 66, 20, 16, -90, 150)]] },
    4: { kind: "número", label: "el 4", say: "El cuatro", strokes: [[[58, 20], [28, 60], [74, 60]], [[58, 20], [58, 80]]] },
    5: { kind: "número", label: "el 5", say: "El cinco", strokes: [[[36, 20], [36, 47], ...arcPts(50, 62, 22, 18, -130, 150)], [[36, 20], [70, 20]]] },
    6: { kind: "número", label: "el 6", say: "El seis", strokes: [[[62, 22], [46, 32], [34, 50], [30, 62], ...arcPts(50, 62, 20, 18, 180, -180)]] },
    7: { kind: "número", label: "el 7", say: "El siete", strokes: [[[30, 20], [70, 20]], [[70, 20], [44, 80]]] },
    8: { kind: "número", label: "el 8", say: "El ocho", strokes: [[...arcPts(50, 36, 16, 16, -90, -270), ...arcPts(50, 68, 20, 16, -90, 270), ...arcPts(50, 36, 16, 16, -270, -450)]] },
    9: { kind: "número", label: "el 9", say: "El nueve", strokes: [[...arcPts(50, 40, 20, 18, -45, -360), [69, 58], [62, 80]]] }
  };

  Aventura.defaults = Aventura.defaults || {};
  Aventura.defaults.glyphs = Object.keys(GLYPHS);

  function resample(pts, spacing) {
    const out = [pts[0]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      let [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      let seg = Math.hypot(x1 - x0, y1 - y0);
      while (carry + seg >= spacing) {
        const t = (spacing - carry) / seg;
        x0 += (x1 - x0) * t;
        y0 += (y1 - y0) * t;
        out.push([x0, y0]);
        seg = Math.hypot(x1 - x0, y1 - y0);
        carry = 0;
      }
      carry += seg;
    }
    const last = pts[pts.length - 1];
    const l = out[out.length - 1];
    if (Math.hypot(last[0] - l[0], last[1] - l[1]) > 0.2) out.push(last);
    // trazos de un solo punto (el punto de la i)
    if (out.length < 3) {
      const p = out[0];
      return [p, [p[0], p[1] + 0.8], [p[0], p[1] + 1.6]];
    }
    return out;
  }

  Aventura.register({
    id: "trazo",
    name: "Trazo guiado",
    emoji: "✏️",
    area: "letras",
    codes: ["LE-3", "MA-1"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 6,
    intro: {
      text: "Toca el punto verde y sigue la línea con tu dedo, en el sentido de las flechas.",
      demo: () => `<div class="av-demo-trace"><span class="av-demo-dot"></span><span class="av-demo-line">➜</span></div>`
    },
    mount(stage, ctx) {
      const S = ctx.settings;
      const isBig = ctx.ageGroup === "8";
      const priority = isBig ? ["s", "c", "5", "7", "9"] : ["1", "2", "3", "4", "5", "o", "l", "i"];
      const filler = isBig ? ["S", "C", "o", "a", "2", "3", "6", "8", "4"] : ["6", "7", "8", "9", "0", "a", "s", "c"];
      let pool = S.trazoChars && S.trazoChars.length ? S.trazoChars.filter((c) => GLYPHS[c]) : null;
      const picks = [];
      const base = pool || priority;
      for (let i = 0; i < ctx.total; i++) {
        const src = i < 4 || pool ? base : filler;
        let c;
        let guard = 0;
        do {
          c = U.pick(src);
          guard++;
        } while (picks[picks.length - 1] === c && guard < 8);
        picks.push(c);
      }

      stage.innerHTML = `
        <div class="tr-wrap">
          <canvas class="tr-canvas" id="tr-canvas" width="300" height="300"></canvas>
          <p class="sem-msg" id="tr-msg"></p>
        </div>`;
      const canvas = stage.querySelector("#tr-canvas");
      const msg = stage.querySelector("#tr-msg");
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 300 * dpr;
      canvas.height = 300 * dpr;
      const g = canvas.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const K = 3; // píxeles lógicos por unidad

      let idx = 0;
      let glyph = null;
      let strokes = [];
      let si = 0;
      let drawing = false;
      let locked = true;
      let helped = false;
      let wrongDir = 0;
      let backCount = 0;
      let offCount = 0;
      let samples = 0;
      let onPath = 0;
      let totalSamples = 0;
      let totalOn = 0;
      let totalWrongDir = 0;
      let showModel = false;
      let demoPos = -1;
      let last = null;

      const level = () => ctx.itemLevel();
      const tol = () => [9, 10.5, 13][level() - 1] || 10;

      function toUnits(e) {
        const r = canvas.getBoundingClientRect();
        return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
      }
      const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

      function loadGlyph() {
        const ch = picks[idx];
        glyph = GLYPHS[ch];
        strokes = glyph.strokes.map((s) => ({ pts: resample(s, 1.5), prog: 0, trail: [], done: false }));
        si = 0;
        drawing = false;
        helped = false;
        wrongDir = 0;
        backCount = 0;
        offCount = 0;
        samples = 0;
        onPath = 0;
        showModel = level() === 1;
        demoPos = -1;
        msg.textContent = "";
        ctx.setInstruction("✏️", `Traza ${glyph.label}. Empieza en el punto verde.`);
        ctx.onReplay(() => ctx.say(`Traza ${glyph.label}. Empieza en el punto verde y sigue la línea.`));
        render();
        // demostración antes de intentar (siempre en la primera, y si necesita ayuda)
        if (idx === 0) {
          ctx.later(500, () => playDemo());
        } else {
          locked = false;
          ctx.say(`Traza ${glyph.label}.`);
        }
      }

      function playDemo() {
        locked = true;
        const st = strokes[si];
        let i = 0;
        const step = () => {
          if (i >= st.pts.length) {
            demoPos = -1;
            locked = false;
            render();
            return;
          }
          demoPos = i;
          render();
          i += 2;
          ctx.later(28, step);
        };
        ctx.say(`Mira cómo se hace ${glyph.label}.`);
        step();
      }

      function render() {
        g.clearRect(0, 0, 300, 300);
        // fondo y renglones de colores (delimitan el tamaño)
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, 300, 300);
        g.fillStyle = "rgba(120,180,230,0.10)";
        g.fillRect(0, 20 * K, 300, 25 * K);
        g.fillStyle = "rgba(120,210,150,0.10)";
        g.fillRect(0, 45 * K, 300, 35 * K);
        const line = (y, color, dash) => {
          g.beginPath();
          g.setLineDash(dash || []);
          g.strokeStyle = color;
          g.lineWidth = 2;
          g.moveTo(8 * K, y * K);
          g.lineTo(92 * K, y * K);
          g.stroke();
          g.setLineDash([]);
        };
        line(20, "#7fb6e8");
        line(45, "#7fd0a0", [6, 6]);
        line(80, "#e88f8f");

        const cur = strokes[si];
        // modelo (línea punteada) y flechas
        strokes.forEach((s, k) => {
          // el modelo se ve en nivel 1 o cuando necesita ayuda; los trazos ya
          // hechos siempre quedan marcados
          if (!showModel && !s.done) return;
          g.beginPath();
          g.setLineDash([2, 9]);
          g.lineCap = "round";
          g.strokeStyle = s.done ? "rgba(90,170,120,0.55)" : "rgba(150,150,170,0.75)";
          g.lineWidth = 9;
          s.pts.forEach((p, i) => (i === 0 ? g.moveTo(p[0] * K, p[1] * K) : g.lineTo(p[0] * K, p[1] * K)));
          g.stroke();
          g.setLineDash([]);
          if (showModel && !s.done && s.pts.length > 12) {
            [0.3, 0.65].forEach((t) => {
              const i = Math.floor(s.pts.length * t);
              const a = s.pts[i];
              const b = s.pts[Math.min(s.pts.length - 1, i + 2)];
              const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
              g.save();
              g.translate(a[0] * K, a[1] * K);
              g.rotate(ang);
              g.fillStyle = "rgba(90,110,160,0.85)";
              g.beginPath();
              g.moveTo(7, 0);
              g.lineTo(-4, -6);
              g.lineTo(-4, 6);
              g.closePath();
              g.fill();
              g.restore();
            });
          }
          if (showModel && strokes.length > 1 && !s.done) {
            const p = s.pts[0];
            g.fillStyle = "#6b7fb0";
            g.font = "bold 13px Trebuchet MS, sans-serif";
            g.fillText(String(k + 1), p[0] * K - 16, p[1] * K - 8);
          }
        });
        // trazo del niño
        strokes.forEach((s) => {
          if (s.trail.length < 2) return;
          g.beginPath();
          g.lineCap = "round";
          g.lineJoin = "round";
          g.strokeStyle = s.done ? "#4aa87a" : "#4a8fd9";
          g.lineWidth = 8;
          s.trail.forEach((p, i) => (i === 0 ? g.moveTo(p[0] * K, p[1] * K) : g.lineTo(p[0] * K, p[1] * K)));
          g.stroke();
        });
        // punto de inicio del trazo actual (verde) + flecha corta en niveles 2 y 3
        if (cur && !cur.done) {
          const p = cur.pts[Math.min(cur.prog, cur.pts.length - 1)];
          g.beginPath();
          g.fillStyle = "#3fb56a";
          g.arc(p[0] * K, p[1] * K, 11, 0, Math.PI * 2);
          g.fill();
          g.beginPath();
          g.strokeStyle = "rgba(63,181,106,0.4)";
          g.lineWidth = 5;
          g.arc(p[0] * K, p[1] * K, 17, 0, Math.PI * 2);
          g.stroke();
          if (cur.prog === 0 && !showModel && cur.pts.length > 6) {
            const b = cur.pts[5];
            const ang = Math.atan2(b[1] - p[1], b[0] - p[0]);
            g.save();
            g.translate(p[0] * K + Math.cos(ang) * 26, p[1] * K + Math.sin(ang) * 26);
            g.rotate(ang);
            g.fillStyle = "#3fb56a";
            g.beginPath();
            g.moveTo(8, 0);
            g.lineTo(-5, -7);
            g.lineTo(-5, 7);
            g.closePath();
            g.fill();
            g.restore();
          }
        }
        // marcador de la demostración
        if (demoPos >= 0 && strokes[si]) {
          const p = strokes[si].pts[Math.min(demoPos, strokes[si].pts.length - 1)];
          g.beginPath();
          g.fillStyle = "#f2a13b";
          g.arc(p[0] * K, p[1] * K, 10, 0, Math.PI * 2);
          g.fill();
        }
      }

      function hint(text) {
        msg.textContent = text;
      }

      function advanceAt(pt) {
        const cur = strokes[si];
        totalSamples++;
        samples++;
        const t = tol();
        let best = -1;
        let bd = 1e9;
        const lim = Math.min(cur.pts.length - 1, cur.prog + 16);
        for (let j = cur.prog; j <= lim; j++) {
          const d = dist(pt, cur.pts[j]);
          if (d < bd) {
            bd = d;
            best = j;
          }
        }
        if (bd <= t) {
          onPath++;
          totalOn++;
          offCount = 0;
          if (best > cur.prog) cur.prog = best;
        } else {
          offCount++;
          // retrocede sobre el trazo (va al revés)
          let nb = 1e9;
          let ni = -1;
          for (let j = 0; j < cur.pts.length; j++) {
            const d = dist(pt, cur.pts[j]);
            if (d < nb) {
              nb = d;
              ni = j;
            }
          }
          if (nb <= t && ni + 8 < cur.prog) backCount++;
          if (offCount === 14) {
            helped = true;
            showModel = true;
            hint("Sigue la línea con calma 🙂");
          }
        }
      }

      function onDown(e) {
        if (locked) return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        const p = toUnits(e);
        const cur = strokes[si];
        const target = cur.pts[Math.min(cur.prog, cur.pts.length - 1)];
        const startTol = tol() + 5;
        if (dist(p, target) > startTol) {
          if (cur.prog === 0 && dist(p, cur.pts[cur.pts.length - 1]) <= startTol) {
            wrongDir++;
            totalWrongDir++;
            helped = true;
            hint("Empieza en el punto verde 👉 y ve en el sentido de la flecha");
            showModel = true;
            render();
          } else {
            hint("Toca el punto verde para empezar 🙂");
          }
          return;
        }
        drawing = true;
        last = p;
        if (cur.prog === 0) cur.trail = [p];
        else cur.trail.push(p);
        msg.textContent = "";
        render();
      }

      function onMove(e) {
        if (!drawing || locked) return;
        e.preventDefault();
        const p = toUnits(e);
        const cur = strokes[si];
        // interpolar para no perder tramos cuando el dedo va rápido
        const d = dist(last, p);
        const n = Math.max(1, Math.ceil(d / 3));
        for (let i = 1; i <= n; i++) {
          const q = [last[0] + ((p[0] - last[0]) * i) / n, last[1] + ((p[1] - last[1]) * i) / n];
          advanceAt(q);
        }
        cur.trail.push(p);
        last = p;
        if (backCount >= 6) {
          backCount = 0;
          wrongDir++;
          totalWrongDir++;
          helped = true;
          hint("Ve hacia donde apunta la flecha 👉");
          showModel = true;
        }
        render();
        if (cur.prog >= cur.pts.length - 3) endStroke();
      }

      function onUp() {
        drawing = false;
      }

      function endStroke() {
        drawing = false;
        const cur = strokes[si];
        cur.done = true;
        cur.prog = cur.pts.length - 1;
        GameAudio.playClick();
        if (si < strokes.length - 1) {
          si++;
          hint("¡Muy bien! Ahora sigue con el otro trazo.");
          render();
        } else {
          glyphDone();
        }
      }

      function glyphDone() {
        locked = true;
        render();
        GameAudio.playMatch();
        ctx.attempt({ ok: true, helped });
        msg.textContent = `¡Muy bien! ${glyph.say} ✨`;
        ctx.say(glyph.say);
        idx++;
        ctx.progress(idx);
        ctx.later(1700, () => {
          if (idx >= ctx.total) {
            const prec = totalSamples ? Math.round((totalOn / totalSamples) * 100) : null;
            return ctx.complete({ precision: prec, direccionIncorrecta: totalWrongDir });
          }
          loadGlyph();
        });
      }

      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      ctx.later(200, loadGlyph);
      return () => {};
    }
  });

  // =====================================================================
  // L2 · ¿Cuál es la correcta? (discriminación visual)
  // =====================================================================
  const WORDS3 = [
    { w: "casa", e: "🏠", i: 0 },
    { w: "sol", e: "☀️", i: 0 },
    { w: "silla", e: "🪑", i: 0 },
    { w: "sapo", e: "🐸", i: 0 },
    { w: "cama", e: "🛏️", i: 0 },
    { w: "seis", e: "6️⃣", i: 0 },
    { w: "mesa", e: "🍽️", i: 3 },
    { w: "cinco", e: "5️⃣", i: 0 },
    { w: "cine", e: "🎬", i: 0 },
    { w: "cielo", e: "☁️", i: 0 }
  ];
  const DIS_POOL = ["s", "c", "b", "d", "p", "q", "5", "7", "9", "2", "3"];
  const NO_ROT = ["s", "S", "z"]; // girada 180° se ve igual: no sirve de distractor
  const TRANSFORMS = {
    normal: "none",
    espejo: "scaleX(-1)",
    reves: "scaleY(-1)",
    girada: "rotate(180deg)"
  };

  Aventura.register({
    id: "discrimina",
    name: "¿Cuál es la correcta?",
    emoji: "🔍",
    area: "letras",
    codes: ["LE-2", "LE-3"],
    role: "reto",
    modes: ["full"],
    maxLevel: 3,
    items: () => 8,
    intro: {
      text: "Mira la letra de arriba y busca la que es exactamente igual. ¡Fíjate hacia dónde mira!"
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="dis-wrap">
          <div class="dis-target" id="dis-target"></div>
          <div class="dis-options" id="dis-options"></div>
        </div>`;
      const targetEl = stage.querySelector("#dis-target");
      const optsEl = stage.querySelector("#dis-options");
      let idx = 0;
      let errs = 0;
      let cur = null;

      const glyph = (ch, tf) => `<span class="dis-glyph" style="transform:${TRANSFORMS[tf] || "none"}">${ch}</span>`;

      function nextItem() {
        if (idx >= ctx.total) return ctx.complete();
        errs = 0;
        Feedback.hide(optsEl);
        const level = ctx.itemLevel();
        optsEl.className = "dis-options";
        if (level >= 3) {
          const item = U.pick(WORDS3);
          const chars = item.w.split("");
          const firstConf = chars.findIndex((c) => c === "s" || c === "c");
          const mirrored = chars.map((c, k) => (k === firstConf ? `<span class="dis-glyph" style="transform:scaleX(-1)">${c}</span>` : c)).join("");
          const swapped = chars.map((c, k) => (k === firstConf ? (c === "s" ? "c" : "s") : c)).join("");
          const opts = U.shuffle([
            { html: item.w, ok: true },
            { html: mirrored, ok: false },
            { html: swapped, ok: false }
          ]);
          cur = { ok: item.w, word: true };
          targetEl.innerHTML = `<span class="dis-emoji">${item.e}</span>`;
          ctx.setInstruction("🔍", "¿Cuál está bien escrita?");
          ctx.onReplay(() => ctx.say(`¿Cuál está bien escrita? ${item.w}`));
          ctx.say(`¿Cuál dice ${item.w}?`);
          optsEl.classList.add("dis-words");
          optsEl.innerHTML = opts.map((o, i) => `<button class="dis-opt dis-opt-word ${o.ok ? "is-ok" : ""}" data-ok="${o.ok ? 1 : 0}"><span class="dis-word">${o.html}</span></button>`).join("");
        } else {
          const ch = U.pick(DIS_POOL);
          const variants = ["espejo", "reves", "girada"].filter((v) => !(v === "girada" && NO_ROT.includes(ch)));
          const wrong = level === 1 ? [U.pick(["espejo", "reves"])] : variants.slice(0, 3);
          const opts = U.shuffle([{ tf: "normal", ok: true }, ...wrong.map((tf) => ({ tf, ok: false }))]);
          cur = { ok: ch, word: false };
          targetEl.innerHTML = `<span class="dis-big">${glyph(ch, "normal")}</span>`;
          ctx.setInstruction("🔍", "Busca la que es igual a la de arriba.");
          ctx.onReplay(() => ctx.say("Busca la que es exactamente igual a la de arriba. Fíjate hacia dónde mira."));
          optsEl.innerHTML = opts.map((o) => `<button class="dis-opt ${o.ok ? "is-ok" : ""}" data-ok="${o.ok ? 1 : 0}">${glyph(ch, o.tf)}</button>`).join("");
        }
        optsEl.querySelectorAll(".dis-opt").forEach((b) => b.addEventListener("click", () => choose(b)));
      }

      function choose(b) {
        if (b.disabled) return;
        if (b.dataset.ok === "1") {
          optsEl.querySelectorAll(".dis-opt").forEach((x) => (x.disabled = true));
          b.classList.add("choice-correct");
          Feedback.hide(optsEl);
          GameAudio.playMatch();
          ctx.attempt({ ok: true, helped: errs >= 2 });
          idx++;
          ctx.progress(idx);
          ctx.later(900, nextItem);
        } else {
          errs++;
          ctx.attempt({ ok: false });
          b.disabled = true;
          b.classList.add("choice-wrong");
          if (errs >= 2) {
            optsEl.querySelector(".is-ok").classList.add("choice-hint");
            Feedback.show(optsEl, "¡Casi!", "Mira la que brilla: es igual a la de arriba.");
          } else {
            Feedback.show(optsEl, "¡Casi!", "Mira otra vez con calma. Fíjate hacia dónde mira.");
          }
        }
      }

      ctx.later(200, nextItem);
      return () => {};
    }
  });

  // =====================================================================
  // L3 · Tren de sílabas
  // =====================================================================
  const SIL_WORDS = [
    { w: "casa", s: ["ca", "sa"], e: "🏠" }, { w: "sopa", s: ["so", "pa"], e: "🍲" },
    { w: "mesa", s: ["me", "sa"], e: "🍽️" }, { w: "sapo", s: ["sa", "po"], e: "🐸" },
    { w: "cama", s: ["ca", "ma"], e: "🛏️" }, { w: "luna", s: ["lu", "na"], e: "🌙" },
    { w: "pato", s: ["pa", "to"], e: "🦆" }, { w: "gato", s: ["ga", "to"], e: "🐱" },
    { w: "cine", s: ["ci", "ne"], e: "🎬" }, { w: "silla", s: ["si", "lla"], e: "🪑" },
    { w: "camisa", s: ["ca", "mi", "sa"], e: "👕" }, { w: "zapato", s: ["za", "pa", "to"], e: "👟" },
    { w: "tortuga", s: ["tor", "tu", "ga"], e: "🐢" }, { w: "manzana", s: ["man", "za", "na"], e: "🍎" },
    { w: "pelota", s: ["pe", "lo", "ta"], e: "⚽" }, { w: "conejo", s: ["co", "ne", "jo"], e: "🐰" },
    { w: "canasta", s: ["ca", "nas", "ta"], e: "🧺" }, { w: "elefante", s: ["e", "le", "fan", "te"], e: "🐘" },
    { w: "mariposa", s: ["ma", "ri", "po", "sa"], e: "🦋" }, { w: "zanahoria", s: ["za", "na", "ho", "ria"], e: "🥕" }
  ];
  const ALL_SYL = [...new Set(SIL_WORDS.flatMap((x) => x.s))];

  Aventura.register({
    id: "silabas",
    name: "Tren de sílabas",
    emoji: "🚂",
    area: "letras",
    codes: ["LE-5"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 5,
    intro: {
      text: "Escucha la palabra. Aplaude una vez por cada parte y se agrega un vagón al tren.",
      demo: () => `<div class="av-demo-row"><span class="av-demo-arrow">🚂</span><div class="av-demo-card">ca</div><div class="av-demo-card">sa</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="sil-wrap">
          <div class="sil-picture" id="sil-picture"></div>
          <div class="sil-track"><span class="sil-loco">🚂</span><span class="sil-wagons" id="sil-wagons"></span></div>
          <div class="sil-controls" id="sil-controls">
            <button class="av-btn av-btn-primary" id="sil-clap">👏 Una parte</button>
            <button class="av-btn av-btn-soft" id="sil-undo" title="Quitar">↩</button>
            <button class="av-btn av-btn-soft" id="sil-done">✔ Listo</button>
          </div>
          <div class="sil-options hidden" id="sil-options"></div>
        </div>`;
      const pic = stage.querySelector("#sil-picture");
      const wagonsEl = stage.querySelector("#sil-wagons");
      const controls = stage.querySelector("#sil-controls");
      const optsEl = stage.querySelector("#sil-options");
      let idx = 0;
      let item = null;
      let count = 0;
      let errs = 0;
      let phase = "count";
      let helped = false;

      const say = (t) => ctx.say(t);

      // dice las sílabas una por una, iluminando cada vagón
      function sayWordSlow(cb, showText) {
        const parts = item.s;
        let i = 0;
        const next = () => {
          if (i >= parts.length) return cb && cb();
          const w = wagonsEl.children[i];
          if (w && showText) w.classList.add("lit");
          ctx.say(parts[i], () => {
            i++;
            ctx.later(250, next);
          });
        };
        next();
      }

      function pool(level) {
        const max = level === 1 ? 2 : level === 2 ? 3 : 4;
        return SIL_WORDS.filter((x) => x.s.length <= max && (level === 1 ? x.s.length === 2 : true));
      }

      function nextItem() {
        if (idx >= ctx.total) return ctx.complete();
        const level = ctx.itemLevel();
        item = U.pick(pool(level));
        count = 0;
        errs = 0;
        helped = false;
        phase = "count";
        wagonsEl.innerHTML = "";
        controls.classList.remove("hidden");
        optsEl.classList.add("hidden");
        Feedback.hide(optsEl);
        pic.textContent = item.e;
        ctx.setInstruction("🚂", "Escucha y aplaude una vez por cada parte.");
        ctx.onReplay(() => (phase === "count" ? say(item.w) : ctx.say(item.w)));
        ctx.later(300, () => say(item.w));
      }

      function addWagon() {
        if (phase !== "count") return;
        count++;
        const w = document.createElement("span");
        w.className = "sil-wagon";
        w.textContent = "🚃";
        wagonsEl.appendChild(w);
        GameAudio.playClick();
      }

      stage.querySelector("#sil-clap").addEventListener("click", addWagon);
      stage.querySelector("#sil-undo").addEventListener("click", () => {
        if (phase !== "count" || count === 0) return;
        count--;
        wagonsEl.lastChild && wagonsEl.lastChild.remove();
      });
      stage.querySelector("#sil-done").addEventListener("click", () => {
        if (phase !== "count") return;
        if (count === item.s.length) {
          ctx.attempt({ ok: true, helped });
          // muestra las sílabas en los vagones
          [...wagonsEl.children].forEach((w, i) => (w.innerHTML = `🚃<span class="sil-syl">${item.s[i]}</span>`));
          controls.classList.add("hidden");
          GameAudio.playMatch();
          sayWordSlow(() => afterCount(), true);
        } else {
          errs++;
          ctx.attempt({ ok: false });
          if (errs >= 2) {
            // ayuda directa: se arma el tren correcto y se dice despacio
            helped = true;
            wagonsEl.innerHTML = "";
            for (let i = 0; i < item.s.length; i++) {
              const w = document.createElement("span");
              w.className = "sil-wagon";
              w.textContent = "🚃";
              wagonsEl.appendChild(w);
            }
            count = item.s.length;
            Feedback.show(optsEl, "¡Casi!", `Mira: son ${item.s.length} partes. Escucha con calma.`);
            sayWordSlow(null, false);
          } else {
            wagonsEl.innerHTML = "";
            count = 0;
            Feedback.show(optsEl, "¡Casi!", "Escucha otra vez y aplaude cada parte.");
            ctx.later(1800, () => say(item.w));
          }
        }
      });

      function afterCount() {
        const level = ctx.itemLevel();
        if (level >= 2) askSound("inicio");
        else finishItem();
      }

      function askSound(kind) {
        phase = kind;
        Feedback.hide(optsEl);
        const correct = kind === "inicio" ? item.s[0] : item.s[item.s.length - 1];
        const others = U.shuffle(ALL_SYL.filter((s) => s !== correct)).slice(0, 2);
        const opts = U.shuffle([correct, ...others]);
        optsEl.classList.remove("hidden");
        optsEl.innerHTML = opts.map((o) => `<button class="av-btn av-btn-soft sil-opt" data-s="${o}">${o}</button>`).join("");
        const q = kind === "inicio" ? "¿Con qué sonido empieza?" : "¿Con qué sonido termina?";
        ctx.setInstruction("👂", q);
        ctx.onReplay(() => ctx.say(`${q} ${item.w}`));
        ctx.say(`${q} ${item.w}`);
        let e2 = 0;
        optsEl.querySelectorAll(".sil-opt").forEach((b) =>
          b.addEventListener("click", () => {
            if (b.disabled) return;
            Speech.speak(b.dataset.s);
            if (b.dataset.s === correct) {
              optsEl.querySelectorAll(".sil-opt").forEach((x) => (x.disabled = true));
              b.classList.add("choice-correct");
              Feedback.hide(optsEl);
              GameAudio.playMatch();
              ctx.attempt({ ok: true, helped: e2 >= 2 });
              const level = ctx.itemLevel();
              ctx.later(1000, () => (kind === "inicio" && level >= 3 ? askSound("final") : finishItem()));
            } else {
              e2++;
              ctx.attempt({ ok: false });
              b.disabled = true;
              b.classList.add("choice-wrong");
              Feedback.show(optsEl, "¡Casi!", e2 >= 2 ? "Mira la que brilla." : `Escucha otra vez: ${item.w}.`);
              if (e2 >= 2) optsEl.querySelectorAll(".sil-opt").forEach((x) => x.dataset.s === correct && x.classList.add("choice-hint"));
            }
          })
        );
      }

      function finishItem() {
        idx++;
        ctx.progress(idx);
        ctx.later(600, nextItem);
      }

      ctx.later(200, nextItem);
      return () => {};
    }
  });

  // =====================================================================
  // L4 · Construye la palabra (dictado mágico)
  // =====================================================================
  const CON_SYL = ["sa", "se", "si", "so", "su", "ca", "co", "cu", "ce", "ci", "ma", "me", "mi", "pa", "pe", "la", "lo"];
  const CON_WORDS2 = [
    { w: "sopa", e: "🍲" }, { w: "sapo", e: "🐸" }, { w: "casa", e: "🏠" }, { w: "mesa", e: "🍽️" },
    { w: "cama", e: "🛏️" }, { w: "cine", e: "🎬" }, { w: "luna", e: "🌙" }, { w: "pato", e: "🦆" },
    { w: "silla", e: "🪑" }, { w: "cero", e: "0️⃣" }
  ];
  const CON_WORDS3 = [
    { w: "camisa", e: "👕" }, { w: "zapato", e: "👟" }, { w: "tortuga", e: "🐢" }, { w: "manzana", e: "🍎" },
    { w: "pelota", e: "⚽" }, { w: "conejo", e: "🐰" }, { w: "canasta", e: "🧺" }
  ];
  const CON_PHRASES = ["mi casa", "el sol", "la luna", "un gato", "mi mesa", "la sopa", "el sapo", "mi silla"];
  const CONFUSABLE = { s: "c", c: "s" };

  Aventura.register({
    id: "construye",
    name: "Construye la palabra",
    emoji: "🔤",
    area: "letras",
    codes: ["LE-1", "LE-4"],
    role: "reto",
    modes: ["full"],
    maxLevel: 4,
    items: () => 6,
    intro: {
      text: "Escucha la palabra y arma con las fichas de letras. Puedes escucharla otra vez cuando quieras.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">c</div><div class="av-demo-card">a</div><div class="av-demo-card">s</div><div class="av-demo-card">a</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="con-wrap">
          <div class="con-picture" id="con-picture"></div>
          <div class="con-slots" id="con-slots"></div>
          <div class="con-tiles" id="con-tiles"></div>
        </div>`;
      const picEl = stage.querySelector("#con-picture");
      const slotsEl = stage.querySelector("#con-slots");
      const tilesEl = stage.querySelector("#con-tiles");
      let idx = 0;
      let target = "";
      let letters = [];
      let slots = [];
      let errs = 0;
      let waiting = false;

      function pickTarget(level) {
        const custom = (ctx.settings.words || []).map((w) => String(w).trim().toLowerCase()).filter(Boolean);
        if (level === 1) return { text: U.pick(CON_SYL), emoji: "" };
        if (level === 2) {
          const c = custom.length && Math.random() < 0.3 ? { w: U.pick(custom), e: "" } : U.pick(CON_WORDS2);
          return { text: c.w, emoji: c.e };
        }
        if (level === 3) {
          const c = custom.length && Math.random() < 0.3 ? { w: U.pick(custom), e: "" } : U.pick(CON_WORDS3);
          return { text: c.w, emoji: c.e };
        }
        return { text: custom.length && Math.random() < 0.4 ? U.pick(custom) : U.pick(CON_PHRASES), emoji: "" };
      }

      function nextItem() {
        waiting = false;
        if (idx >= ctx.total) return ctx.complete();
        errs = 0;
        const level = ctx.itemLevel();
        const t = pickTarget(level);
        target = t.text.toLowerCase();
        picEl.textContent = t.emoji || "🔊";
        ctx.setInstruction("🔤", "Escucha y arma la palabra con las letras.");
        ctx.onReplay(() => ctx.say(target));
        // casillas: un espacio visual entre palabras
        letters = target.split("");
        slots = [];
        slotsEl.innerHTML = "";
        letters.forEach((ch, i) => {
          if (ch === " ") {
            const gap = document.createElement("span");
            gap.className = "con-gap";
            slotsEl.appendChild(gap);
            return;
          }
          const s = document.createElement("div");
          s.className = "con-slot";
          s.dataset.drop = "slot";
          s.dataset.i = String(i);
          s.dataset.expected = ch;
          slotsEl.appendChild(s);
          slots.push(s);
        });
        // fichas: las letras + distractores (más en los niveles altos, incluida la s/c)
        const chars = letters.filter((c) => c !== " ");
        const extra = level >= 4 ? 2 : level >= 3 ? 1 : 0;
        const pool = "aeiolmnprstucd".split("").filter((c) => !chars.includes(c));
        const distract = [];
        for (let i = 0; i < extra; i++) {
          let c = chars.find((x) => CONFUSABLE[x] && !chars.includes(CONFUSABLE[x]) && !distract.includes(CONFUSABLE[x]));
          c = c ? CONFUSABLE[c] : U.pick(pool);
          distract.push(c);
        }
        tilesEl.innerHTML = "";
        U.shuffle([...chars, ...distract]).forEach((ch) => {
          const b = document.createElement("button");
          b.className = "con-tile";
          b.textContent = ch;
          b.dataset.ch = ch;
          ctx.draggable(b, {
            onDrop: (zone) => zone && zone.dataset.drop === "slot" && place(b, zone),
            onTap: () => {
              const empty = slots.find((s) => !s.dataset.filled);
              if (empty) place(b, empty);
            }
          });
          tilesEl.appendChild(b);
        });
        ctx.later(300, () => ctx.say(target));
      }

      function clearGlow() {
        slots.forEach((s) => s.classList.remove("con-slot-glow"));
        tilesEl.querySelectorAll(".con-tile").forEach((t) => t.classList.remove("con-tile-glow"));
      }

      function place(tile, slot) {
        if (waiting || tile.dataset.used === "1") return;
        clearGlow();
        if (slot.dataset.filled === "1") {
          tile.classList.add("con-bounce");
          ctx.later(450, () => tile.classList.remove("con-bounce"));
          return;
        }
        if (tile.dataset.ch === slot.dataset.expected) {
          slot.dataset.filled = "1";
          slot.textContent = tile.dataset.ch;
          slot.classList.add("con-slot-ok");
          tile.dataset.used = "1";
          tile.classList.add("con-tile-used");
          GameAudio.playClick();
          if (slots.every((s) => s.dataset.filled === "1")) done();
        } else {
          // rebota suave y se resalta la casilla que esperaba otra letra
          errs++;
          ctx.attempt({ ok: false });
          tile.classList.add("con-bounce");
          ctx.later(450, () => tile.classList.remove("con-bounce"));
          slot.classList.add("con-slot-glow");
          ctx.toast("¡Casi! Ahí va otra letra. Escucha otra vez 🙂", 2200);
          if (errs >= 2) {
            const next = slots.find((s) => !s.dataset.filled);
            const good = [...tilesEl.querySelectorAll(".con-tile")].find((t) => t.dataset.used !== "1" && t.dataset.ch === next.dataset.expected);
            if (good) good.classList.add("con-tile-glow");
            next.classList.add("con-slot-glow");
          }
        }
      }

      function done() {
        waiting = true;
        GameAudio.playMatch();
        ctx.attempt({ ok: true, helped: errs >= 2 });
        ctx.toast(`¡Lo escribiste! ✨ ${target}`, 2500);
        ctx.say(target);
        idx++;
        ctx.progress(idx);
        ctx.later(1600, nextItem);
      }

      ctx.later(200, nextItem);
      return () => {};
    }
  });
})();
