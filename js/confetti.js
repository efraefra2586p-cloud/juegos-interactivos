// Confeti simple en CSS/DOM para las pantallas de victoria de todos los
// juegos. Nada de canvas ni librerías: unos spans con emoji animados.
const Confetti = (() => {
  const PIECES = ["🎉", "⭐", "🎈", "✨", "🎊"];

  function burst(container) {
    if (!container) return;
    const old = container.querySelector(".confetti-layer");
    if (old) old.remove();

    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    const count = 18;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "confetti-piece";
      span.textContent = PIECES[Math.floor(Math.random() * PIECES.length)];
      span.style.left = Math.random() * 100 + "%";
      span.style.animationDelay = Math.random() * 0.4 + "s";
      span.style.animationDuration = 1.4 + Math.random() * 0.8 + "s";
      span.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
      layer.appendChild(span);
    }
    container.appendChild(layer);
    setTimeout(() => layer.remove(), 2400);
  }

  return { burst };
})();
