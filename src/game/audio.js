let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function playClick() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = 180;
  g.gain.setValueAtTime(0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  o.connect(g); g.connect(c.destination);
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
    o.connect(g); g.connect(c.destination);
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
  o.connect(g); g.connect(c.destination);
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
  o.connect(g); g.connect(c.destination);
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
  o.connect(g); g.connect(c.destination);
  o.start(); o.stop(c.currentTime + 0.35);
}

let rainSource = null;
export function startRain() {
  if (rainSource) return;
  const c = getCtx();
  const bufferSize = c.sampleRate * 2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;

  const g = c.createGain();
  g.gain.value = 0.04;

  src.connect(filter); filter.connect(g); g.connect(c.destination);
  src.start();
  rainSource = { src, g };
}

export function setRainIntensity(v) {
  if (rainSource) rainSource.g.gain.value = 0.02 + v * 0.06;
}

export function stopRain() {
  if (!rainSource) return;
  rainSource.src.stop();
  rainSource = null;
}
