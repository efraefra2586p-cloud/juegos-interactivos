// Sonidos generados por código (Web Audio API) — nada de archivos externos,
// así todo sigue funcionando sin internet. Solo sonidos positivos: nunca
// hay un sonido de "error" o negativo, a lo sumo un click neutro.
// Volumen maestro ajustable (lo usa el apartado Aventuras) y un ambiente
// suave opcional para el rincón tranquilo.
const GameAudio = (() => {
  let ctx = null;
  let masterVolume = 1;
  let ambient = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v));
    if (ambient) ambient.gain.gain.value = 0.05 * masterVolume;
  }

  function tone(freq, startTime, duration, type = "sine", peakGain = 0.2) {
    const audioCtx = getCtx();
    if (!audioCtx || masterVolume <= 0) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain * masterVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function playClick() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    tone(500, audioCtx.currentTime, 0.08, "triangle", 0.12);
  }

  function playMatch() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    tone(660, now, 0.15, "sine", 0.2);
    tone(880, now + 0.08, 0.18, "sine", 0.2);
  }

  function playNeutralFlip() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    tone(380, audioCtx.currentTime, 0.09, "sine", 0.1);
  }

  function playCelebration() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => tone(freq, now + i * 0.12, 0.25, "triangle", 0.22));
  }

  // Nota suave con una altura dada (juegos de secuencia / memoria)
  function playNote(freq, dur) {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    tone(freq, audioCtx.currentTime, dur || 0.45, "sine", 0.18);
  }

  // Campanita muy suave (para "listo", cambio de actividad, calma)
  function playSoftBell() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    tone(523.25, now, 0.9, "sine", 0.1);
    tone(783.99, now + 0.05, 0.9, "sine", 0.06);
  }

  // Ambiente tranquilo: acorde suave y constante, sin pulsos ni destellos.
  function startAmbient() {
    const audioCtx = getCtx();
    if (!audioCtx || ambient) return;
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.connect(audioCtx.destination);
    const oscs = [261.63, 329.63, 392.0].map((f) => {
      const o = audioCtx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      return o;
    });
    gain.gain.linearRampToValueAtTime(0.05 * masterVolume, audioCtx.currentTime + 2);
    ambient = { gain, oscs };
  }

  function stopAmbient() {
    if (!ambient || !ctx) return;
    const { gain, oscs } = ambient;
    ambient = null;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    setTimeout(() => oscs.forEach((o) => { try { o.stop(); } catch (e) { /* ya detenido */ } }), 1200);
  }

  return { playClick, playMatch, playNeutralFlip, playCelebration, playSoftBell, playNote, startAmbient, stopAmbient, setVolume };
})();
