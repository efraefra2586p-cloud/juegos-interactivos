// Sonidos generados por código (Web Audio API) — nada de archivos externos,
// así todo sigue funcionando sin internet. Solo sonidos positivos: nunca
// hay un sonido de "error" o negativo, a lo sumo un click neutro.
const GameAudio = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, startTime, duration, type = "sine", peakGain = 0.2) {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
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

  return { playClick, playMatch, playNeutralFlip, playCelebration };
})();
