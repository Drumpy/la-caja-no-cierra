#!/usr/bin/env node
// tools/asset-gen/cli.mjs
// Entry de la herramienta. Comandos:
//   asset-gen setup                         -> OAuth ChatGPT (delega en ima2)
//   asset-gen list                          -> skills disponibles
//   asset-gen <skill> <prompt|nombre> [..]  -> genera variantes a staging
//   asset-gen promote <skill> <name> <n>    -> promueve una variante a assets
// Pensado para usarse vía pnpm: `pnpm asset sprite "..."`, `pnpm asset:setup`, etc.
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getSkill, loadSkills } from './core/skills.mjs';
import { makeGenClient } from './core/gen-client.mjs';
import * as ops from './core/image-ops.mjs';
import * as qa from './core/qa.mjs';
import { writeVariants, promote } from './core/staging.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');

const FLAGS = {
  ref: { type: 'string' },
  n: { type: 'string' },
  seed: { type: 'string' }, // sfx: base de seed para variantes reproducibles
  size: { type: 'string' },
  frames: { type: 'string' }, // "CxR"
  action: { type: 'string' }, // walk|run|idle|attack|hurt|jump|death|two-state (prompt + frames)
  name: { type: 'string' },
  target: { type: 'string' }, // px del lado final (fit cuadrado)
  max: { type: 'string' },    // tope del lado mayor del PNG (compresión/peso)
  align: { type: 'string' },  // bottom | center | top (anclaje en sheets)
  component: { type: 'string' }, // despeckle | largest | all (limpieza de alpha)
  layer: { type: 'string' },  // background: full | sky | far | mid | near
  'fill-holes': { type: 'boolean' }, // restaurar huecos interiores tras el chroma
  'sway-frames': { type: 'string' },     // override de cuadros del sway programático
  'palette-colours': { type: 'string' }, // tope de colores de la paleta compartida (anim)
  provider: { type: 'string' },
  model: { type: 'string' },
  format: { type: 'string' }, // sfx: sample_rate,bits,channels
  engine: { type: 'string' }, // sfx: jsfxr | jfxr
  force: { type: 'boolean' },
};

// NFD + quitar no-alfanuméricos: "corazón rojo" -> "corazon-rojo" (las marcas
// combinantes de NFD caen en [^a-z0-9]).
const slug = (s) => s.toLowerCase().normalize('NFD')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'asset';

function parseFrames(f) {
  if (!f) return null;
  const m = /^(\d+)(?:x(\d+))?$/.exec(String(f).trim());
  if (!m) throw new Error(`--frames inválido "${f}". Usá "CxR" (ej. 4x1).`);
  return { cols: Number(m[1]), rows: Number(m[2] || 1) };
}

async function loadConfig() {
  try { return (await import(pathToFileURL(path.join(HERE, 'asset-gen.config.mjs')).href)).default ?? {}; }
  catch { return {}; }
}

function resolveRef(ref, config) {
  if (!ref) return null;
  const mapped = config.refs?.[ref] ?? ref;
  return path.isAbsolute(mapped) ? mapped : path.join(REPO_ROOT, mapped);
}

function passthrough(args) {
  // delega en el CLI de ima2 (ej. setup), heredando la terminal (OAuth interactivo)
  const child = spawn('ima2', args, { stdio: 'inherit' });
  child.on('error', () => {
    console.error('No encuentro `ima2`. Instalá:  npm i -g ima2-gen');
    process.exit(1);
  });
  child.on('close', (code) => process.exit(code ?? 0));
}

async function listSkills() {
  const skills = await loadSkills();
  console.log('Skills disponibles:\n');
  for (const s of skills.values()) {
    console.log(`  ${s.name.padEnd(10)} ${s.description}`);
    console.log(`  ${' '.repeat(10)} defaults: ${JSON.stringify(s.defaults)}  ->  ${s.outputDir}\n`);
  }
  console.log('Uso:  pnpm asset <skill> "<prompt>" [--ref blu --n 4 --size 1024x1024 --frames 4x1 --target 96 --name foo]');
}

async function doPromote(rest) {
  const { values, positionals } = parseArgs({ args: rest, options: FLAGS, allowPositionals: true });
  const [skillName, name, variant] = positionals;
  if (!skillName || !name || variant == null) {
    throw new Error('uso: pnpm asset:promote <skill> <name> <variante> [--force]');
  }
  const skill = await getSkill(skillName);
  const written = await promote(skillName, name, variant, { outputDir: skill.outputDir, force: values.force });
  console.log('Promovido:');
  for (const f of written) console.log('  ' + path.relative(REPO_ROOT, f));
}

