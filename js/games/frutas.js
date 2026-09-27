// Juego 5: Atrapa Frutas. Canasta que se mueve entre carriles para atrapar
// frutas que caen. Solo hay feedback positivo: atrapar suena bien, no
// atrapar simplemente no suma (nunca resta ni penaliza). Se completa al
// atrapar suficientes frutas. Dificultad según perfil (edad) + nivel elegido.
const FrutasGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { lanes: 3, fallSpeed: 130, spawnMs: 1400, target: 10, basketSize: 46, fruitSize: 34 },
      medio: { lanes: 3, fallSpeed: 160, spawnMs: 1150, target: 14, basketSize: 46, fruitSize: 34 },
      dificil: { lanes: 4, fallSpeed: 190, spawnMs: 950, target: 18, basketSize: 42, fruitSize: 32 }
    },
    "8": {
      facil: { lanes: 4, fallSpeed: 170, spawnMs: 1050, target: 12, basketSize: 42, fruitSize: 32 },
      medio: { lanes: 4, fallSpeed: 210, spawnMs: 900, target: 16, basketSize: 40, fruitSize: 30 },
      dificil: { lanes: 5, fallSpeed: 250, spawnMs: 750, target: 22, basketSize: 36, fruitSize: 28 }
    }
  };

  const FRUIT_EMOJIS = ["🍎", "🍌", "🍇", "🍓", "🍉", "🍒", "🍍", "🥝"];
  const BASKET_EMOJI = "🧺";
  const LOGICAL_W = 300;
  const LOGICAL_H = 440;
  const BASKET_Y = LOGICAL_H - 60;

  let rafId = null;
  let running = false;
  let keydownHandler = null;

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
    }
  }

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_W * dpr;
    canvas.height = LOGICAL_H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function start(ageGroup, level, els) {
    stop();
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    const ctx = setupCanvas(els.canvas);

    els.win.classList.add("hidden");
    els.canvas.classList.remove("hidden");
    els.canvas.parentElement.querySelector(".carrera-controls").classList.remove("hidden");

    let basketLane = Math.floor(diff.lanes / 2);
    let fruits = [];
    let caught = 0;
    let lastSpawn = 0;
    let catchFlashUntil = 0;
    let lastTimestamp = null;

    running = true;

    function laneX(lane) {
      return (lane + 0.5) * (LOGICAL_W / diff.lanes);
    }

    function updateProgress() {
      els.progress.textContent = `${caught} / ${diff.target}`;
    }
    updateProgress();

    function moveLeft() {
      if (!running) return;
      basketLane = Math.max(0, basketLane - 1);
      GameAudio.playClick();
    }
    function moveRight() {
      if (!running) return;
      basketLane = Math.min(diff.lanes - 1, basketLane + 1);
      GameAudio.playClick();
    }

    els.btnLeft.onclick = moveLeft;
    els.btnRight.onclick = moveRight;

    els.canvas.onpointerdown = (e) => {
      const rect = els.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) moveLeft();
      else moveRight();
    };

    keydownHandler = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveLeft();
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveRight();
    };
    document.addEventListener("keydown", keydownHandler);

    function spawnFruit() {
      fruits.push({
        lane: Math.floor(Math.random() * diff.lanes),
        y: -30,
        emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
        resolved: false
      });
    }

    function finish() {
      running = false;
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
      els.canvas.classList.add("hidden");
      els.canvas.parentElement.querySelector(".carrera-controls").classList.add("hidden");
      const stars = 3;
      Storage.addStars("frutas", stars);
      GameAudio.playCelebration();
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
    }

    function drawBackground(timestamp) {
      ctx.fillStyle = "#3f7a4a";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 14]);
      const scroll = (timestamp / 12) % 30;
      for (let lane = 1; lane < diff.lanes; lane++) {
        const x = (LOGICAL_W / diff.lanes) * lane;
        ctx.beginPath();
        ctx.moveTo(x, -30 + scroll);
        ctx.lineTo(x, LOGICAL_H);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    function drawBasket(timestamp) {
      const bump = timestamp < catchFlashUntil ? 1.25 : 1;
      ctx.save();
      ctx.translate(laneX(basketLane), BASKET_Y);
      ctx.scale(bump, bump);
      ctx.font = `${diff.basketSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(BASKET_EMOJI, 0, 0);
      ctx.restore();
    }

    function drawFruits() {
      ctx.font = `${diff.fruitSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      fruits.forEach((f) => ctx.fillText(f.emoji, laneX(f.lane), f.y));
    }

    function loop(timestamp) {
      if (!running) return;
      if (lastTimestamp === null) lastTimestamp = timestamp;
      // limitar dt evita saltos si la pestaña estuvo en segundo plano.
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;

      if (timestamp - lastSpawn > diff.spawnMs) {
        spawnFruit();
        lastSpawn = timestamp;
      }

      fruits.forEach((f) => {
        f.y += diff.fallSpeed * dt;
      });
      fruits.forEach((f) => {
        const nearBasket = f.y > BASKET_Y - 24 && f.y < BASKET_Y + 24 && f.lane === basketLane;
        if (nearBasket) {
          f.caught = true;
          caught++;
          updateProgress();
          catchFlashUntil = timestamp + 180;
          GameAudio.playMatch();
        }
      });
      // la fruta atrapada desaparece de inmediato (no sigue cayendo por
      // encima de la canasta); la que no se atrapó simplemente sale de la
      // pantalla más abajo, sin sonido ni penalización.
      fruits = fruits.filter((f) => !f.caught && f.y < LOGICAL_H + 40);

      drawBackground(timestamp);
      drawFruits();
      drawBasket(timestamp);

      if (caught >= diff.target) {
        finish();
        return;
      }
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
  }

  function speakCurrent() {
    Speech.speak("Mueve la canasta para atrapar las frutas");
  }

  return { start, stop, speakCurrent };
})();
