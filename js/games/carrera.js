// Juego 4: Esquiva Autos. Carrito que se mueve entre carriles esquivando
// obstáculos que caen. Nunca hay "game over": chocar solo da un rebote
// suave con sonido neutro y el juego sigue. Se completa al esquivar
// suficientes obstáculos. Dificultad según perfil (edad) + nivel elegido.
const CarreraGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { lanes: 3, fallSpeed: 140, spawnMs: 1500, target: 10, carSize: 46, obstacleSize: 36 },
      medio: { lanes: 3, fallSpeed: 170, spawnMs: 1200, target: 14, carSize: 46, obstacleSize: 36 },
      dificil: { lanes: 4, fallSpeed: 200, spawnMs: 1000, target: 18, carSize: 42, obstacleSize: 34 }
    },
    "8": {
      facil: { lanes: 4, fallSpeed: 180, spawnMs: 1100, target: 12, carSize: 42, obstacleSize: 34 },
      medio: { lanes: 4, fallSpeed: 220, spawnMs: 950, target: 16, carSize: 40, obstacleSize: 32 },
      dificil: { lanes: 5, fallSpeed: 260, spawnMs: 800, target: 22, carSize: 36, obstacleSize: 30 }
    }
  };

  const OBSTACLE_EMOJIS = ["🪨", "🌵", "🚧", "🐢", "📦"];
  const CAR_EMOJI = "🚗";
  const LOGICAL_W = 300;
  const LOGICAL_H = 440;
  const CAR_Y = LOGICAL_H - 60;

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

    let carLane = Math.floor(diff.lanes / 2);
    let obstacles = [];
    let dodged = 0;
    let lastSpawn = 0;
    let invulnerableUntil = 0;
    let lastTimestamp = null;

    running = true;

    function laneX(lane) {
      return (lane + 0.5) * (LOGICAL_W / diff.lanes);
    }

    function updateProgress() {
      els.progress.textContent = `${dodged} / ${diff.target}`;
    }
    updateProgress();

    function moveLeft() {
      if (!running) return;
      carLane = Math.max(0, carLane - 1);
      GameAudio.playClick();
    }
    function moveRight() {
      if (!running) return;
      carLane = Math.min(diff.lanes - 1, carLane + 1);
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

    function spawnObstacle() {
      obstacles.push({
        lane: Math.floor(Math.random() * diff.lanes),
        y: -30,
        emoji: OBSTACLE_EMOJIS[Math.floor(Math.random() * OBSTACLE_EMOJIS.length)],
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
      Storage.addStars("carrera", stars);
      GameAudio.playCelebration();
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
    }

    function drawRoad(timestamp) {
      ctx.fillStyle = "#4a4066";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
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

    function drawCar(timestamp) {
      const flashing = timestamp < invulnerableUntil && Math.floor(timestamp / 100) % 2 === 0;
      ctx.globalAlpha = flashing ? 0.4 : 1;
      ctx.font = `${diff.carSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(CAR_EMOJI, laneX(carLane), CAR_Y);
      ctx.globalAlpha = 1;
    }

    function drawObstacles() {
      ctx.font = `${diff.obstacleSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      obstacles.forEach((o) => ctx.fillText(o.emoji, laneX(o.lane), o.y));
    }

    function loop(timestamp) {
      if (!running) return;
      if (lastTimestamp === null) lastTimestamp = timestamp;
      // limitar dt evita que una pestaña en segundo plano (rAF pausado) haga
      // que, al volver, los obstáculos "salten" de golpe varias posiciones.
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;

      if (timestamp - lastSpawn > diff.spawnMs) {
        spawnObstacle();
        lastSpawn = timestamp;
      }

      obstacles.forEach((o) => {
        o.y += diff.fallSpeed * dt;
        if (o.resolved) return;
        const nearCar = o.y > CAR_Y - 22 && o.y < CAR_Y + 22 && o.lane === carLane;
        if (nearCar && timestamp > invulnerableUntil) {
          o.resolved = true;
          invulnerableUntil = timestamp + 700;
          GameAudio.playNeutralFlip();
        } else if (o.y > LOGICAL_H + 20) {
          o.resolved = true;
          if (nearCar) return; // ya se resolvió como choque este mismo frame
          dodged++;
          updateProgress();
        }
      });
      obstacles = obstacles.filter((o) => o.y < LOGICAL_H + 40);

      drawRoad(timestamp);
      drawObstacles();
      drawCar(timestamp);

      if (dodged >= diff.target) {
        finish();
        return;
      }
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
  }

  function speakCurrent() {
    Speech.speak("Usa las flechas para esquivar los obstáculos");
  }

  return { start, stop, speakCurrent };
})();
