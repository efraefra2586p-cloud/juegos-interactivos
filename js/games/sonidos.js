// Juego 11: Sonidos. Se "escucha" (voz sintetizada diciendo la onomatopeya,
// ej. "Guau guau") sin ver el nombre, y hay que tocar el dibujo que hace
// ese sonido. Entrena la asociación sonido -> imagen, distinto de Inglés
// (que asocia imagen -> palabra) y de Abecedario (imagen -> letra).
const SonidosGame = (() => {
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

  const SOUNDS = [
    { emoji: "🐶", name: "perro", sound: "Guau guau" },
    { emoji: "🐱", name: "gato", sound: "Miau" },
    { emoji: "🐄", name: "vaca", sound: "Muu" },
    { emoji: "🐷", name: "cerdito", sound: "Oinc oinc" },
    { emoji: "🐸", name: "sapo", sound: "Croac croac" },
    { emoji: "🐑", name: "oveja", sound: "Beee" },
    { emoji: "🐓", name: "gallo", sound: "Kikirikí" },
    { emoji: "🦆", name: "pato", sound: "Cuac cuac" },
    { emoji: "🚗", name: "carro", sound: "Pip pip" },
    { emoji: "🚂", name: "tren", sound: "Chu chu" },
    { emoji: "🔔", name: "campana", sound: "Din don" },
    { emoji: "⏰", name: "reloj", sound: "Tic tac" },
    { emoji: "🐝", name: "abeja", sound: "Bzzzz" },
    { emoji: "🦁", name: "león", sound: "Roooar" }
  ];

  let currentSound = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickRound(choiceCount) {
    const correct = SOUNDS[Math.floor(Math.random() * SOUNDS.length)];
    const distractors = shuffle(SOUNDS.filter((s) => s.name !== correct.name)).slice(0, choiceCount - 1);
    const options = shuffle([correct, ...distractors]);
    return { correct, options };
  }

  function start(ageGroup, level, els) {
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    let round = 0;
    els.win.classList.add("hidden");

    function updateProgress() {
      els.progress.textContent = `${round} / ${diff.rounds}`;
    }

    function nextRound() {
      if (round >= diff.rounds) {
        finish();
        return;
      }
      round++;
      updateProgress();
      const roundData = pickRound(diff.choices);
      currentSound = roundData.correct;

      els.prompt.innerHTML = `<button class="ingles-replay ingles-replay-big" id="sonidos-replay-btn">🔊</button>`;
      els.prompt.querySelector("#sonidos-replay-btn").addEventListener("click", () => {
        Speech.speak(roundData.correct.sound);
      });
      Speech.speak(roundData.correct.sound);

      els.choices.innerHTML = "";
      els.choices.className = "ingles-choices ingles-choices-pictures";
      roundData.options.forEach((item) => {
        const btn = document.createElement("button");
        btn.className = "ingles-picture-btn";
        btn.textContent = item.emoji;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          if (item.name === roundData.correct.name) {
            els.choices.querySelectorAll("button").forEach((b) => (b.disabled = true));
            btn.classList.add("choice-correct");
            GameAudio.playMatch();
            const praise = `Es un ${roundData.correct.name}`;
            setTimeout(() => Speech.speak(praise, undefined, () => setTimeout(nextRound, 400)), 300);
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
      Storage.addStars("sonidos", stars);
      GameAudio.playCelebration();
      els.prompt.innerHTML = "";
      els.choices.innerHTML = "";
      els.progress.textContent = "";
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
      currentSound = null;
    }

    nextRound();
  }

  function speakCurrent() {
    if (currentSound) Speech.speak(currentSound.sound);
  }

  return { start, speakCurrent };
})();
