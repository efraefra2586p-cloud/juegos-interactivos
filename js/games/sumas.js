// Juego 2: Sumas y Restas. Dibujos/objetos para 5 años, numeros para 8 años.
// Dificultad según perfil (edad) + nivel elegido.
const SumasGame = (() => {
  const DIFFICULTY = {
    "5": {
      facil: { maxResult: 5, useObjects: true, rounds: 5, operations: ["+"] },
      medio: { maxResult: 8, useObjects: true, rounds: 6, operations: ["+"] },
      dificil: { maxResult: 10, useObjects: true, rounds: 7, operations: ["+", "-"] }
    },
    "8": {
      facil: { maxResult: 10, useObjects: false, rounds: 6, operations: ["+", "-"] },
      medio: { maxResult: 20, useObjects: false, rounds: 8, operations: ["+", "-"] },
      dificil: { maxResult: 100, useObjects: false, rounds: 10, operations: ["+", "-", "×"], maxFactor: 10 }
    }
  };

  const OBJECT_EMOJI = "🍎";

  let currentSpokenText = "";

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateProblem(diff) {
    const op = diff.operations[rand(0, diff.operations.length - 1)];
    let a, b, answer;
    if (op === "×") {
      a = rand(1, diff.maxFactor);
      b = rand(1, diff.maxFactor);
      answer = a * b;
    } else if (op === "+") {
      a = rand(0, diff.maxResult);
      b = rand(0, diff.maxResult - a);
      answer = a + b;
    } else {
      a = rand(1, diff.maxResult);
      b = rand(0, a);
      answer = a - b;
    }
    return { op, a, b, answer };
  }

  function effectiveMax(diff, problem) {
    if (problem.op === "×") return diff.maxFactor * diff.maxFactor;
    return diff.maxResult;
  }

  function generateChoices(answer, maxValue) {
    const spread = Math.max(3, Math.round(maxValue * 0.15));
    const choices = new Set([answer]);
    let guard = 0;
    while (choices.size < 3 && guard < 40) {
      guard++;
      const delta = rand(-spread, spread);
      const candidate = answer + delta;
      if (candidate >= 0 && candidate <= maxValue) choices.add(candidate);
    }
    while (choices.size < 3) choices.add(rand(0, maxValue));
    return shuffle([...choices]);
  }

  function renderGroup(count) {
    if (count === 0) return `<span class="sumas-zero">0</span>`;
    let out = "";
    for (let i = 0; i < count; i++) out += `<span class="sumas-item">${OBJECT_EMOJI}</span>`;
    return out;
  }

  function renderSubtractObjects(a, b) {
    let out = "";
    for (let i = 0; i < a; i++) {
      const removed = i >= a - b;
      out += `<span class="sumas-item${removed ? " removed" : ""}">${OBJECT_EMOJI}</span>`;
    }
    return out;
  }

  function renderProblem(elProblem, diff, problem) {
    elProblem.innerHTML = "";
    if (diff.useObjects) {
      const wrap = document.createElement("div");
      wrap.className = "sumas-objects";
      if (problem.op === "+") {
        wrap.innerHTML = `
          <span class="sumas-group">${renderGroup(problem.a)}</span>
          <span class="sumas-op">${problem.op}</span>
          <span class="sumas-group">${renderGroup(problem.b)}</span>
          <span class="sumas-op">=</span>
          <span class="sumas-op">❓</span>
        `;
      } else {
        wrap.innerHTML = `
          <span class="sumas-group">${renderSubtractObjects(problem.a, problem.b)}</span>
          <span class="sumas-op">=</span>
          <span class="sumas-op">❓</span>
        `;
      }
      elProblem.appendChild(wrap);
    } else {
      const eq = document.createElement("div");
      eq.className = "sumas-equation";
      eq.textContent = `${problem.a} ${problem.op} ${problem.b} = ?`;
      elProblem.appendChild(eq);
    }
    const opWord = problem.op === "+" ? "más" : problem.op === "-" ? "menos" : "por";
    currentSpokenText = `¿Cuánto es ${problem.a} ${opWord} ${problem.b}?`;
  }

  // Cómo se resuelve, sin dar el resultado (para la primera pista).
  function strategyText(problem, useObjects) {
    if (problem.op === "+") {
      return useObjects
        ? "Cuenta todas las manzanas juntas."
        : `Empieza en ${problem.a} y cuenta ${problem.b} más.`;
    }
    if (problem.op === "-") {
      return useObjects
        ? "Cuenta solo las manzanas que NO están tachadas."
        : `Empieza en ${problem.a} y quita ${problem.b}.`;
    }
    return `${problem.a} por ${problem.b} es sumar el ${problem.b}, ${problem.a} veces.`;
  }

  function solutionText(problem) {
    const opWord = problem.op === "+" ? "más" : problem.op === "-" ? "menos" : "por";
    return `${problem.a} ${opWord} ${problem.b} es ${problem.answer}.`;
  }

  function renderChoices(elChoices, choices, problem, useObjects, onCorrect) {
    elChoices.innerHTML = "";
    Feedback.hide(elChoices);
    let wrongCount = 0;
    choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        if (choice === problem.answer) {
          elChoices.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = true));
          btn.classList.remove("choice-hint");
          btn.classList.add("choice-correct");
          Feedback.hide(elChoices);
          GameAudio.playMatch();
          setTimeout(onCorrect, 450);
          return;
        }
        wrongCount++;
        GameAudio.playClick();
        btn.disabled = true;
        btn.classList.add("choice-wrong");
        if (wrongCount === 1) {
          const direction = choice > problem.answer ? "grande" : "pequeña";
          Feedback.show(elChoices, `No es ${choice}.`, `Esa respuesta es muy ${direction}. ${strategyText(problem, useObjects)} ¡Inténtalo otra vez!`);
        } else {
          const correctBtn = Array.from(elChoices.children).find((b) => Number(b.textContent) === problem.answer);
          if (correctBtn) correctBtn.classList.add("choice-hint");
          Feedback.show(elChoices, `Tampoco es ${choice}.`, `${solutionText(problem)} Toca la respuesta que brilla.`);
        }
      });
      elChoices.appendChild(btn);
    });
  }

  function start(ageGroup, level, els) {
    const byProfile = DIFFICULTY[ageGroup] || DIFFICULTY["5"];
    const diff = byProfile[level] || byProfile.medio;
    // ganchos opcionales para reutilizarlo dentro de Aventuras
    const rounds = els.rounds || diff.rounds;
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
      const problem = generateProblem(diff);
      renderProblem(els.problem, diff, problem);
      const choices = generateChoices(problem.answer, effectiveMax(diff, problem));
      renderChoices(els.choices, choices, problem, diff.useObjects, nextRound);
    }

    function finish() {
      const stars = 3;
      Storage.addStars("sumas", stars);
      GameAudio.playCelebration();
      els.problem.innerHTML = "";
      els.choices.innerHTML = "";
      Feedback.hide(els.choices);
      els.progress.textContent = "";
      els.winStars.textContent = "⭐".repeat(stars);
      els.win.classList.remove("hidden");
      Confetti.burst(els.win);
      if (els.onComplete) els.onComplete();
      currentSpokenText = "";
    }

    nextRound();
  }

  function speakCurrent() {
    if (currentSpokenText) Speech.speak(currentSpokenText);
  }

  return { start, speakCurrent };
})();
