/* -------------------------
SOUND SYSTEM
Using Web Audio API - no files needed
--------------------------*/
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/* -------------------------
REGISTRATION SUCCESS SOUND
Cheerful ascending chime
--------------------------*/
export function playRegistrationSound() {
  const ctx = getAudioContext();
  const notes = [523, 659, 784, 1047]; // C, E, G, C (major chord arpeggio)

  notes.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.3);

    oscillator.start(ctx.currentTime + i * 0.15);
    oscillator.stop(ctx.currentTime + i * 0.15 + 0.3);
  });
}

/* -------------------------
VOTE SELECT SOUND
Satisfying soft click
--------------------------*/
export function playVoteSound() {
  const ctx = getAudioContext();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.1);

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

/* -------------------------
DONE VOTING SOUND
Triumphant fanfare
--------------------------*/
export function playDoneSound() {
  const ctx = getAudioContext();

  // Fanfare notes - ascending triumphant sequence
  const notes = [
    { freq: 523, time: 0 },    // C
    { freq: 523, time: 0.15 }, // C
    { freq: 784, time: 0.3 },  // G
    { freq: 659, time: 0.45 }, // E
    { freq: 523, time: 0.6 },  // C
    { freq: 784, time: 0.8 },  // G
    { freq: 1047, time: 1.0 }  // High C
  ];

  notes.forEach(note => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + note.time);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + note.time + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + note.time + 0.25);

    oscillator.start(ctx.currentTime + note.time);
    oscillator.stop(ctx.currentTime + note.time + 0.3);
  });
}