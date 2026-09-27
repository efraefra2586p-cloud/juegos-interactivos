// Ayuda de lectura en voz alta para quien todavía no lee bien, y también
// la narración en inglés del juego de vocabulario. Best-effort: si el
// navegador no soporta SpeechSynthesis, o no tiene voz para ese idioma,
// simplemente no suena nada (nunca debe romper la app).
const Speech = (() => {
  let volume = 1;
  let rate = 0.95;

  // Voces de español latinoamericano primero. Las de España pronuncian la
  // "c" (ce/ci) como "z", distinto al español de Ecuador, y eso confunde el
  // trabajo con las letras s/c. Si el dispositivo no tiene voz
  // latinoamericana, se usa la que haya.
  const LATAM = ["es-ec", "es-419", "es-mx", "es-us", "es-co", "es-pe", "es-ar", "es-cl", "es-ve"];

  function pickVoice(lang) {
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      if (!lang || !lang.toLowerCase().startsWith("es")) return null;
      const norm = (v) => v.lang.replace("_", "-").toLowerCase();
      for (const code of LATAM) {
        const v = voices.find((x) => norm(x) === code);
        if (v) return v;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function voiceName(lang) {
    const v = pickVoice(lang || "es-419");
    if (v) return `${v.name} (${v.lang})`;
    try {
      const any = (window.speechSynthesis.getVoices() || []).find((x) => x.lang.toLowerCase().startsWith("es"));
      return any ? `${any.name} (${any.lang}) — no es latinoamericana` : "sin voz en español";
    } catch (e) {
      return "sin voz";
    }
  }

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
      if (!("speechSynthesis" in window) || volume <= 0) {
        if (onEnd) onEnd();
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang || "es-419";
      const voice = pickVoice(utter.lang);
      if (voice) utter.voice = voice;
      utter.rate = rate;
      utter.pitch = 1.05;
      utter.volume = volume;
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

  function stop() {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // silencioso a propósito
    }
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
  }

  function setRate(r) {
    rate = Math.max(0.6, Math.min(1.2, r));
  }

  return { speak, speakEnglish, stop, estimateMs, setVolume, setRate, voiceName };
})();
