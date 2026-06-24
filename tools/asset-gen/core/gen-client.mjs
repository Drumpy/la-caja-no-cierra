// tools/asset-gen/core/gen-client.mjs
// SEAM hacia el motor de generación. Hoy = ima2-gen (CLI `ima2 gen` con
// --provider oauth = OAuth de ChatGPT, gratis). ima2 maneja login + server + gen;
// nosotros solo le pasamos prompt/refs/size/n y leemos los PNG.
// `exec`/`probe` son inyectables -> el pipeline usa los reales, los tests usan fakes.
// Si a futuro se "vendoriza" el oauthProxy de ima2, solo cambia este archivo.
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

function run(cmd, args, { timeoutMs = 300_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`${cmd} timeout`)); }, timeoutMs);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject); // ENOENT = comando no instalado
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

// Transporte real: shell `ima2 gen` -> escribe PNGs en un tmpdir -> los leemos.
async function ima2Exec({ prompt, refs = [], size = '1024x1024', n = 1, provider = 'oauth', model }) {
  const dir = await mkdtemp(path.join(tmpdir(), 'asset-gen-'));
  try {
    const args = ['gen', prompt, '--provider', provider, '-n', String(n), '-s', size, '-d', dir, '--json'];
    for (const ref of refs) args.push('--ref', ref);
    if (model) args.push('--model', model);
    const { code, stdout, stderr } = await run('ima2', args);
    if (code !== 0) {
      const msg = `${stderr || stdout}`.trim();
      if (/auth|login|sign|oauth|token|unauthor/i.test(msg)) {
        throw new Error(`ima2 sin autenticar. Corré: pnpm asset:setup\n${msg}`);
      }
      throw new Error(`ima2 gen falló (code ${code}): ${msg}`);
    }
    const files = (await readdir(dir)).filter((f) => /\.(png|webp)$/i.test(f)).sort();
    const buffers = [];
    for (const f of files) buffers.push(await readFile(path.join(dir, f)));
    if (!buffers.length) throw new Error(`ima2 gen no produjo imágenes.\n${stdout.slice(0, 400)}`);
    return buffers;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function ima2Probe() {
  try {
    const { code } = await run('ima2', ['--version'], { timeoutMs: 15_000 });
    return code === 0;
  } catch {
    return false; // ENOENT
  }
}

export function makeGenClient({ exec = ima2Exec, probe = ima2Probe } = {}) {
  return {
    async ensureReady() {
      if (!(await probe())) {
        throw new Error('ima2-gen no está instalado. Instalá:  npm i -g ima2-gen   y luego:  pnpm asset:setup');
      }
    },
    // req: { prompt, refs?, size?, n?, provider?, model? } -> [Buffer]
    async generate(req) {
      return exec(req);
    },
  };
}

// ─── Proveedor de ANIMACIÓN dedicado (scaffold, opt-in) ──────────────────────
// GPT Image 2 (ima2) es bueno para ESTÁTICO pero no interpola cuadros: para
// animaciones multi-frame dibuja N objetos distintos que saltan. Para esas
// acciones conviene un modelo entrenado en animación pixel-art:
//   - Retro Diffusion "RD Animation"  (https://www.retrodiffusion.ai , API + Replicate)
//   - PixelLab `animate_character`     (https://api.pixellab.ai/v2 , o su MCP)
// Este exec queda como SEAM listo: cuando haya API key, devuelve los frames del
// proveedor. Sin key, falla con instrucción clara (no rompe el flujo gratis ima2).
// Doctrina del repo: el sway de decor (palmera) NO usa esto -> es programático
// (ops.swayFrames). Esto es para walk/idle/dash/attack con identidad compleja.
async function rdAnimationExec({ prompt, refs = [], frames = 6, size = '64x64' }) {
  const key = process.env.RETRO_DIFFUSION_API_KEY;
  if (!key) {
    throw new Error(
      'Proveedor de animación no configurado. Seteá RETRO_DIFFUSION_API_KEY ' +
      '(https://www.retrodiffusion.ai -> Developer Tools) o usá el sway programático. ' +
      'Ver tools/asset-gen/README sección "Animación".'
    );
  }
  // TODO (al tener key): POST a RD Animation. Devuelve [Buffer] de cada frame PNG.
  // El endpoint exacto/paleta de params se confirma contra api docs al integrar.
  throw new Error('rdAnimationExec: integración pendiente (key presente, endpoint sin cablear).');
}

// Cliente de animación: misma interfaz que makeGenClient.generate(req)->[Buffer].
// Uso futuro en cli: para acciones NO programáticas con --provider anim, rutear acá.
export function makeAnimationClient({ exec = rdAnimationExec } = {}) {
  return {
    async ensureReady() {
      if (!process.env.RETRO_DIFFUSION_API_KEY && !process.env.PIXELLAB_API_KEY) {
        throw new Error('Sin API key de animación (RETRO_DIFFUSION_API_KEY o PIXELLAB_API_KEY).');
      }
    },
    async generate(req) {
      return exec(req);
    },
  };
}
