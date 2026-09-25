// Ayuda de lectura en voz alta para quien todavía no lee bien, y también
// la narración en inglés del juego de vocabulario. Best-effort: si el
// navegador no soporta SpeechSynthesis, o no tiene voz para ese idioma,
// simplemente no suena nada (nunca debe romper la app).
const Speech = (() => {
  // Red de seguridad por si el navegador nunca dispara "end"/"error" (pasa
  // en algunos navegadores/voces): un techo generoso según el largo del
  // texto, para no quedar esperando para siempre.
  function estimateMs(text) {
    return Math.max(1200, text.length * 90);
  }

  // onEnd (opcional) se llama cuando termina de decirse la frase (o de
  // inmediato si no hay soporte de voz) — úsalo para avanzar de ronda DESPUÉS
  // de que termine de hablar, en vez de adivinar un tiempo fijo: adivinar mal
  // corta la frase a la mitad cuando la siguiente ronda llama a speak() de
  // nuevo (speak() cancela cualquier cosa que se esté diciendo).
  function speak(text, lang, onEnd) {
    try {
      if (!("speechSynthesis" in window)) {
        if (onEnd) onEnd();
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang || "es-ES";
      utter.rate = 0.95;
      utter.pitch = 1.1;
      if (onEnd) {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          onEnd();
        };
        utter.addEventListener("end", finish);
        utter.addEventListener("error", finish);
        setTimeout(finish, estimateMs(text) + 1500);
      }
      window.speechSynthesis.speak(utter);
    } catch (e) {
      if (onEnd) onEnd();
    }
  }

  function speakEnglish(text, onEnd) {
    speak(text, "en-US", onEnd);
  }

  return { speak, speakEnglish, estimateMs };
})();