async function doGenerate(skillName, rest) {
  const { values, positionals } = parseArgs({ args: rest, options: FLAGS, allowPositionals: true });
  const config = await loadConfig();
  const skill = await getSkill(skillName);
  const key = positionals[0];
  if (!key) throw new Error(`uso: pnpm asset ${skillName} "<prompt>"  |  pnpm asset ${skillName} <nombre-config>`);

  // ¿es una spec nombrada de la config, o un prompt literal?
  const named = config.assets?.[skillName]?.[key];
  const prompt = named?.prompt ?? key;
  const name = values.name ?? named?.name ?? (named ? key : slug(key));
  const targetSize = values.target ? Number(values.target) : (named?.targetSize ?? null);
  const action = values.action ?? named?.action;
  // --action elige el layout de frames por defecto (se puede pisar con --frames)
  const frames = parseFrames(values.frames ?? named?.frames ?? (action && skill.actions?.[action]?.frames));
  const n = Number(values.n ?? named?.n ?? config.defaults?.n ?? skill.defaults.n);
  const size = values.size ?? named?.size ?? config.defaults?.size ?? skill.defaults.size;
  const format = values.format ?? named?.format ?? skill.defaults?.format;
  const engine = values.engine ?? named?.engine ?? skill.defaults?.engine;
  const seed = values.seed ?? named?.seed; // sfx: base de seed reproducible
  const ref = resolveRef(values.ref ?? named?.ref, config);
  const genConfig = { ...config, styleRef: resolveRef(config.styleRef, config) };

  const gen = skill.generate ? null : makeGenClient();
  if (gen) await gen.ensureReady();

  const maxSize = values.max ? Number(values.max) : (named?.maxSize ?? undefined);
  const align = values.align ?? named?.align;
  const component = values.component ?? named?.component;
  const layer = values.layer ?? named?.layer; // background: capa de parallax
  const fillHoles = values['fill-holes'] ?? named?.fillHoles;
  const requests = skill.plan({ prompt, ref, n, size, action, layer, format, engine, seed, preset: named?.preset, config: genConfig });
  const actionDef = action ? skill.actions?.[action] : null;
  const programmatic = actionDef?.programmatic ?? null;       // 'sway' -> anim por código
  const swayFrames = Number(values['sway-frames'] ?? actionDef?.swayFrames ?? 0) || null;
  const paletteColours = values['palette-colours'] ? Number(values['palette-colours']) : (named?.paletteColours ?? null);
  const spec = { name, targetSize, frames, keyColor: named?.keyColor, maxSize, align, component, layer, fillHoles, programmatic, swayFrames, paletteColours };

  const variants = [];
  let idx = 0;
  for (const req of requests) {
    if (skill.generate) {
      console.log(`Generando variante ${idx + 1} de "${name}" con ${skill.name}…`);
      idx += 1;
      const assets = await skill.generate(req, { spec });
      const reports = [];
      for (const a of assets) reports.push(await skill.validate(a.buffer, { qa, spec, asset: a }));
      variants.push({ variant: idx, assets, qa: reports });
      continue;
    }
    console.log(`Generando ${req.n} variante(s) de "${name}" (provider oauth)…`);
    const buffers = await gen.generate({ ...req, provider: values.provider, model: values.model });
    for (const buf of buffers) {
      idx += 1;
      try {
        const assets = await skill.process(buf, { ops, spec });
        const reports = [];
        for (const a of assets) reports.push(await skill.validate(a.buffer, { qa, spec }));
        variants.push({ variant: idx, assets, qa: reports });
      } catch (err) {
        console.error(`  variante ${idx} falló el post-proceso: ${err.message}`);
      }
    }
  }
  if (!variants.length) throw new Error('no se generó ninguna variante');

  const { dir } = await writeVariants(skillName, name, variants, { prompt });
  const flagged = variants.filter((v) => v.qa.some((r) => !r.ok));
  console.log(`\nListo. ${variants.length} variante(s) en:\n  ${path.relative(REPO_ROOT, dir)}/`);
  if (flagged.length) console.log(`  ⚠ ${flagged.length} con observaciones de QA (ver report.json)`);
  console.log(`\nElegí y promové:\n  pnpm asset:promote ${skillName} ${name} <numero>`);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') return listSkills();
  if (cmd === 'setup') return passthrough(['setup']);
  if (cmd === 'list') return listSkills();
  if (cmd === 'promote') return doPromote(rest);
  return doGenerate(cmd, rest);
}

main().catch((err) => {
  console.error('\n✖ ' + (err?.message || err));
  process.exit(1);
});
