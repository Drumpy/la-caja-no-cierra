let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function bitcrushCurve(steps = 32, samples = 256) {
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}

export function createRetroVoiceChain(c, destination) {
  const input = c.createGain();
  const band = c.createBiquadFilter();
  const low = c.createBiquadFilter();
  const crush = c.createWaveShaper();
  const output = c.createGain();

  input.gain.value = 1.15;
  band.type = "bandpass";
  band.frequency.value = 1700;
  band.Q.value = 0.7;
  low.type = "lowpass";
  low.frequency.value = 5200;
  low.Q.value = 0.4;
  crush.curve = bitcrushCurve();
  output.gain.value = 0.85;

  input.connect(band);
  band.connect(low);
  low.connect(crush);
  crush.connect(output);
  output.connect(destination);
  return input;
}

// Bus de audio: todo pasa por master; sfx y ambient cuelgan de él. Sliders mueven estos.
let bus = null;
function getBus() {
  const c = getCtx();
  if (!bus) {
    const master = c.createGain();
    master.gain.value = 0.8;
    master.connect(c.destination);
    const sfx = c.createGain();
    sfx.gain.value = 1;
    sfx.connect(master);
    const ambient = c.createGain();
    ambient.gain.value = 0.6;
    ambient.connect(master);
    const voice = c.createGain();
    voice.gain.value = 0.9;
    voice.connect(master);
    bus = { master, sfx, ambient, voice };
  }
  return bus;
}

export function setVolume(channel, v) {
  const b = getBus();
  if (b[channel]) b[channel].gain.value = v;
}

export function getVolume(channel) {
  return getBus()[channel]?.gain.value ?? 1;
}

export function playClick() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = 180;
  g.gain.setValueAtTime(0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  o.connect(g); g.connect(getBus().sfx);
  o.start(); o.stop(c.currentTime + 0.06);
}

export function playTicket() {
  const c = getCtx();
  for (let i = 0; i < 4; i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.value = 120 + Math.random() * 40;
    const t = c.currentTime + i * 0.03;
    g.gain.setValueAtTime(0.04, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    o.connect(g); g.connect(getBus().sfx);
    o.start(t); o.stop(t + 0.04);
  }
}

export function playCoin() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(800, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.15);
  g.gain.setValueAtTime(0.06, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  o.connect(g); g.connect(getBus().sfx);
  o.start(); o.stop(c.currentTime + 0.2);
}

export function playError() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = 90;
  g.gain.setValueAtTime(0.06, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  o.connect(g); g.connect(getBus().sfx);
  o.start(); o.stop(c.currentTime + 0.15);
}

export function playCat() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(300, c.currentTime);
  o.frequency.linearRampToValueAtTime(500, c.currentTime + 0.1);
  o.frequency.linearRampToValueAtTime(200, c.currentTime + 0.3);
  g.gain.setValueAtTime(0.03, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
  o.connect(g); g.connect(getBus().sfx);
  o.start(); o.stop(c.currentTime + 0.35);
}

// Carga + decode de un clip mp3, cacheado por URL (rain, thunder, etc.).
const clipCache = new Map();
function loadClip(c, url) {
  if (!clipCache.has(url)) {
    clipCache.set(
      url,
      fetch(url).then((r) => r.arrayBuffer()).then((ab) => c.decodeAudioData(ab)),
    );
  }
  return clipCache.get(url);
}

// Voz de personaje: corta la anterior si sigue sonando, pasa por canal voice.
let voiceSource = null;
export function playVoice(url) {
  const c = getCtx();
  if (voiceSource) {
    try { voiceSource.stop(); } catch {}
    voiceSource = null;
  }
  loadClip(c, url)
    .then((buffer) => {
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.connect(createRetroVoiceChain(c, getBus().voice));
      src.onended = () => { if (voiceSource === src) voiceSource = null; };
      src.start();
      voiceSource = src;
    })
    .catch(() => {});
}

export function isVoicePlaying() {
  return voiceSource !== null;
}

let rainSource = null;
export function startRain() {
  if (rainSource) return;
  const c = getCtx();
  rainSource = { src: null, g: null, gain: 0.34 }; // gain previo al load
  loadClip(c, "/assets/sounds/rain.mp3")
    .then((buffer) => {
      if (!rainSource) return; // se detuvo antes de cargar
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const g = c.createGain();
      g.gain.value = rainSource.gain;
      src.connect(g); g.connect(getBus().ambient);
      src.start();
      rainSource.src = src;
      rainSource.g = g;
    })
    .catch(() => {});
}

export function setRainIntensity(v) {
  if (!rainSource) return;
  const gain = 0.3 + v * 0.4;
  rainSource.gain = gain;
  if (rainSource.g) rainSource.g.gain.value = gain;
}

export function stopRain() {
  if (!rainSource) return;
  if (rainSource.src) rainSource.src.stop();
  rainSource = null;
}

export function playThunder() {
  const c = getCtx();
  loadClip(c, "/assets/sounds/thunder.mp3")
    .then((buffer) => {
      const src = c.createBufferSource();
      src.buffer = buffer;
      const dur = buffer.duration;
      const fade = Math.min(0.8, dur * 0.3); // fade out al final
      const t = c.currentTime;
      const g = c.createGain();
      g.gain.setValueAtTime(0.6, t);
      g.gain.setValueAtTime(0.6, t + dur - fade);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      src.connect(g); g.connect(getBus().ambient);
      src.start(t); src.stop(t + dur + 0.05);
    })
    .catch(() => {});
}
