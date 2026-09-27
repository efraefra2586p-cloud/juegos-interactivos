// Juego 12: Cultura Vial. Reconocer semáforos, señales y hábitos de
// seguridad al caminar, cruzar la calle o ir en bicicleta/carro. Si se
// elige una opción peligrosa, un mensaje amable explica POR QUÉ lo es
// (`why`) y se invita a intentar de nuevo.
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
        { label: "Cruzar rápido", why: "Con el semáforo en rojo para peatones, los carros avanzan. Es muy peligroso." },
        { label: "Correr", why: "Correr con el rojo también es peligroso. Hay que esperar." }
      ],
      praise: "El rojo siempre significa alto"
    },
    {
      emoji: "🟢",
      text: "El semáforo está en verde.",
      options: [
        { label: "Puedes pasar con cuidado", correct: true },
        { label: "Detenerte", why: "El verde significa que puedes avanzar, siempre mirando con cuidado." },
        { label: "Cerrar los ojos", why: "Nunca cierres los ojos al cruzar. Hay que mirar siempre." }
      ],
      praise: "El verde significa que puedes avanzar"
    },
    {
      emoji: "🟡",
      text: "El semáforo se puso amarillo.",
      options: [
        { label: "Prepararte para detenerte", correct: true },
        { label: "Acelerar", why: "El amarillo avisa que viene el rojo. Acelerar es peligroso." },
        { label: "Tocar la bocina", why: "La bocina no cambia el semáforo. Lo correcto es prepararse para parar." }
      ],
      praise: "El amarillo avisa que el rojo ya viene"
    },
    {
      emoji: "🚸",
      text: "Vas a cruzar la calle.",
      options: [
        { label: "Mirar a los dos lados antes de cruzar", correct: true },
        { label: "Cruzar sin mirar", why: "Siempre hay que mirar, por si viene un carro que no se ve." },
        { label: "Cruzar corriendo", why: "Correr puede hacerte caer. Cruza caminando y mirando." }
      ],
      praise: "Mirar a los dos lados evita accidentes"
    },
    {
      emoji: "🚴",
      text: "Vas a andar en bicicleta.",
      options: [
        { label: "Usar casco", correct: true },
        { label: "Ir sin casco", why: "Si te caes, el casco protege tu cabeza." },
        { label: "Ir muy rápido", why: "Ir muy rápido aumenta el riesgo de caerte. Ve con calma." }
      ],
      praise: "El casco protege tu cabeza"
    },
    {
      emoji: "🚗",
      text: "Vas dentro de un carro.",
      options: [
        { label: "Usar el cinturón de seguridad", correct: true },
        { label: "Sacar la mano por la ventana", why: "Tu mano puede lastimarse con otro vehículo o un objeto." },
        { label: "Pararte del asiento", why: "Si el carro frena de golpe, te puedes golpear. Ve sentado y con cinturón." }
      ],
      praise: "El cinturón te mantiene seguro"
    },
    {
      emoji: "🛑",
      text: "Ves una señal de PARE.",
      options: [
        { label: "Detenerse completamente", correct: true },
        { label: "Pasar rápido", why: "PARE significa detenerse por completo, no solo bajar la velocidad." },
        { label: "Tocar la bocina", why: "La bocina no reemplaza detenerse. Primero se frena." }
      ],
      praise: "La señal de PARE siempre se respeta"
    },
    {
      emoji: "🚶",
      text: "Vas caminando por la calle.",
      options: [
        { label: "Caminar por la acera", correct: true },
        { label: "Caminar entre los carros", why: "Entre los carros no te ven. La acera es el lugar seguro." },
        { label: "Correr por la calle", why: "La calle es para los carros. Los peatones vamos por la acera." }
      ],
      praise: "La acera es el lugar seguro para caminar"
    },
    {
      emoji: "🦺",
      text: "Es de noche y vas a caminar afuera.",
      options: [
        { label: "Usar ropa o luces que se vean bien", correct: true },
        { label: "Vestirte todo oscuro", why: "De noche, con ropa oscura los conductores no te ven bien." },
        { label: "Correr sin mirar", why: "De noche hay que ir aún más atento, no distraído." }
      ],
      praise: "Que te vean bien te mantiene seguro"
    },
    {
      emoji: "🚦",
      text: "Quieres cruzar una calle con mucho tráfico.",
      options: [
        { label: "Usar el paso de peatones", correct: true },
        { label: "Cruzar por cualquier lado", why: "Los conductores no esperan que cruces ahí y no alcanzan a frenar." },
        { label: "Cruzar corriendo entre los carros", why: "Es muy peligroso. Siempre usa el paso de peatones." }
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
      Feedback.hide(els.choices);

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
      let wrongCount = 0;
      shuffle(scenario.options).forEach((option) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn cv-option-btn";
        btn.textContent = option.label;
        if (option.correct) btn.dataset.correct = "1";
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
            "Esa opción no es segura.",
            wrongCount >= 2 ? `${option.why} Toca la opción que brilla.` : `${option.why} Inténtalo otra vez.`
          );
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
