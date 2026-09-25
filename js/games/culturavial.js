// Juego 12: Cultura Vial. Reconocer semáforos, señales y hábitos de
// seguridad al caminar, cruzar la calle o ir en bicicleta/carro.
const CulturaVialGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { rounds: 5 },
      medio: { rounds: 7 },
      dificil: { rounds: 9 }
    },
    "8": {
      facil: { rounds: 6 },
      medio: { rounds: 8 },
      dificil: { rounds: 10 }
    }
  };

  const SCENARIOS = [
    {
      emoji: "🔴",
      text: "El semáforo está en rojo.",
      options: [
        { label: "Detenerse", correct: true },
        { label: "Cruzar rápido" },
        { label: "Correr" }
      ],
      praise: "El rojo siempre significa alto"
    },
    {
      emoji: "🟢",
      text: "El semáforo está en verde.",
      options: [
        { label: "Puedes pasar con cuidado", correct: true },
        { label: "Detenerte" },
        { label: "Cerrar los ojos" }
      ],
      praise: "El verde significa que puedes avanzar"
    },
    {
      emoji: "🟡",
      text: "El semáforo se puso amarillo.",
      options: [
        { label: "Prepararte para detenerte", correct: true },
        { label: "Acelerar" },
        { label: "Tocar la bocina" }
      ],
      praise: "El amarillo avisa que el rojo ya viene"
    },
    {
      emoji: "🚸",
      text: "Vas a cruzar la calle.",
      options: [
        { label: "Mirar a los dos lados antes de cruzar", correct: true },
        { label: "Cruzar sin mirar" },
        { label: "Cruzar corriendo" }
      ],
      praise: "Mirar a los dos lados evita accidentes"
    },
    {
      emoji: "🚴",
      text: "Vas a andar en bicicleta.",
      options: [
        { label: "Usar casco", correct: true },
        { label: "Ir sin casco" },
        { label: "Ir muy rápido" }
      ],
      praise: "El casco protege tu cabeza"
    },
    {
      emoji: "🚗",
      text: "Vas dentro de un carro.",
      options: [
        { label: "Usar el cinturón de seguridad", correct: true },
        { label: "Sacar la mano por la ventana" },
        { label: "Pararte del asiento" }
      ],
      praise: "El cinturón te mantiene seguro"
    },
    {
      emoji: "🛑",
      text: "Ves una señal de PARE.",
      options: [
        { label: "Detenerse completamente", correct: true },
        { label: "Pasar rápido" },
        { label: "Tocar la bocina" }
      ],
      praise: "La señal de PARE siempre se respeta"
    },
    {
      emoji: "🚶",
      text: "Vas caminando por la calle.",
      options: [
        { label: "Caminar por la acera", correct: true },
        { label: "Caminar entre los carros" },
        { label: "Correr por la calle" }
      ],
      praise: "La acera es el lugar seguro para caminar"
    },
    {
      emoji: "🦺",
      text: "Es de noche y vas a caminar afuera.",
      options: [
        { label: "Usar ropa o luces que se vean bien", correct: true },
        { label: "Vestirte todo oscuro" },
        { label: "Correr sin mirar" }
      ],
      praise: "Que te vean bien te mantiene seguro"
    },
    {
      emoji: "🚦",
      text: "Quieres cruzar una calle con mucho tráfico.",
      options: [
        { label: "Usar el paso de peatones", correct: true },
        { label: "Cruzar por cualquier lado" },
        { label: "Cruzar corriendo entre los carros" }
      ],
      praise: "El paso de peatones es el lugar seguro para cruzar"
    }
  ];

  let currentScenario = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function start(ageGroup, level, els) {
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    const deck = shuffle(SCENARIOS);
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
      const scenario = deck[(round - 1) % deck.length];
      currentScenario = scenario;

      els.prompt.innerHTML = `
        <span class="ingles-big-picture">${scenario.emoji}</span>
        <span class="abc-word">${scenario.text}</span>
        <button class="ingles-replay" id="cv-replay-btn">🔊</button>
      `;
      els.prompt.querySelector("#cv-replay-btn").addEventListener("click", () => {
        Speech.speak(scenario.text);
      });
      Speech.speak(scenario.text);

      els.choices.innerHTML = "";
      shuffle(scenario.options).forEach((option) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn cv-option-btn";
        btn.textContent = option.label;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          if (option.correct) {
            els.choices.querySelectorAll("button").forEach((b) => (b.disabled = true));
            btn.classList.add("choice-correct");
            GameAudio.playMatch();
            setTimeout(() => Speech.speak(scenario.praise, undefined, () => setTimeout(nextRound, 400)), 250);
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
      Storage.addStars("culturavial", stars);
      GameAudio.playCelebration();
      els.prompt.innerHTML = "";
      els.choices.innerHTML = "";
      els.progress.textContent = "";
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
      currentScenario = null;
    }

    nextRound();
  }

  function speakCurrent() {
    if (currentScenario) Speech.speak(currentScenario.text);
  }

  return { start, speakCurrent };
})();
