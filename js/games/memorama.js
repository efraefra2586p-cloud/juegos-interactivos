// Juego 1: Memorama. Dificultad según perfil (edad) + nivel elegido.
const MemoramaGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { pairs: 3, columns: 3 },
      medio: { pairs: 4, columns: 4 },
      dificil: { pairs: 6, columns: 4 }
    },
    "8": {
      facil: { pairs: 6, columns: 4 },
      medio: { pairs: 8, columns: 4 },
      dificil: { pairs: 10, columns: 5 }
    }
  };

  const SYMBOL_POOL = ["🐶", "🐱", "🐵", "🦊", "🐸", "🐼", "🍎", "🍌", "🍇", "🍓", "🍉", "🍒"];

  let board = [];
  let flipped = [];
  let matchedCount = 0;
  let totalPairs = 0;
  let locked = false;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildDeck(pairs) {
    const symbols = shuffle(SYMBOL_POOL).slice(0, pairs);
    const deck = shuffle([...symbols, ...symbols]).map((symbol, i) => ({
      id: i,
      symbol,
      matched: false
    }));
    return deck;
  }

  function start(ageGroup, level, els) {
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    totalPairs = diff.pairs;
    matchedCount = 0;
    flipped = [];
    locked = false;
    board = buildDeck(diff.pairs);

    const elBoard = els.board;
    const elWin = els.win;
    elWin.classList.add("hidden");
    elBoard.style.gridTemplateColumns = `repeat(${diff.columns}, 1fr)`;
    elBoard.innerHTML = "";

    board.forEach((card) => {
      const btn = document.createElement("button");
      btn.className = "memo-card";
      btn.dataset.id = card.id;
      btn.innerHTML = `<span class="memo-face">${card.symbol}</span>`;
      btn.addEventListener("click", () => handleFlip(card.id, elBoard, elWin));
      elBoard.appendChild(btn);
    });
  }

  function handleFlip(id, elBoard, elWin) {
    if (locked) return;
    const cardEl = elBoard.querySelector(`[data-id="${id}"]`);
    const cardData = board.find((c) => c.id === id);
    if (!cardData || cardData.matched || cardEl.classList.contains("flipped")) return;

    cardEl.classList.add("flipped");
    GameAudio.playNeutralFlip();
    flipped.push({ id, el: cardEl, data: cardData });

    if (flipped.length === 2) {
      locked = true;
      const [a, b] = flipped;
      if (a.data.symbol === b.data.symbol) {
        setTimeout(() => {
          a.el.classList.add("matched");
          b.el.classList.add("matched");
          a.data.matched = true;
          b.data.matched = true;
          matchedCount++;
          GameAudio.playMatch();
          flipped = [];
          locked = false;
          if (matchedCount === totalPairs) {
            finishGame(elWin);
          }
        }, 350);
      } else {
        setTimeout(() => {
          a.el.classList.remove("flipped");
          b.el.classList.remove("flipped");
          flipped = [];
          locked = false;
        }, 700);
      }
    }
  }

  function finishGame(elWin) {
    const stars = 3; // completar el memorama siempre da la celebración completa
    Storage.addStars("memorama", stars);
    GameAudio.playCelebration();
    const starsText = "⭐".repeat(stars);
    elWin.querySelector("#memorama-win-stars").textContent = starsText;
    elWin.classList.remove("hidden");
    Confetti.burst(elWin);
  }

  return { start };
})();
