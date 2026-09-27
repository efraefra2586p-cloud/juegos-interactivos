// Aventuras · Orden y secuencias
//   mochila — R2: guardar cada objeto en su lugar (arrastrar o tocar)
//   primero — R3: ordenar 3–4 imágenes y contar la historia
//             ("Primero… Después… Al final…"), con grabación de voz opcional
// La grabación NUNCA se guarda: vive solo en la memoria mientras se juega.
(() => {
  const U = Aventura.util;

  // =====================================================================
  // R2 · Ordena la mochila
  // =====================================================================
  const SCENES = [
    {
      id: "cole",
      title: "Mi mochila del colegio",
      zones: [
        { id: "mochila", e: "🎒", name: "la mochila" },
        { id: "estuche", e: "✏️", name: "el estuche" },
        { id: "casa", e: "🧸", name: "la caja de juguetes" }
      ],
      items: [
        { e: "📓", t: "cuaderno", zone: "mochila" },
        { e: "📕", t: "libro", zone: "mochila" },
        { e: "🥪", t: "lonchera", zone: "mochila" },
        { e: "🥤", t: "botella de agua", zone: "mochila" },
        { e: "✏️", t: "lápiz", zone: "estuche" },
        { e: "🖍️", t: "crayones", zone: "estuche" },
        { e: "📏", t: "regla", zone: "estuche" },
        { e: "✂️", t: "tijeras", zone: "estuche" },
        { e: "🚗", t: "carrito", zone: "casa" },
        { e: "🧸", t: "peluche", zone: "casa" },
        { e: "⚽", t: "pelota", zone: "casa" },
        { e: "🪀", t: "yoyo", zone: "casa" }
      ]
    },
    {
      id: "cuarto",
      title: "Mi cuarto",
      zones: [
        { id: "ropero", e: "👕", name: "el ropero" },
        { id: "juguetes", e: "🧸", name: "la caja de juguetes" },
        { id: "sucia", e: "🧺", name: "el cesto de ropa sucia" }
      ],
      items: [
        { e: "👕", t: "camiseta limpia", zone: "ropero" },
        { e: "👖", t: "pantalón limpio", zone: "ropero" },
        { e: "🧥", t: "chompa limpia", zone: "ropero" },
        { e: "🚂", t: "tren", zone: "juguetes" },
        { e: "🧩", t: "rompecabezas", zone: "juguetes" },
        { e: "🪁", t: "cometa", zone: "juguetes" },
        { e: "🧦", t: "calcetín sucio", zone: "sucia" },
        { e: "👚", t: "camisa sucia", zone: "sucia" },
        { e: "🩳", t: "short sucio", zone: "sucia" }
      ]
    },
    {
      id: "escritorio",
      title: "Mi escritorio",
      zones: [
        { id: "estuche", e: "✏️", name: "el estuche" },
        { id: "libros", e: "📚", name: "el estante de libros" },
        { id: "basura", e: "🗑️", name: "el basurero" }
      ],
      items: [
        { e: "✏️", t: "lápiz", zone: "estuche" },
        { e: "🖊️", t: "esfero", zone: "estuche" },
        { e: "📏", t: "regla", zone: "estuche" },
        { e: "📗", t: "libro de lectura", zone: "libros" },
        { e: "📘", t: "libro de mates", zone: "libros" },
        { e: "📙", t: "diccionario", zone: "libros" },
        { e: "🧻", t: "papel arrugado", zone: "basura" },
        { e: "🍬", t: "envoltorio", zone: "basura" },
        { e: "🍌", t: "cáscara", zone: "basura" }
      ]
    }
  ];

  Aventura.register({
    id: "mochila",
    name: "Ordena la mochila",
    emoji: "🎒",
    area: "rutinas",
    codes: ["AU-1"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: (sett, level) => (level === 1 ? 4 : level === 2 ? 6 : 8),
    intro: {
      text: "Cada cosa tiene su lugar. Arrastra cada objeto a donde va. También puedes tocarlo y luego tocar el lugar.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">📓</div><span class="av-demo-arrow">➜</span><div class="av-demo-card">🎒</div></div>`
    },
    mount(stage, ctx) {
      stage.innerHTML = `
        <div class="moc-wrap">
          <p class="moc-title" id="moc-title"></p>
          <div class="moc-zones" id="moc-zones"></div>
          <div class="moc-tray" id="moc-tray"></div>
        </div>`;
      const titleEl = stage.querySelector("#moc-title");
      const zonesEl = stage.querySelector("#moc-zones");
      const trayEl = stage.querySelector("#moc-tray");
      let scene = null;
      let items = [];
      let placed = 0;
      let errs = 0;
      let selected = null;
      let busy = false;
      let handles = [];

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };

      function setup() {
        const level = ctx.getLevel();
        scene = U.pick(SCENES);
        const nZones = level === 1 ? 2 : 3;
        const zones = scene.zones.slice(0, nZones);
        const zoneIds = zones.map((z) => z.id);
        const total = level === 1 ? 4 : level === 2 ? 6 : 8;
        const per = Math.ceil(total / nZones);
        let pool = [];
        zoneIds.forEach((zid) => {
          pool = pool.concat(U.shuffle(scene.items.filter((it) => it.zone === zid)).slice(0, per));
        });
        items = U.shuffle(pool).slice(0, total);
        ctx.setTotal(items.length);
        titleEl.textContent = scene.title;
        zonesEl.innerHTML = zones
          .map((z) => `<button class="moc-zone" data-drop="${z.id}"><span class="moc-zone-e">${z.e}</span><b>${z.name}</b><span class="moc-zone-pile" id="pile-${z.id}"></span></button>`)
          .join("");
        trayEl.innerHTML = items
          .map((it, i) => `<button class="moc-item" data-i="${i}"><span>${it.e}</span><small>${it.t}</small></button>`)
          .join("");
        zonesEl.querySelectorAll(".moc-zone").forEach((z) =>
          z.addEventListener("click", () => {
            if (selected !== null) tryPlace(selected, z.dataset.drop);
          })
        );
        trayEl.querySelectorAll(".moc-item").forEach((b) => {
          const i = Number(b.dataset.i);
          ctx.draggable(b, {
            onDrop: (zone) => {
              if (zone && zone.classList.contains("moc-zone")) tryPlace(i, zone.dataset.drop);
            },
            onTap: () => select(i)
          });
        });
        ctx.setInstruction("🎒", "Guarda cada cosa en su lugar.");
        ctx.onReplay(() => ctx.say(`${scene.title}. Guarda cada cosa en su lugar.`));
        ctx.say(`${scene.title}. Guarda cada cosa en su lugar.`);
      }

      function select(i) {
        if (busy) return;
        selected = i;
        trayEl.querySelectorAll(".moc-item").forEach((b) => b.classList.toggle("sel", Number(b.dataset.i) === i));
        zonesEl.classList.add("moc-await");
        ctx.say(items[i].t);
      }

      function tryPlace(i, zoneId) {
        if (busy) return;
        const it = items[i];
        const btn = trayEl.querySelector(`.moc-item[data-i="${i}"]`);
        if (!btn || btn.classList.contains("gone")) return;
        const zone = scene.zones.find((z) => z.id === zoneId);
        if (it.zone === zoneId) {
          busy = true;
          btn.classList.add("gone");
          btn.classList.remove("sel");
          selected = null;
          zonesEl.classList.remove("moc-await");
          const pile = zonesEl.querySelector(`#pile-${zoneId}`);
          if (pile) pile.textContent += it.e;
          GameAudio.playMatch();
          Feedback.hide(trayEl);
          ctx.attempt({ ok: true, helped: errs >= 2 });
          errs = 0;
          placed++;
          ctx.progress(placed);
          ctx.say(`${it.t} va en ${zone.name}. ¡Bien!`);
          later(500, () => {
            busy = false;
            if (placed >= items.length) later(900, () => ctx.complete({ objetos: items.length }));
          });
        } else {
          errs++;
          ctx.attempt({ ok: false });
          const right = scene.zones.find((z) => z.id === it.zone);
          if (errs >= 2) {
            const rz = zonesEl.querySelector(`[data-drop="${it.zone}"]`);
            if (rz) rz.classList.add("choice-hint");
            later(2500, () => rz && rz.classList.remove("choice-hint"));
            Feedback.show(trayEl, "Mira el lugar que brilla", `${it.t} va en ${right.name}.`);
          } else {
            Feedback.show(trayEl, "Piénsalo otra vez", `${it.e} ${it.t}: ¿en qué lugar se guarda? Prueba en otro.`);
          }
        }
      }

      later(200, setup);
      return () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
      };
    }
  });

  // =====================================================================
  // R3 · ¿Qué va primero?
  // =====================================================================
  const SEQS = [
    { title: "Lavarme los dientes", e: "🪥", steps: [{ e: "🪥", t: "Pongo pasta en el cepillo" }, { e: "😁", t: "Cepillo mis dientes" }, { e: "🚰", t: "Me enjuago la boca" }] },
    { title: "Ponerme los zapatos", e: "👟", steps: [{ e: "🧦", t: "Me pongo los calcetines" }, { e: "👟", t: "Me pongo los zapatos" }, { e: "🎀", t: "Amarro los cordones" }] },
    { title: "Llueve", e: "🌧️", steps: [{ e: "☁️", t: "Se llena de nubes" }, { e: "🌧️", t: "Empieza a llover" }, { e: "🌈", t: "Sale el arcoíris" }] },
    { title: "Hacer un sándwich", e: "🥪", steps: [{ e: "🍞", t: "Pongo el pan" }, { e: "🧀", t: "Le pongo queso" }, { e: "🥪", t: "Lo cierro" }, { e: "😋", t: "Me lo como" }] },
    { title: "Sembrar una planta", e: "🌱", steps: [{ e: "🕳️", t: "Hago un hueco" }, { e: "🌰", t: "Pongo la semilla" }, { e: "💧", t: "La riego" }, { e: "🌻", t: "Sale una flor" }] },
    { title: "Bañarme", e: "🛁", steps: [{ e: "🚿", t: "Me mojo" }, { e: "🧼", t: "Me enjabono" }, { e: "💦", t: "Me enjuago" }, { e: "🧻", t: "Me seco con la toalla" }] },
    { title: "De huevo a pollito", e: "🐥", steps: [{ e: "🥚", t: "Hay un huevo" }, { e: "🐣", t: "El huevo se rompe" }, { e: "🐥", t: "Sale un pollito" }, { e: "🐔", t: "El pollito crece" }] },
    { title: "Mi cumpleaños", e: "🎂", steps: [{ e: "🎈", t: "Ponemos globos" }, { e: "🎂", t: "Cantamos y soplo la vela" }, { e: "🍰", t: "Comemos pastel" }] }
  ];
  const LABELS3 = ["Primero", "Después", "Al final"];
  const LABELS4 = ["Primero", "Después", "Luego", "Al final"];

  Aventura.register({
    id: "primero",
    name: "¿Qué va primero?",
    emoji: "🔢",
    area: "rutinas",
    codes: ["AU-1", "LG-1"],
    role: "reto",
    modes: ["full", "lite"],
    maxLevel: 3,
    items: (sett, level) => (level === 1 ? 2 : 3),
    intro: {
      text: "Ordena los dibujos como pasan en la vida. Después cuenta la historia: primero, después, al final.",
      demo: () => `<div class="av-demo-row"><div class="av-demo-card">1️⃣<br>🧦</div><div class="av-demo-card">2️⃣<br>👟</div><div class="av-demo-card">3️⃣<br>🎀</div></div>`
    },
    mount(stage, ctx) {
      const lite = ctx.mode === "lite";
      stage.innerHTML = `
        <div class="pri-wrap">
          <p class="pri-title" id="pri-title"></p>
          <div class="pri-slots" id="pri-slots"></div>
          <div class="pri-cards" id="pri-cards"></div>
          <div class="pri-retell hidden" id="pri-retell"></div>
        </div>`;
      const titleEl = stage.querySelector("#pri-title");
      const slotsEl = stage.querySelector("#pri-slots");
      const cardsEl = stage.querySelector("#pri-cards");
      const retellEl = stage.querySelector("#pri-retell");
      let idx = 0;
      let used = [];
      let seq = null;
      let pos = 0;
      let errs = 0;
      let busy = false;
      let handles = [];
      let recorder = null;
      let stream = null;
      let audioUrl = null;
      let chunks = [];

      const later = (ms, fn) => {
        const h = ctx.later(ms, fn);
        handles.push(h);
        return h;
      };

      function releaseAudio() {
        try {
          if (recorder && recorder.state !== "inactive") recorder.stop();
        } catch (e) {
          /* ya detenido */
        }
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        recorder = null;
        stream = null;
        audioUrl = null;
        chunks = [];
      }

      function pickSeq() {
        const level = ctx.itemLevel();
        const wanted = lite ? 3 : level === 1 ? 3 : level === 2 ? (Math.random() < 0.5 ? 3 : 4) : 4;
        let pool = SEQS.filter((s) => s.steps.length === wanted && !used.includes(s));
        if (!pool.length) pool = SEQS.filter((s) => s.steps.length === wanted);
        if (!pool.length) pool = SEQS;
        const s = U.pick(pool);
        used.push(s);
        return s;
      }

      function startItem() {
        if (idx >= ctx.total) return ctx.complete();
        releaseAudio();
        seq = pickSeq();
        pos = 0;
        errs = 0;
        busy = false;
        Feedback.hide(cardsEl);
        retellEl.classList.add("hidden");
        retellEl.innerHTML = "";
        slotsEl.classList.remove("hidden");
        cardsEl.classList.remove("hidden");
        titleEl.textContent = `${seq.e} ${seq.title}`;
        slotsEl.innerHTML = seq.steps.map((_, i) => `<div class="pri-slot" data-i="${i}"><span class="pri-slot-n">${i + 1}</span></div>`).join("");
        const order = U.shuffle(seq.steps.map((s, i) => ({ ...s, i })));
        // que no quede ya en orden por casualidad
        if (order.every((o, k) => o.i === k)) order.reverse();
        cardsEl.innerHTML = order.map((o) => `<button class="pri-card" data-i="${o.i}"><span class="pri-card-e">${o.e}</span><small>${o.t}</small></button>`).join("");
        cardsEl.querySelectorAll(".pri-card").forEach((b) => b.addEventListener("click", () => onCard(b)));
        ctx.setInstruction("🔢", "¿Qué va primero?");
        ctx.onReplay(() => ctx.say(`${seq.title}. Toca primero lo que pasa primero.`));
        ctx.say(`${seq.title}. Toca primero lo que pasa primero.`);
      }

      function onCard(b) {
        if (busy || b.disabled || ctx.isPaused()) return;
        const i = Number(b.dataset.i);
        const step = seq.steps[i];
        if (i === pos) {
          busy = true;
          b.disabled = true;
          b.classList.add("placed");
          const slot = slotsEl.querySelector(`.pri-slot[data-i="${pos}"]`);
          slot.innerHTML = `<span class="pri-slot-e">${step.e}</span>`;
          slot.classList.add("filled");
          GameAudio.playMatch();
          Feedback.hide(cardsEl);
          ctx.attempt({ ok: true, helped: errs >= 2 });
          errs = 0;
          pos++;
          ctx.say(step.t);
          later(450, () => {
            busy = false;
            if (pos >= seq.steps.length) later(900, retell);
          });
        } else {
          errs++;
          ctx.attempt({ ok: false });
          Speech.speak(step.t);
          b.classList.add("choice-wrong");
          later(700, () => b.classList.remove("choice-wrong"));
          if (errs >= 2) {
            const right = cardsEl.querySelector(`.pri-card[data-i="${pos}"]`);
            if (right) right.classList.add("choice-hint");
            Feedback.show(cardsEl, "Mira el que brilla", "Ese es el que pasa primero ahora.");
          } else {
            Feedback.show(cardsEl, "Piénsalo otra vez", pos === 0 ? "¿Qué es lo primero que pasa?" : "¿Qué pasa después de lo que ya pusiste?");
          }
        }
      }

      // ---------- contar la historia ----------
      function retell() {
        const labels = seq.steps.length === 4 ? LABELS4 : LABELS3;
        slotsEl.classList.add("hidden");
        cardsEl.classList.add("hidden");
        Feedback.hide(cardsEl);
        retellEl.classList.remove("hidden");
        const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
        retellEl.innerHTML = `
          <p class="pri-retell-q">Ahora cuéntalo tú con tus palabras.</p>
          <ol class="pri-story">${seq.steps.map((s, i) => `<li><b>${labels[i]}…</b><span class="pri-story-e">${s.e}</span><span>${s.t}</span></li>`).join("")}</ol>
          <div class="pri-retell-btns">
            <button class="av-btn av-btn-soft" id="pri-listen"><span class="av-btn-emoji">🔊</span><span>Escuchar el cuento</span></button>
            ${canRecord ? `<button class="av-btn av-btn-soft" id="pri-rec"><span class="av-btn-emoji">🎙️</span><span>Grabar mi voz</span></button>` : ""}
            <button class="av-btn av-btn-primary" id="pri-done"><span class="av-btn-emoji">✔</span><span>Ya lo conté</span></button>
          </div>
          <div class="pri-play hidden" id="pri-play"></div>`;
        const story = `${seq.steps.map((s, i) => `${labels[i]}, ${s.t.charAt(0).toLowerCase()}${s.t.slice(1)}.`).join(" ")}`;
        ctx.setInstruction("🗣️", "Cuenta la historia.");
        ctx.onReplay(() => ctx.say(story));
        ctx.say("Ahora cuéntalo tú con tus palabras. Primero, después, al final.");
        retellEl.querySelector("#pri-listen").addEventListener("click", () => ctx.say(story));
        const recBtn = retellEl.querySelector("#pri-rec");
        if (recBtn) recBtn.addEventListener("click", () => toggleRecord(recBtn));
        retellEl.querySelector("#pri-done").addEventListener("click", () => {
          GameAudio.playClick();
          releaseAudio();
          idx++;
          ctx.progress(idx);
          ctx.toast("¡Qué buena historia! 📖", 2000);
          later(1200, startItem);
        });
      }

      async function toggleRecord(btn) {
        const play = retellEl.querySelector("#pri-play");
        if (recorder && recorder.state === "recording") {
          recorder.stop();
          return;
        }
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
          ctx.toast("No se pudo usar el micrófono. ¡Cuéntalo en voz alta!", 3000);
          btn.classList.add("hidden");
          return;
        }
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (ev) => ev.data && ev.data.size && chunks.push(ev.data);
        recorder.onstop = () => {
          btn.innerHTML = `<span class="av-btn-emoji">🎙️</span><span>Grabar otra vez</span>`;
          btn.classList.remove("rec-on");
          if (stream) stream.getTracks().forEach((t) => t.stop());
          if (!chunks.length) return;
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          audioUrl = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          play.classList.remove("hidden");
          play.innerHTML = `<button class="av-btn av-btn-soft" id="pri-play-btn"><span class="av-btn-emoji">▶️</span><span>Escuchar mi voz</span></button><small>Tu voz no se guarda: se borra al terminar.</small>`;
          play.querySelector("#pri-play-btn").addEventListener("click", () => new Audio(audioUrl).play());
        };
        recorder.start();
        btn.classList.add("rec-on");
        btn.innerHTML = `<span class="av-btn-emoji">⏹️</span><span>Terminé de hablar</span>`;
      }

      later(200, startItem);
      return () => {
        handles.forEach((h) => ctx.cancelLater(h));
        handles = [];
        releaseAudio();
      };
    }
  });
})();
