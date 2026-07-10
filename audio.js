/* ============================================================================
   Echoes of the Aether Crystal — Audio (Agent E)
   All sound is synthesized with the Web Audio API — no external files.
   Exposes window.GameAudio. Must be unlocked by a user gesture (autoplay).
   ========================================================================== */
'use strict';
window.GameAudio = (function () {
  let ctx = null, master, sfxGain, musicGain, noiseBuf = null;
  let muted = false, musicOn = true, seqTimer = null, step = 0, unlocked = false;

  function makeNoise() {
    const len = ctx.sampleRate * 0.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    makeNoise();
    if (musicOn) startMusic();
  }

  // unlock on first gesture
  function unlock() {
    if (unlocked) return;
    init();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    unlocked = true;
    if (musicOn) rampMusic(0.20);
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, hp) {
    if (!ctx || muted || !noiseBuf) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const g = ctx.createGain(); const f = ctx.createBiquadFilter();
    f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 1200;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t); src.stop(t + dur);
  }

  // ---- sound effects -------------------------------------------------------
  const sfx = {
    shoot()     { tone(680, 0.09, 'square', 0.10, 300); },
    slash()     { tone(420, 0.10, 'sawtooth', 0.12, 130); noise(0.06, 0.05, 3000); },
    arrow()     { tone(900, 0.07, 'triangle', 0.08, 500); },
    hit()       { noise(0.05, 0.06, 2500); },
    ice()       { tone(1000, 0.28, 'sine', 0.12, 520); tone(1500, 0.28, 'sine', 0.05, 900); },
    explosion() { noise(0.35, 0.22); tone(140, 0.32, 'sine', 0.18, 50); },
    lightning() { noise(0.18, 0.14, 4000); tone(260, 0.14, 'square', 0.10, 900); },
    upgrade()   { tone(520, 0.09, 'square', 0.10); setTimeout(() => tone(780, 0.12, 'square', 0.10), 70); },
    wave()      { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.10), i * 80)); },
    boss()      { tone(90, 0.6, 'sawtooth', 0.18, 60); tone(180, 0.6, 'square', 0.06, 120); },
    prestige()  { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sine', 0.12), i * 110)); },
    heal()      { tone(660, 0.25, 'sine', 0.09, 990); },
  };

  // ---- background music: gentle looping minor arpeggio + pad ---------------
  // A minor pentatonic-ish loop; one note every ~0.28s.
  const MELODY = [220, 262, 294, 330, 392, 330, 294, 262,
                  220, 294, 330, 392, 440, 392, 330, 294];
  const BASS   = [110, 110, 146, 146, 164, 164, 130, 130];

  function playMusicNote(freq, dur, vol, type) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function startMusic() {
    if (seqTimer) return;
    seqTimer = setInterval(() => {
      if (!ctx || muted || !musicOn) return;
      playMusicNote(MELODY[step % MELODY.length], 0.32, 0.12, 'triangle');
      if (step % 2 === 0) playMusicNote(BASS[(step >> 1) % BASS.length], 0.5, 0.10, 'sine');
      step++;
    }, 280);
  }

  function rampMusic(to) {
    if (!ctx) return;
    musicGain.gain.linearRampToValueAtTime(to, ctx.currentTime + 0.8);
  }

  function toggleMute() {
    muted = !muted;
    if (ctx) master.gain.value = muted ? 0 : 0.85;
    return muted;
  }
  function toggleMusic() {
    musicOn = !musicOn;
    if (ctx) rampMusic(musicOn ? 0.20 : 0.0);
    return musicOn;
  }

  return {
    unlock, sfx, toggleMute, toggleMusic,
    isMuted: () => muted, isMusicOn: () => musicOn,
  };
})();
