// Juego 10: Buen Corazón. Escenarios cortos de valores: buenos modales,
// ayudar al prójimo, agradecer, respeto, limpieza y gratitud a Dios.
// Se lee/escucha la situación y se elige la mejor reacción entre 3
// opciones. Nunca se marca una opción como "mala": la que no es la mejor
// solo invita a intentar de nuevo, igual que en el resto de los juegos.
const BuenCorazonGame = (() => {
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
      emoji: "🤕",
      text: "Un amigo se cayó en el patio.",
      options: [
        { emoji: "🤗", label: "Ayudarlo a levantarse", correct: true },
        { emoji: "😐", label: "Seguir jugando" },
        { emoji: "😂", label: "Reírme" }
      ],
      praise: "Ayudar a los demás nos hace buenas personas"
    },
    {
      emoji: "🎁",
      text: "Alguien te da un regalo.",
      options: [
        { emoji: "🙏", label: "Decir gracias", correct: true },
        { emoji: "🤐", label: "No decir nada" },
        { emoji: "😠", label: "Pedir otro regalo" }
      ],
      praise: "Agradecer alegra el corazón de quien te dio algo"
    },
    {
      emoji: "🧸",
      text: "Terminaste de jugar con tus juguetes.",
      options: [
        { emoji: "🧹", label: "Guardarlos en su lugar", correct: true },
        { emoji: "🚪", label: "Dejarlos tirados" },
        { emoji: "😴", label: "Irme a dormir" }
      ],
      praise: "Cuidar tus cosas y tu espacio es parte de ser ordenado"
    },
    {
      emoji: "🚲",
      text: "Quieres jugar con algo que tiene tu hermano.",
      options: [
        { emoji: "🗣️", label: "Pedirlo por favor", correct: true },
        { emoji: "✋", label: "Quitárselo" },
        { emoji: "😭", label: "Llorar muy fuerte" }
      ],
      praise: "Pedir las cosas con respeto es de buenos modales"
    },
    {
      emoji: "🍽️",
      text: "Antes de comer.",
      options: [
        { emoji: "🙏", label: "Dar gracias a Dios por los alimentos", correct: true },
        { emoji: "🍴", label: "Comer sin decir nada" },
        { emoji: "🏃", label: "Salir corriendo" }
      ],
      praise: "Dar gracias a Dios nos ayuda a valorar lo que tenemos"
    },
    {
      emoji: "😢",
      text: "Ves a alguien triste.",
      options: [
        { emoji: "💛", label: "Consolarlo con cariño", correct: true },
        { emoji: "🙈", label: "Ignorarlo" },
        { emoji: "😆", label: "Burlarme" }
      ],
      praise: "Consolar a otros es amar al prójimo"
    },
    {
      emoji: "🎲",
      text: "Es el turno de otro niño en el juego.",
      options: [
        { emoji: "⏳", label: "Esperar mi turno", correct: true },
        { emoji: "🏃", label: "Empujar para pasar primero" },
        { emoji: "😤", label: "Gritar" }
      ],
      praise: "Esperar tu turno es respetar a los demás"
    },
    {
      emoji: "🏺",
      text: "Rompiste algo sin querer.",
      options: [
        { emoji: "🗣️", label: "Decir la verdad y pedir perdón", correct: true },
        { emoji: "🤫", label: "Esconderlo" },
        { emoji: "👉", label: "Decir que fue otro" }
      ],
      praise: "Decir la verdad es de valientes y buenas personas"
    },
    {
      emoji: "📚",
      text: "Un amigo te ayudó con la tarea.",
      options: [
        { emoji: "🙏", label: "Agradecerle su ayuda", correct: true },
        { emoji: "😐", label: "No decir nada" },
        { emoji: "🏃", label: "Irme corriendo" }
      ],
      praise: "Agradecer fortalece la amistad"
    },
    {
      emoji: "🗑️",
      text: "Ves basura tirada en el piso.",
      options: [
        { emoji: "🗑️", label: "Recogerla y botarla", correct: true },
        { emoji: "👣", label: "Pasar de largo" },
        { emoji: "🦶", label: "Patearla" }
      ],
      praise: "Cuidar nuestro lugar es cuidar lo que Dios nos dio"
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
        <button class="ingles-replay" id="bc-replay-btn">🔊</button>
      `;
      els.prompt.querySelector("#bc-replay-btn").addEventListener("click", () => {
        Speech.speak(scenario.text);
      });
      Speech.speak(scenario.text);

      els.choices.innerHTML = "";
      shuffle(scenario.options).forEach((option) => {
        const btn = document.createElement("button");
        btn.className = "bc-option-btn";
        btn.innerHTML = `<span class="bc-option-emoji">${option.emoji}</span><span class="bc-option-label">${option.label}</span>`;
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
      Storage.addStars("buencorazon", stars);
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
