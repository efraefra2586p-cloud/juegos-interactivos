// Juego 8: Rompecabezas. Puzzle deslizante (estilo "15 puzzle") de UNA sola
// imagen: se dibuja un emoji grande una sola vez sobre un canvas y cada
// ficha muestra solo su fragmento (técnica de "sprite" con background-size +
// background-position), como un rompecabezas real — no fichas con su propio
// dibujito individual. Mover fichas hacia el hueco vacío hasta que la
// imagen quede completa. Sin límite de tiempo ni forma de perder.
const RompecabezasGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { rows: 2, cols: 2 },
      medio: { rows: 2, cols: 3 },
      dificil: { rows: 3, cols: 3 }
    },
    "8": {
      facil: { rows: 3, cols: 3 },
      medio: { rows: 3, cols: 4 },
      dificil: { rows: 4, cols: 4 }
    }
  };

  const PICTURE_POOL = ["🦁", "🐶", "🐱", "🦄", "🐼", "🐯", "🦊", "🐨", "🦋", "🌈", "🚀", "🐢"];
  const BG_COLORS = ["#fff0d6", "#ffe3ef", "#e6f7ff", "#eafff1", "#f2efff"];
  const GRID_MAX_PX = 320;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildSolvedBoard(count) {
    const board = [];
    for (let i = 0; i < count - 1; i++) board.push(i + 1);
    board.push(null); // hueco vacío
    return board;
  }

  function shuffleBySlides(board, cols, rows, moves) {
    let emptyIndex = board.indexOf(null);
    for (let i = 0; i < moves; i++) {
      const neighbors = neighborIndexes(emptyIndex, cols, rows);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      [board[emptyIndex], board[pick]] = [board[pick], board[emptyIndex]];
      emptyIndex = pick;
    }
    return board;
  }

  function neighborIndexes(index, cols, rows) {
    const x = index % cols;
    const y = Math.floor(index / cols);
    const out = [];
    if (x > 0) out.push(index - 1);
    if (x < cols - 1) out.push(index + 1);
    if (y > 0) out.push(index - cols);
    if (y < rows - 1) out.push(index + cols);
    return out;
  }

  function isSolved(board) {
    for (let i = 0; i < board.length - 1; i++) {
      if (board[i] !== i + 1) return false;
    }
    return true;
  }

  function renderPictureDataURL(widthPx, heightPx) {
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
    ctx.fillRect(0, 0, widthPx, heightPx);
    const emoji = PICTURE_POOL[Math.floor(Math.random() * PICTURE_POOL.length)];
    ctx.font = `${Math.min(widthPx, heightPx) * 0.8}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, widthPx / 2, heightPx / 2 + Math.min(widthPx, heightPx) * 0.05);
    return canvas.toDataURL("image/png");
  }

  function start(ageGroup, level, els) {
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    const { rows, cols } = diff;
    const count = rows * cols;

    let board = shuffleBySlides(buildSolvedBoard(count), cols, rows, count * 25);
    // por si el shuffle terminó ya resuelto (muy improbable), forzar un cambio
    if (isSolved(board)) {
      const n = neighborIndexes(board.indexOf(null), cols, rows)[0];
      [board[board.indexOf(null)], board[n]] = [board[n], board[board.indexOf(null)]];
    }

    els.win.classList.add("hidden");
    const cellPx = Math.floor(GRID_MAX_PX / Math.max(cols, rows));
    const fullWidth = cellPx * cols;
    const fullHeight = cellPx * rows;
    const pictureURL = renderPictureDataURL(fullWidth, fullHeight);

    els.grid.style.gridTemplateColumns = `repeat(${cols}, ${cellPx}px)`;
    els.grid.style.gridTemplateRows = `repeat(${rows}, ${cellPx}px)`;
    els.grid.innerHTML = "";

    const cellEls = [];
    for (let i = 0; i < count; i++) {
      const div = document.createElement("div");
      div.className = "puzzle-cell";
      div.style.width = cellPx + "px";
      div.style.height = cellPx + "px";
      div.addEventListener("click", () => tryMove(i));
      els.grid.appendChild(div);
      cellEls.push(div);
    }

    function render() {
      board.forEach((value, i) => {
        const el = cellEls[i];
        if (value === null) {
          el.className = "puzzle-cell puzzle-empty";
          el.style.backgroundImage = "";
        } else {
          const homeIndex = value - 1;
          const homeCol = homeIndex % cols;
          const homeRow = Math.floor(homeIndex / cols);
          el.className = "puzzle-cell puzzle-tile";
          el.style.backgroundImage = `url(${pictureURL})`;
          el.style.backgroundSize = `${fullWidth}px ${fullHeight}px`;
          el.style.backgroundPosition = `-${homeCol * cellPx}px -${homeRow * cellPx}px`;
        }
      });
    }
    render();

    function tryMove(index) {
      const emptyIndex = board.indexOf(null);
      const neighbors = neighborIndexes(emptyIndex, cols, rows);
      if (!neighbors.includes(index)) return;
      [board[emptyIndex], board[index]] = [board[index], board[emptyIndex]];
      GameAudio.playClick();
      render();
      if (isSolved(board)) finish();
    }

    function finish() {
      const stars = 3;
      Storage.addStars("rompecabezas", stars);
      GameAudio.playCelebration();
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
    }
  }

  return { start };
})();
