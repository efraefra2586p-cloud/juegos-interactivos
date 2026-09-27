// Aventuras · Números e Inglés (actividades de "interés")
//   tiendita   — problemas de la vida diaria con dólares (pagar y dar vuelto)
//   av-ingles  — reutiliza el juego de Inglés (números, colores y animales)
//   av-sumas   — reutiliza Sumas y Restas
// Los dos últimos NO son juegos nuevos: montan los ya existentes dentro de
// la pantalla estándar de Aventuras para no repetir contenido.
(() => {
  const U = Aventura.util;

  const fmt = (c) => `$${(c / 100).toFixed(c % 100 === 0 ? 0 : 2)}`;

  // =====================================================================
  // N2 · La tiendita
  // =====================================================================
  const SHOP_ITEMS = [
    { emoji: "🧃", name: "un jugo" },
    { emoji: "🍞", name: "un pan" },
    { emoji: "⚽", name: "una pelota" },
    { emoji: "📓", name: "un cuaderno" },
    { emoji: "🍬", name: "un caramelo" },
    { emoji: "🍦", name: "un helado" },
    { emoji: "🖍️", name: "unos crayones" },
    { emoji: "🧸", name: "un peluche" }
  ];
  const COINS = {
    50: { label: "50¢", face: "🪙", cls: "coin-50" },
    100: { label: "$1", face: "🪙", cls: "coin-100" },
    500: { label: "$5", face: "💵", cls: "coin-500" },
    1000: { label: "$10", face: "💵", cls: "coin-1000" }
  };

  Aventura.register({
    id: "tiendita",
    name: "La tiendita",
    emoji: "🛒",
    area: "numeros",
    codes: ["MA-2"],
    role: "interes",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: () => 5,
    intro: {
      text: "Vamos a comprar. Arrastra las monedas para pagar o para calcular cuánto te queda.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">🧃<br><small>$2</small></div><span class="av-demo-arrow">➜</span><div class="av-demo-card">🪙🪙</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="tie-wrap">
          <div class="tie-shop"><span class="tie-item" id="tie-item"></span><div class="tie-info" id="tie-info"></div></div>
          <p class="tie-question" id="tie-q"></p>
          <div class="tie-tray" data-drop="tray" id="tie-tray"></div>
          <div class="tie-total" id="tie-total">$0</div>
          <div class="tie-purse" id="tie-purse"></div>
          <button class="av-btn av-btn-primary" id="tie-ok">✔ Listo</button>
        </div>`;
      const itemEl = stage.querySelector("#tie-item");
      const infoEl = stage.querySelector("#tie-info");
      const qEl = stage.querySelector("#tie-q");
      const trayEl = stage.querySelector("#tie-tray");
      const totalEl = stage.querySelector("#tie-total");
      const purseEl = stage.querySelector("#tie-purse");
      let idx = 0;
      let need = 0;
      let denoms = [100];
      let tray = [];
      let errs = 0;
      let busy = false;

      const sum = () => tray.reduce((a, b) => a + b, 0);

      function makeQuestion() {
        const level = ctx.itemLevel();
        const it = U.pick(SHOP_ITEMS);
        let price;
        let mode = "pay";
        let start = 0;
        if (level === 1) {
          price = U.randInt(1, 5) * 100;
          denoms = [100];
        } else if (level === 2) {
          price = U.randInt(1, 9) * 100;
          denoms = [100, 500];
        } else {
          denoms = [50, 100, 500];
          price = U.randInt(2, 9) * 100 + (Math.random() < 0.4 ? 50 : 0);
          mode = Math.random() < 0.55 ? "change" : "pay";
        }
        if (mode === "change") {
          start = price <= 500 ? 500 : 1000;
          need = start - price;
        } else need = price;
        return { it, price, mode, start };
      }

      function suggest() {
        // monedas que sirven para llegar a "need" (para la ayuda)
        const out = [];
        let left = need;
        [...denoms].sort((a, b) => b - a).forEach((d) => {
          while (left >= d) {
            out.push(d);
            left -= d;
          }
        });
        return [...new Set(out)];
      }

      function renderTray() {
        trayEl.innerHTML = tray
          .map((v, i) => `<button class="tie-coin ${COINS[v].cls}" data-i="${i}">${COINS[v].face}<span>${COINS[v].label}</span></button>`)
          .join("");
        trayEl.querySelectorAll(".tie-coin").forEach((b) =>
          b.addEventListener("click", () => {
            if (busy) return;
            tray.splice(Number(b.dataset.i), 1);
            renderTray();
          })
        );
        totalEl.textContent = fmt(sum());
      }

      function addCoin(v) {
        if (busy) return;
        tray.push(v);
        GameAudio.playClick();
        purseEl.querySelectorAll(".tie-coin").forEach((c) => c.classList.remove("tie-coin-glow"));
        renderTray();
      }

      function nextItem() {
        busy = false;
        if (idx >= ctx.total) return ctx.complete();
        errs = 0;
        tray = [];
        Feedback.hide(trayEl);
        const q = makeQuestion();
        itemEl.textContent = q.it.emoji;
        if (q.mode === "pay") {
          infoEl.innerHTML = `<span class="tie-price">Cuesta ${fmt(q.price)}</span>`;
          qEl.textContent = `Compras ${q.it.name}. ¿Con cuánto pagas?`;
          ctx.setInstruction("🛒", `Paga ${fmt(q.price)} con las monedas.`);
          ctx.onReplay(() => ctx.say(`Compras ${q.it.name}. Cuesta ${fmt(q.price).replace("$", "")} dólares. Paga con las monedas.`));
        } else {
          infoEl.innerHTML = `<span class="tie-price">Tienes ${fmt(q.start)}</span><span class="tie-price">Cuesta ${fmt(q.price)}</span>`;
          qEl.textContent = `Compras ${q.it.name}. ¿Cuánto te queda?`;
          ctx.setInstruction("🛒", `Tienes ${fmt(q.start)} y cuesta ${fmt(q.price)}. ¿Cuánto te queda?`);
          ctx.onReplay(() => ctx.say(`Tienes ${fmt(q.start).replace("$", "")} dólares. ${q.it.name} cuesta ${fmt(q.price).replace("$", "")} dólares. ¿Cuánto te queda? Arma tu vuelto con las monedas.`));
        }
        purseEl.innerHTML = denoms.map((d) => `<button class="tie-coin ${COINS[d].cls}" data-v="${d}">${COINS[d].face}<span>${COINS[d].label}</span></button>`).join("");
        purseEl.querySelectorAll(".tie-coin").forEach((b) => {
          const v = Number(b.dataset.v);
          ctx.draggable(b, { onDrop: (zone) => zone && zone.dataset.drop === "tray" && addCoin(v), onTap: () => addCoin(v) });
        });
        renderTray();
        ctx.onReplay(() => ctx.say(qEl.textContent));
        ctx.say(qEl.textContent);
      }

      stage.querySelector("#tie-ok").addEventListener("click", () => {
        if (busy) return;
        const total = sum();
        if (total === need) {
          busy = true;
          GameAudio.playMatch();
          ctx.attempt({ ok: true, helped: errs >= 2 });
          Feedback.hide(trayEl);
          ctx.toast("¡Muy bien! ✨", 1600);
          idx++;
          ctx.progress(idx);
          ctx.later(1300, nextItem);
        } else {
          errs++;
          ctx.attempt({ ok: false });
          if (errs >= 2) {
            suggest().forEach((v) => {
              const b = purseEl.querySelector(`[data-v="${v}"]`);
              if (b) b.classList.add("tie-coin-glow");
            });
            Feedback.show(trayEl, "¡Casi!", `Necesitas ${fmt(need)}. Usa las monedas que brillan.`);
          } else {
            Feedback.show(trayEl, "¡Casi!", total < need ? `Llevas ${fmt(total)}. Te falta un poquito. ¡Inténtalo otra vez!` : `Llevas ${fmt(total)}. Te pasaste un poco. Quita alguna moneda.`);
          }
        }
      });

      ctx.later(200, nextItem);
      return () => {};
    }
  });

  // =====================================================================
  // Adaptadores: Inglés y Sumas dentro de la pantalla estándar
  // =====================================================================
  const LEVEL_NAMES = {
    full: ["medio", "dificil", "dificil"],
    lite: ["facil", "medio", "dificil"]
  };

  function levelName(ctx) {
    const list = LEVEL_NAMES[ctx.mode] || LEVEL_NAMES.lite;
    return list[Math.min(ctx.getLevel(), 3) - 1];
  }

  Aventura.register({
    id: "av-ingles",
    name: "Inglés: números y colores",
    emoji: "🌎",
    area: "ingles",
    codes: [],
    role: "interes",
    modes: ["full", "lite"],
    maxLevel: 1,
    items: () => 6,
    intro: { text: "Escucha la palabra en inglés y elige. ¡Es tu actividad favorita!" },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="avx-wrap">
          <p class="hidden" id="avx-i-progress"></p>
          <div class="ingles-prompt" id="avx-i-prompt"></div>
          <div class="ingles-choices" id="avx-i-choices"></div>
          <div class="win-panel hidden" id="avx-i-win"><p id="avx-i-stars"></p></div>
        </div>`;
      ctx.setInstruction("🌎", "Escucha en inglés y elige.");
      ctx.onReplay(() => ctx.say("Escucha la palabra en inglés y elige la respuesta."));
      InglesGame.start(ctx.ageGroup, levelName(ctx), {
        progress: stage.querySelector("#avx-i-progress"),
        prompt: stage.querySelector("#avx-i-prompt"),
        choices: stage.querySelector("#avx-i-choices"),
        win: stage.querySelector("#avx-i-win"),
        winStars: stage.querySelector("#avx-i-stars"),
        categories: ["numeros", "colores", "animales"],
        rounds: ctx.total,
        onProgress: (round) => ctx.progress(round - 1),
        onComplete: () => ctx.later(500, () => ctx.complete())
      });
      return () => Speech.stop();
    }
  });

  Aventura.register({
    id: "av-sumas",
    name: "Sumas y restas",
    emoji: "➕",
    area: "numeros",
    codes: [],
    role: "interes",
    modes: ["full", "lite"],
    maxLevel: 1,
    items: () => 6,
    intro: { text: "Resuelve las cuentas. Si te equivocas, te ayudo a pensar." },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="avx-wrap">
          <p class="hidden" id="avx-s-progress"></p>
          <div id="avx-s-problem"></div>
          <div class="sumas-choices" id="avx-s-choices"></div>
          <div class="win-panel hidden" id="avx-s-win"><p id="avx-s-stars"></p></div>
        </div>`;
      ctx.setInstruction("➕", "Resuelve la cuenta.");
      ctx.onReplay(() => SumasGame.speakCurrent());
      SumasGame.start(ctx.ageGroup, levelName(ctx), {
        progress: stage.querySelector("#avx-s-progress"),
        problem: stage.querySelector("#avx-s-problem"),
        choices: stage.querySelector("#avx-s-choices"),
        win: stage.querySelector("#avx-s-win"),
        winStars: stage.querySelector("#avx-s-stars"),
        rounds: ctx.total,
        onProgress: (round) => ctx.progress(round - 1),
        onComplete: () => ctx.later(500, () => ctx.complete())
      });
      return () => Speech.stop();
    }
  });
})();
