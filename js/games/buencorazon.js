// Juego 10: Buen Corazón. Escenarios cortos de valores: buenos modales,
// ayudar al prójimo, agradecer, respeto, limpieza y gratitud a Dios.
// Se lee/escucha la situación y se elige la mejor reacción entre 3
// opciones. Si se elige una que no es la mejor, un mensaje amable explica
// POR QUÉ no lo es (`why`) y se invita a intentar de nuevo; no hay sonido
// de error ni se pierden estrellas.
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
        { emoji: "😐", label: "Seguir jugando", why: "Tu amigo se lastimó y necesita ayuda. Si sigues jugando, se queda solo." },
        { emoji: "😂", label: "Reírme", why: "Reírse puede lastimar sus sentimientos, además del golpe." }
      ],
      praise: "Ayudar a los demás nos hace buenas personas"
    },
    {
      emoji: "🎁",
      text: "Alguien te da un regalo.",
      options: [
        { emoji: "🙏", label: "Decir gracias", correct: true },
        { emoji: "🤐", label: "No decir nada", why: "Decir gracias muestra que valoras lo que hicieron por ti." },
        { emoji: "😠", label: "Pedir otro regalo", why: "Pedir más no es agradecido. Se agradece lo que nos dan." }
      ],
      praise: "Agradecer alegra el corazón de quien te dio algo"
    },
    {
      emoji: "🧸",
      text: "Terminaste de jugar con tus juguetes.",
      options: [
        { emoji: "🧹", label: "Guardarlos en su lugar", correct: true },
        { emoji: "🚪", label: "Dejarlos tirados", why: "Si quedan tirados, alguien puede tropezar y se pueden dañar." },
        { emoji: "😴", label: "Irme a dormir", why: "Primero hay que ordenar. Así mañana los encuentras fácil." }
      ],
      praise: "Cuidar tus cosas y tu espacio es parte de ser ordenado"
    },
    {
      emoji: "🚲",
      text: "Quieres jugar con algo que tiene tu hermano.",
      options: [
        { emoji: "🗣️", label: "Pedirlo por favor", correct: true },
        { emoji: "✋", label: "Quitárselo", why: "Quitar las cosas lastima y causa peleas." },
        { emoji: "😭", label: "Llorar muy fuerte", why: "Llorar no hace que te lo presten. Pedir con cariño sí ayuda." }
      ],
      praise: "Pedir las cosas con respeto es de buenos modales"
    },
    {
      emoji: "🍽️",
      text: "Antes de comer.",
      options: [
        { emoji: "🙏", label: "Dar gracias a Dios por los alimentos", correct: true },
        { emoji: "🍴", label: "Comer sin decir nada", why: "Antes de comer damos gracias a Dios y a quienes prepararon la comida." },
        { emoji: "🏃", label: "Salir corriendo", why: "Es mejor comer sentados y con calma, dando gracias." }
      ],
      praise: "Dar gracias a Dios nos ayuda a valorar lo que tenemos"
    },
    {
      emoji: "😢",
      text: "Ves a alguien triste.",
      options: [
        { emoji: "💛", label: "Consolarlo con cariño", correct: true },
        { emoji: "🙈", label: "Ignorarlo", why: "Ignorar deja solo a quien está triste. Un poco de cariño ayuda mucho." },
        { emoji: "😆", label: "Burlarme", why: "Burlarse lastima. Consolar sana el corazón." }
      ],
      praise: "Consolar a otros es amar al prójimo"
    },
    {
      emoji: "🎲",
      text: "Es el turno de otro niño en el juego.",
      options: [
        { emoji: "⏳", label: "Esperar mi turno", correct: true },
        { emoji: "🏃", label: "Empujar para pasar primero", why: "Empujar es una falta de respeto y puede lastimar a alguien." },
        { emoji: "😤", label: "Gritar", why: "Gritar no ayuda a que llegue tu turno. Esperar con paciencia sí." }
      ],
      praise: "Esperar tu turno es respetar a los demás"
    },
    {
      emoji: "🏺",
      text: "Rompiste algo sin querer.",
      options: [
        { emoji: "🗣️", label: "Decir la verdad y pedir perdón", correct: true },
        { emoji: "🤫", label: "Esconderlo", why: "Esconderlo es engañar. Decir la verdad es lo correcto, aunque cueste." },
        { emoji: "👉", label: "Decir que fue otro", why: "Culpar a otro es injusto y le puede causar problemas." }
      ],
      praise: "Decir la verdad es de valientes y buenas personas"
    },
    {
      emoji: "📚",
      text: "Un amigo te ayudó con la tarea.",
      options: [
        { emoji: "🙏", label: "Agradecerle su ayuda", correct: true },
        { emoji: "😐", label: "No decir nada", why: "Un gracias hace feliz a quien te ayudó." },
        { emoji: "🏃", label: "Irme corriendo", why: "Antes de irte, es bueno agradecer a quien te ayudó." }
      ],
      praise: "Agradecer fortalece la amistad"
    },
    {
      emoji: "🗑️",
      text: "Ves basura tirada en el piso.",
      options: [
        { emoji: "🗑️", label: "Recogerla y botarla", correct: true },
        { emoji: "👣", label: "Pasar de largo", why: "Si todos pasan de largo, el lugar seguirá sucio." },
        { emoji: "🦶", label: "Patearla", why: "Patearla la esparce más. Hay que botarla en su lugar." }
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
      Feedback.hide(els.choices);

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
      let wrongCount = 0;
      shuffle(scenario.options).forEach((option) => {
        const btn = document.createElement("button");
        btn.className = "bc-option-btn";
        btn.innerHTML = `<span class="bc-option-emoji">${option.emoji}</span><span class="bc-option-label">${option.label}</span>`;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          if (option.correct) {
            els.choices.querySelectorAll("button").forEach((b) => (b.disabled = true));
            btn.classList.remove("choice-hint");
            btn.classList.add("choice-correct");
            Feedback.hide(els.choices);
            GameAudio.playMatch();
            setTimeout(() => Speech.speak(scenario.praise, undefined, () => setTimeout(nextRound, 400)), 250);
            return;
          }
          wrongCount++;
          GameAudio.playClick();
          btn.disabled = true;
          btn.classList.add("choice-wrong");
          const goodBtn = Array.from(els.choices.children).find((b) => b.dataset.correct === "1");
          if (wrongCount >= 2 && goodBtn) goodBtn.classList.add("choice-hint");
          Feedback.show(
            els.choices,
            "Esa no es la mejor opción.",
            wrongCount >= 2
              ? `${option.why} La mejor es la que brilla: piensa cómo actuaría alguien con buen corazón.`
              : `${option.why} Piensa qué haría alguien con buen corazón e inténtalo otra vez.`
          );
        });
        if (option.correct) btn.dataset.correct = "1";
        els.choices.appendChild(btn);
      });
    }

    function finish() {
      const stars = 3;
      Storage.addStars("buencorazon", stars);
      GameAudio.playCelebration();
      els.prompt.innerHTML = "";
      els.choices.innerHTML = "";
      Feedback.hide(els.choices);
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
