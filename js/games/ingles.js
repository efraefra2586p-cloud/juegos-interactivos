// Juego 7: Inglés. Vocabulario bilingüe con audio. Para 5 años (no lee
// inglés todavía): escucha la palabra en inglés y toca el dibujo correcto.
// Para 8 años: ve el dibujo y elige la palabra en inglés escrita, con botón
// para escuchar la pronunciación. Al acertar, además de la palabra en
// inglés se refuerza diciendo la traducción en español.
const InglesGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { categories: ["animales"], rounds: 5, choices: 3 },
      medio: { categories: ["animales", "frutas"], rounds: 6, choices: 3 },
      dificil: { categories: ["animales", "frutas", "colores"], rounds: 8, choices: 3 }
    },
    "8": {
      facil: { categories: ["animales", "frutas"], rounds: 6, choices: 3 },
      medio: { categories: ["animales", "frutas", "colores"], rounds: 8, choices: 4 },
      dificil: { categories: ["animales", "frutas", "colores", "numeros"], rounds: 10, choices: 4 }
    }
  };

  const VOCAB = {
    animales: [
      { emoji: "🐶", en: "Dog", es: "Perro" },
      { emoji: "🐱", en: "Cat", es: "Gato" },
      { emoji: "🐸", en: "Frog", es: "Rana" },
      { emoji: "🐵", en: "Monkey", es: "Mono" },
      { emoji: "🦊", en: "Fox", es: "Zorro" },
      { emoji: "🐼", en: "Panda", es: "Panda" },
      { emoji: "🐢", en: "Turtle", es: "Tortuga" },
      { emoji: "🦁", en: "Lion", es: "León" }
    ],
    frutas: [
      { emoji: "🍎", en: "Apple", es: "Manzana" },
      { emoji: "🍌", en: "Banana", es: "Plátano" },
      { emoji: "🍇", en: "Grapes", es: "Uvas" },
      { emoji: "🍓", en: "Strawberry", es: "Fresa" },
      { emoji: "🍉", en: "Watermelon", es: "Sandía" },
      { emoji: "🍒", en: "Cherry", es: "Cereza" }
    ],
    colores: [
      { emoji: "🔴", en: "Red", es: "Rojo" },
      { emoji: "🔵", en: "Blue", es: "Azul" },
      { emoji: "🟡", en: "Yellow", es: "Amarillo" },
      { emoji: "🟢", en: "Green", es: "Verde" },
      { emoji: "🟣", en: "Purple", es: "Morado" }
    ],
    numeros: [
      { emoji: "1️⃣", en: "One", es: "Uno" },
      { emoji: "2️⃣", en: "Two", es: "Dos" },
      { emoji: "3️⃣", en: "Three", es: "Tres" },
      { emoji: "4️⃣", en: "Four", es: "Cuatro" },
      { emoji: "5️⃣", en: "Five", es: "Cinco" }
    ]
  };

  let currentWord = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pool(categories) {
    return categories.flatMap((c) => VOCAB[c] || []);
  }

  function pickRound(categories, choiceCount) {
    const all = pool(categories);
    const correct = all[Math.floor(Math.random() * all.length)];
    const distractors = shuffle(all.filter((w) => w.en !== correct.en)).slice(0, choiceCount - 1);
    const options = shuffle([correct, ...distractors]);
    return { correct, options };
  }

  function renderPictureMode(els, round) {
    currentWord = round.correct;
    els.prompt.innerHTML = `<button class="ingles-replay" id="ingles-replay-btn">🔊</button>`;
    els.prompt.querySelector("#ingles-replay-btn").addEventListener("click", () => {
      Speech.speakEnglish(round.correct.en);
    });
    Speech.speakEnglish(round.correct.en);

    els.choices.innerHTML = "";
    els.choices.className = "ingles-choices ingles-choices-pictures";
    round.options.forEach((word) => {
      const btn = document.createElement("button");
      btn.className = "ingles-picture-btn";
      btn.textContent = word.emoji;
      btn.dataset.en = word.en;
      btn.addEventListener("click", () => handleAnswer(btn, word, round.correct, els));
      els.choices.appendChild(btn);
    });
  }

  function renderWordMode(els, round) {
    currentWord = round.correct;
    els.prompt.innerHTML = `<span class="ingles-big-picture">${round.correct.emoji}</span>
      <button class="ingles-replay" id="ingles-replay-btn">🔊</button>`;
    els.prompt.querySelector("#ingles-replay-btn").addEventListener("click", () => {
      Speech.speakEnglish(round.correct.en);
    });
    Speech.speakEnglish(round.correct.en);

    els.choices.innerHTML = "";
    els.choices.className = "ingles-choices ingles-choices-words";
    round.options.forEach((word) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn ingles-word-btn";
      btn.textContent = word.en;
      btn.dataset.en = word.en;
      btn.addEventListener("click", () => handleAnswer(btn, word, round.correct, els));
      els.choices.appendChild(btn);
    });
  }

  function handleAnswer(btn, word, correct, els) {
    if (btn.disabled) return;
    if (word.en === correct.en) {
      els.choices.querySelectorAll("button").forEach((b) => (b.disabled = true));
      btn.classList.add("choice-correct");
      Feedback.hide(els.choices);
      GameAudio.playMatch();
      setTimeout(() => Speech.speak(correct.es, undefined, () => setTimeout(els.onCorrect, 400)), 250);
    } else {
      // dice qué era lo que tocó (en español) y vuelve a sonar la palabra en inglés
      els.errs = (els.errs || 0) + 1;
      btn.disabled = true;
      btn.classList.add("choice-wrong");
      const replay = () => Speech.speakEnglish(correct.en);
      if (els.errs >= 2) {
        const right = Array.from(els.choices.querySelectorAll("button")).find((b) => b.dataset.en === correct.en);
        if (right) right.classList.add("choice-hint");
        Feedback.show(els.choices, "Mira el que brilla", "Esa es la palabra que escuchaste. Escucha otra vez.", replay);
      } else {
        Feedback.show(els.choices, "Casi", `Eso es “${word.en}”, que significa ${word.es.toLowerCase()}. Escucha otra vez la palabra que buscamos.`, replay);
      }
    }
  }

  function start(ageGroup, level, els) {
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    // ganchos opcionales para reutilizarlo dentro de Aventuras
    const rounds = els.rounds || diff.rounds;
    const categories = els.categories || diff.categories;
    const pictureMode = ageGroup === "5";
    let round = 0;
    els.win.classList.add("hidden");

    function updateProgress() {
      els.progress.textContent = `${round} / ${rounds}`;
      if (els.onProgress) els.onProgress(round, rounds);
    }

    function nextRound() {
      if (round >= rounds) {
        finish();
        return;
      }
      round++;
      updateProgress();
      const roundData = pickRound(categories, diff.choices);
      const runtimeEls = { prompt: els.prompt, choices: els.choices, onCorrect: nextRound };
      if (pictureMode) renderPictureMode(runtimeEls, roundData);
      else renderWordMode(runtimeEls, roundData);
    }

    function finish() {
      const stars = 3;
      Storage.addStars("ingles", stars);
      GameAudio.playCelebration();
      els.prompt.innerHTML = "";
      els.choices.innerHTML = "";
      els.progress.textContent = "";
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
      if (els.onComplete) els.onComplete();
      currentWord = null;
    }

    nextRound();
  }

  function speakCurrent() {
    if (currentWord) Speech.speakEnglish(currentWord.en);
  }

  return { start, speakCurrent };
})();
