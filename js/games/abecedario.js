// Juego 9: Abecedario. Asocia cada letra con una palabra e imagen conocida
// (ej. "A de Avión"). Se escucha/ve la palabra y hay que tocar la letra con
// la que empieza. Para 8 años además se muestra el texto de la palabra.
const AbecedarioGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { rounds: 5, choices: 3 },
      medio: { rounds: 6, choices: 3 },
      dificil: { rounds: 7, choices: 4 }
    },
    "8": {
      facil: { rounds: 6, choices: 3 },
      medio: { rounds: 8, choices: 4 },
      dificil: { rounds: 10, choices: 4 }
    }
  };

  const ALPHABET = [
    { letter: "A", word: "Avión", emoji: "✈️" },
    { letter: "B", word: "Barco", emoji: "🚢" },
    { letter: "C", word: "Casa", emoji: "🏠" },
    { letter: "D", word: "Dado", emoji: "🎲" },
    { letter: "E", word: "Elefante", emoji: "🐘" },
    { letter: "F", word: "Flor", emoji: "🌸" },
    { letter: "G", word: "Gato", emoji: "🐱" },
    { letter: "H", word: "Helado", emoji: "🍦" },
    { letter: "I", word: "Iglesia", emoji: "⛪" },
    { letter: "J", word: "Jirafa", emoji: "🦒" },
    { letter: "K", word: "Koala", emoji: "🐨" },
    { letter: "L", word: "Luna", emoji: "🌙" },
    { letter: "M", word: "Mono", emoji: "🐵" },
    { letter: "N", word: "Nube", emoji: "☁️" },
    { letter: "O", word: "Oso", emoji: "🐻" },
    { letter: "P", word: "Pato", emoji: "🦆" },
    { letter: "Q", word: "Queso", emoji: "🧀" },
    { letter: "R", word: "Ratón", emoji: "🐭" },
    { letter: "S", word: "Sol", emoji: "☀️" },
    { letter: "T", word: "Tren", emoji: "🚂" },
    { letter: "U", word: "Uva", emoji: "🍇" },
    { letter: "V", word: "Vaca", emoji: "🐮" },
    { letter: "Y", word: "Yoyo", emoji: "🪀" },
    { letter: "Z", word: "Zapato", emoji: "👟" }
  ];

  let currentEntry = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickRound(choiceCount) {
    const correct = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    const distractors = shuffle(ALPHABET.filter((e) => e.letter !== correct.letter)).slice(0, choiceCount - 1);
    const options = shuffle([correct, ...distractors]);
    return { correct, options };
  }

  function start(ageGroup, level, els) {
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    const showWord = ageGroup === "8";
    let round = 0;
    els.win.classList.add("hidden");

    function updateProgress() {
      els.progress.textContent = `${round} / ${diff.rounds}`;
    }

    function speakRoundPrompt(word) {
      Speech.speak(`¿Con qué letra empieza ${word}?`);
    }

    function nextRound() {
      if (round >= diff.rounds) {
        finish();
        return;
      }
      round++;
      updateProgress();
      const roundData = pickRound(diff.choices);
      currentEntry = roundData.correct;

      els.prompt.innerHTML = `
        <span class="abc-instruction">¿Con qué letra empieza...?</span>
        <span class="abc-picture">${roundData.correct.emoji}</span>
        ${showWord ? `<span class="abc-word">${roundData.correct.word}</span>` : ""}
        <button class="ingles-replay" id="abc-replay-btn">🔊</button>
      `;
      els.prompt.querySelector("#abc-replay-btn").addEventListener("click", () => {
        speakRoundPrompt(roundData.correct.word);
      });
      speakRoundPrompt(roundData.correct.word);

      els.choices.innerHTML = "";
      roundData.options.forEach((entry) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn abc-letter-btn";
        btn.textContent = entry.letter;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          if (entry.letter === roundData.correct.letter) {
            els.choices.querySelectorAll("button").forEach((b) => (b.disabled = true));
            btn.classList.add("choice-correct");
            GameAudio.playMatch();
            setTimeout(nextRound, 700);
          } else {
            GameAudio.playClick();
            btn.classList.add("choice-shake");
            setTimeout(() => btn.classList.remove("choice-shake"), 400);
          }
        });
        els.choices.appendChild(btn);
      });
    }

    function finish() {
      const stars = 3;
      Storage.addStars("abecedario", stars);
      GameAudio.playCelebration();
      els.prompt.innerHTML = "";
      els.choices.innerHTML = "";
      els.progress.textContent = "";
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
      currentEntry = null;
    }

    nextRound();
  }

  function speakCurrent() {
    if (currentEntry) Speech.speak(`¿Con qué letra empieza ${currentEntry.word}?`);
  }

  return { start, speakCurrent };
})();
