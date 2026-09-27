// Mensaje de guía que aparece bajo las opciones cuando el jugador elige una
// respuesta que no es la mejor. Objetivo: que APRENDA por qué no era, no
// solo que pruebe hasta acertar. Tono amable, sin sonido de error ni
// penalización (las estrellas no bajan).
const Feedback = (() => {
  function ensureBox(choicesEl) {
    let box = choicesEl.parentElement.querySelector(".feedback-box[data-for='" + choicesEl.id + "']");
    if (!box) {
      box = document.createElement("div");
      box.className = "feedback-box hidden";
      box.dataset.for = choicesEl.id;
      choicesEl.insertAdjacentElement("afterend", box);
    }
    return box;
  }

  // title: frase corta ("Casi..."), detail: la explicación.
  // onEnd (opcional): se llama cuando termina de decirse el mensaje (útil para
  // repetir después una palabra en inglés o un sonido, ya con la voz libre).
  function show(choicesEl, title, detail, onEnd) {
    const box = ensureBox(choicesEl);
    box.innerHTML = `<span class="feedback-title">🤔 ${title}</span><span class="feedback-detail">${detail}</span>`;
    box.classList.remove("hidden");
    Speech.speak(`${title} ${detail}`, undefined, onEnd);
  }

  function hide(choicesEl) {
    ensureBox(choicesEl).classList.add("hidden");
  }

  return { show, hide };
})();
