// Juego 3: Clasificar por colores. Drag & drop con Pointer Events
// (funciona igual con mouse, touch de tablet o celular).
// Dificultad según perfil (edad) + nivel elegido.
const ColoresGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { colorKeys: ["rojo", "azul", "amarillo"], itemsPerColor: 2 },
      medio: { colorKeys: ["rojo", "azul", "amarillo"], itemsPerColor: 3 },
      dificil: { colorKeys: ["rojo", "azul", "amarillo", "verde"], itemsPerColor: 3 }
    },
    "8": {
      facil: { colorKeys: ["rojo", "azul", "amarillo", "verde"], itemsPerColor: 2 },
      medio: { colorKeys: ["rojo", "azul", "amarillo", "verde", "morado"], itemsPerColor: 2 },
      dificil: { colorKeys: ["rojo", "azul", "amarillo", "verde", "morado"], itemsPerColor: 3 }
    }
  };

  const COLOR_INFO = {
    rojo: { label: "Rojo", hex: "#ff5d5d", emojis: ["🍎", "🍓", "🍒"] },
    azul: { label: "Azul", hex: "#3fb8f4", emojis: ["🔷", "💧", "🔵"] },
    amarillo: { label: "Amarillo", hex: "#ffc93c", emojis: ["🍌", "⭐", "🍋"] },
    verde: { label: "Verde", hex: "#4ecb71", emojis: ["🍀", "🥦", "🟢"] },
    morado: { label: "Morado", hex: "#a463f2", emojis: ["🍇", "🔮", "🟣"] }
  };

  let matchedCount = 0;
  let totalItems = 0;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildItems(diff) {
    let uid = 0;
    const items = [];
    diff.colorKeys.forEach((colorKey) => {
      const pool = shuffle(COLOR_INFO[colorKey].emojis);
      for (let i = 0; i < diff.itemsPerColor; i++) {
        items.push({ id: uid++, color: colorKey, emoji: pool[i % pool.length] });
      }
    });
    return shuffle(items);
  }

  function resetItemStyle(el) {
    el.style.position = "static";
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.height = "";
    el.style.zIndex = "";
  }

  function attachDragHandlers(el, els, onPlaced) {
    let dragOffset = { x: 0, y: 0 };

    el.addEventListener("pointerdown", (e) => {
      if (el.classList.contains("placed")) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      el.classList.add("dragging");
      el.style.width = rect.width + "px";
      el.style.height = rect.height + "px";
      el.style.position = "fixed";
      el.style.left = rect.left + "px";
      el.style.top = rect.top + "px";
      el.style.zIndex = 1000;
    });

    el.addEventListener("pointermove", (e) => {
      if (!el.classList.contains("dragging")) return;
      el.style.left = e.clientX - dragOffset.x + "px";
      el.style.top = e.clientY - dragOffset.y + "px";
    });

    function endDrag(e) {
      if (!el.classList.contains("dragging")) return;
      el.classList.remove("dragging");
      // ocultar el propio elemento del hit-test: si no, elementFromPoint
      // encuentra el item arrastrado (que está justo ahí) en vez de la
      // caja de destino debajo de él.
      el.style.visibility = "hidden";
      const target = document.elementFromPoint(e.clientX, e.clientY);
      el.style.visibility = "visible";
      const zone = target ? target.closest(".drop-zone") : null;
      if (zone && zone.dataset.color === el.dataset.color) {
        resetItemStyle(el);
        el.classList.add("placed");
        zone.querySelector(".zone-items").appendChild(el);
        GameAudio.playMatch();
        matchedCount++;
        if (matchedCount === totalItems) onPlaced();
      } else {
        resetItemStyle(el);
        GameAudio.playNeutralFlip();
      }
    }

    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  }

  function start(ageGroup, level, els) {
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    matchedCount = 0;
    els.win.classList.add("hidden");
    els.dropzones.innerHTML = "";
    els.tray.innerHTML = "";

    diff.colorKeys.forEach((colorKey) => {
      const info = COLOR_INFO[colorKey];
      const zone = document.createElement("div");
      zone.className = "drop-zone";
      zone.dataset.color = colorKey;
      zone.style.setProperty("--zone-color", info.hex);
      zone.innerHTML = `<span class="drop-zone-label">${info.label}</span><div class="zone-items"></div>`;
      els.dropzones.appendChild(zone);
    });

    const items = buildItems(diff);
    totalItems = items.length;

    function finish() {
      const stars = 3;
      Storage.addStars("colores", stars);
      GameAudio.playCelebration();
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
    }

    items.forEach((item) => {
      const el = document.createElement("div");
      el.className = "drag-item";
      el.dataset.color = item.color;
      el.dataset.id = item.id;
      el.textContent = item.emoji;
      attachDragHandlers(el, els, finish);
      els.tray.appendChild(el);
    });
  }

  function speakCurrent() {
    Speech.speak("Arrastra cada cosita a su color");
  }

  return { start, speakCurrent };
})();
