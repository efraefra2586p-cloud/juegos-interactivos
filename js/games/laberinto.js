// Juego 6: Laberinto. Guiar al personaje hasta la meta. Sin límite de
// tiempo ni forma de "perder": solo se trata de explorar hasta llegar.
// Dificultad según perfil (edad) + nivel elegido (tamaño del laberinto).
const LaberintoGame = (() => {
  const DIFFICULTY = {
    "5": { facil: { size: 4 }, medio: { size: 5 }, dificil: { size: 6 } },
    "8": { facil: { size: 6 }, medio: { size: 8 }, dificil: { size: 10 } }
  };

  const MAZE_MAX_PX = 320;
  const DIRS = [
    { dx: 0, dy: -1, self: "N", opp: "S" },
    { dx: 1, dy: 0, self: "E", opp: "W" },
    { dx: 0, dy: 1, self: "S", opp: "N" },
    { dx: -1, dy: 0, self: "W", opp: "E" }
  ];

  let keydownHandler = null;

  function stop() {
    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
    }
  }

  function generateMaze(cols, rows) {
    const cells = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) row.push({ N: true, E: true, S: true, W: true, visited: false });
      cells.push(row);
    }
    const stack = [{ x: 0, y: 0 }];
    cells[0][0].visited = true;
    while (stack.length) {
      const current = stack[stack.length - 1];
      const options = [];
      DIRS.forEach((d) => {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !cells[ny][nx].visited) {
          options.push({ x: nx, y: ny, dir: d });
        }
      });
      if (options.length) {
        const pick = options[Math.floor(Math.random() * options.length)];
        cells[current.y][current.x][pick.dir.self] = false;
        cells[pick.y][pick.x][pick.dir.opp] = false;
        cells[pick.y][pick.x].visited = true;
        stack.push({ x: pick.x, y: pick.y });
      } else {
        stack.pop();
      }
    }
    return cells;
  }

  function bfsPath(cells, cols, rows, start, goal) {
    const key = (x, y) => y * cols + x;
    const visited = new Set([key(start.x, start.y)]);
    const prev = new Map();
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      if (cur.x === goal.x && cur.y === goal.y) break;
      const cell = cells[cur.y][cur.x];
      const neighbors = [];
      if (!cell.N) neighbors.push({ x: cur.x, y: cur.y - 1 });
      if (!cell.E) neighbors.push({ x: cur.x + 1, y: cur.y });
      if (!cell.S) neighbors.push({ x: cur.x, y: cur.y + 1 });
      if (!cell.W) neighbors.push({ x: cur.x - 1, y: cur.y });
      neighbors.forEach((n) => {
        const k = key(n.x, n.y);
        if (!visited.has(k)) {
          visited.add(k);
          prev.set(k, cur);
          queue.push(n);
        }
      });
    }
    if (!visited.has(key(goal.x, goal.y))) return null;
    const path = [];
    let cur = goal;
    while (!(cur.x === start.x && cur.y === start.y)) {
      path.push(cur);
      cur = prev.get(key(cur.x, cur.y));
    }
    path.push(start);
    path.reverse();
    return path;
  }

  function start(ageGroup, level, els) {
    stop();
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    const cols = diff.size;
    const rows = diff.size;
    const cells = generateMaze(cols, rows);
    const goal = { x: cols - 1, y: rows - 1 };
    let player = { x: 0, y: 0 };

    const playerEmoji = els.playerEmoji || (ageGroup === "5" ? "🐣" : "🦁");
    const cellPx = Math.floor(MAZE_MAX_PX / Math.max(cols, rows));

    els.win.classList.add("hidden");
    els.grid.innerHTML = "";
    els.grid.style.gridTemplateColumns = `repeat(${cols}, ${cellPx}px)`;
    els.grid.style.gridTemplateRows = `repeat(${rows}, ${cellPx}px)`;

    const cellEls = [];
    for (let y = 0; y < rows; y++) {
      const rowEls = [];
      for (let x = 0; x < cols; x++) {
        const cell = cells[y][x];
        const div = document.createElement("div");
        div.className = "maze-cell";
        if (cell.N) div.classList.add("wall-n");
        if (cell.E) div.classList.add("wall-e");
        if (cell.S) div.classList.add("wall-s");
        if (cell.W) div.classList.add("wall-w");
        div.style.width = cellPx + "px";
        div.style.height = cellPx + "px";
        div.dataset.x = x;
        div.dataset.y = y;
        div.addEventListener("click", () => tryMoveTo(x, y));
        els.grid.appendChild(div);
        rowEls.push(div);
      }
      cellEls.push(rowEls);
    }

    function render() {
      cellEls.forEach((row) => row.forEach((el) => (el.innerHTML = "")));
      cellEls[goal.y][goal.x].innerHTML = `<span class="maze-goal">🏁</span>`;
      cellEls[player.y][player.x].innerHTML = `<span class="maze-player">${playerEmoji}</span>`;
    }
    render();

    function canMove(dir) {
      return !cells[player.y][player.x][dir];
    }

    function move(dir) {
      if (!canMove(dir)) return;
      const d = DIRS.find((dd) => dd.self === dir);
      player = { x: player.x + d.dx, y: player.y + d.dy };
      GameAudio.playClick();
      render();
      if (player.x === goal.x && player.y === goal.y) finish();
    }

    function tryMoveTo(x, y) {
      const dx = x - player.x;
      const dy = y - player.y;
      if (Math.abs(dx) + Math.abs(dy) !== 1) return;
      if (dx === 1) move("E");
      else if (dx === -1) move("W");
      else if (dy === 1) move("S");
      else if (dy === -1) move("N");
    }

    els.btnUp.onclick = () => move("N");
    els.btnDown.onclick = () => move("S");
    els.btnLeft.onclick = () => move("W");
    els.btnRight.onclick = () => move("E");

    let hintTimeout = null;
    els.btnHint.onclick = () => {
      const path = bfsPath(cells, cols, rows, player, goal);
      if (!path || path.length < 2) return;
      if (hintTimeout) clearTimeout(hintTimeout);
      document.querySelectorAll(".maze-hint").forEach((el) => el.classList.remove("maze-hint"));
      const next = path[1];
      const el = cellEls[next.y][next.x];
      el.classList.add("maze-hint");
      Speech.speak("Por aquí");
      hintTimeout = setTimeout(() => el.classList.remove("maze-hint"), 900);
    };

    keydownHandler = (e) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") move("N");
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") move("S");
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") move("W");
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") move("E");
    };
    document.addEventListener("keydown", keydownHandler);

    function finish() {
      stop();
      const stars = 3;
      Storage.addStars("laberinto", stars);
      GameAudio.playCelebration();
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
    }
  }

  return { start, stop };
})();
