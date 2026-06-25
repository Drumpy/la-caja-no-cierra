import * as pc from "playcanvas";

// Filtro retro: VHS / PS1 / analog-horror en un solo pase fullscreen.
// PS1: pixelado a baja resolución + cuantización de color con dither (banding).
// VHS: aberración cromática, bamboleo horizontal + ráfagas de tracking, scanlines, grano.
// Analog horror: viñeta. Todo tuneable vía opts (ver applyRetroFilter).
const FRAG = /* glsl */ `
uniform sampler2D uColorBuffer;
uniform vec2 uResolution;
uniform float uTime;
uniform float uPixel;       // líneas verticales del pixelado (PS1)
uniform float uAberration;  // separación cromática
uniform float uScanline;    // intensidad de scanlines
uniform float uNoise;       // grano
uniform float uVignette;    // oscurecido en bordes
uniform float uColorBits;   // niveles por canal (banding PS1)
uniform float uWobble;      // multiplicador de bamboleo/tracking VHS
varying vec2 vUv0;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv0;

  // --- PS1: snap a grilla de baja resolución ---
  float aspect = uResolution.x / uResolution.y;
  vec2 grid = vec2(uPixel * aspect, uPixel);
  vec2 puv = floor(uv * grid) / grid;

  // --- VHS: bamboleo horizontal + ráfagas de tracking ---
  float wob = sin(puv.y * 80.0 + uTime * 3.0) * 0.0015
            + sin(puv.y * 13.0 - uTime * 1.7) * 0.0015;
  float track = step(0.985, hash(vec2(floor(uTime * 6.0), floor(puv.y * 40.0)))) * 0.02;
  puv.x += (wob + track) * uWobble;

  // --- Aberración cromática (más fuerte hacia los bordes) ---
  float edge = length(uv - 0.5);
  float ab = uAberration * (0.5 + edge);
  float r = texture2D(uColorBuffer, vec2(puv.x + ab, puv.y)).r;
  float g = texture2D(uColorBuffer, puv).g;
  float b = texture2D(uColorBuffer, vec2(puv.x - ab, puv.y)).b;
  vec3 col = vec3(r, g, b);

  // --- Cuantización de color + dither (banding PS1) ---
  float d = hash(floor(uv * uResolution)) - 0.5;
  col = floor(col * uColorBits + 0.5 + d * 0.6) / uColorBits;

  // --- Scanlines ---
  float scan = sin(uv.y * uResolution.y * 3.14159) * 0.5 + 0.5;
  col *= 1.0 - uScanline * scan;

  // --- Grano animado ---
  col += (hash(uv * uResolution + uTime) - 0.5) * uNoise;

  // --- Viñeta ---
  float vig = smoothstep(0.85, 0.25, edge);
  col *= mix(1.0, vig, uVignette);

  gl_FragColor = vec4(col, 1.0);
}
`;

class RetroEffect extends pc.PostEffect {
  constructor(graphicsDevice, opts = {}) {
    super(graphicsDevice);
    this.shader = pc.ShaderUtils.createShader(graphicsDevice, {
      uniqueName: "RetroVHSPS1",
      attributes: { aPosition: pc.SEMANTIC_POSITION },
      vertexGLSL: pc.PostEffect.quadVertexShader,
      fragmentGLSL: FRAG,
    });
    this.pixel = opts.pixel ?? 240;
    this.aberration = opts.aberration ?? 0.0016;
    this.scanline = opts.scanline ?? 0.12;
    this.noise = opts.noise ?? 0.06;
    this.vignette = opts.vignette ?? 0.5;
    this.colorBits = opts.colorBits ?? 16;
    this.wobble = opts.wobble ?? 1.0;
  }

  render(inputTarget, outputTarget, rect) {
    const scope = this.device.scope;
    scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);
    scope.resolve("uResolution").setValue([inputTarget.width, inputTarget.height]);
    scope.resolve("uTime").setValue((typeof performance !== "undefined" ? performance.now() : 0) * 0.001);
    scope.resolve("uPixel").setValue(this.pixel);
    scope.resolve("uAberration").setValue(this.aberration);
    scope.resolve("uScanline").setValue(this.scanline);
    scope.resolve("uNoise").setValue(this.noise);
    scope.resolve("uVignette").setValue(this.vignette);
    scope.resolve("uColorBits").setValue(this.colorBits);
    scope.resolve("uWobble").setValue(this.wobble);
    this.drawQuad(outputTarget, this.shader, rect);
  }
}

// Engancha el filtro al camera. Devuelve el effect para tunear params en vivo.
export function applyRetroFilter(app, cameraEntity, opts = {}) {
  const effect = new RetroEffect(app.graphicsDevice, opts);
  cameraEntity.camera.postEffects.addEffect(effect);
  return effect;
}
