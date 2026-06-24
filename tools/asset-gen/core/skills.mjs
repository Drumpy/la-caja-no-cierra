// tools/asset-gen/core/skills.mjs
// Registry de skills. Cada skills/<name>/index.mjs exporta por default un objeto
// con { name, description, outputDir, defaults, plan, process, validate }.
// Sumar una skill AI nueva = soltar una carpeta acá; el core la auto-descubre,
// cero cambios. (Ver el contrato en el spec / README.)
import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ASSET_GEN_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = path.join(ASSET_GEN_DIR, 'skills');
const ART_DIRECTION = readFileSync(path.join(ASSET_GEN_DIR, 'art-direction.md'), 'utf8');
const ART_DIRECTION_MARKER = /Blu Asset Animation Bible|animation bible/i;

function withGlobalArtDirection(skill) {
  const wrapped = { ...skill, usesGlobalArtDirection: true };
  wrapped.plan = function planWithGlobalArtDirection(...args) {
    const requests = skill.plan.apply(wrapped, args);
    return requests.map((req) => {
      if (!req?.prompt || ART_DIRECTION_MARKER.test(req.prompt)) return req;
      return { ...req, prompt: `${req.prompt}\n\n${ART_DIRECTION}` };
    });
  };
  return wrapped;
}

export async function loadSkills() {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skills = new Map();
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const mod = await import(pathToFileURL(path.join(SKILLS_DIR, e.name, 'index.mjs')).href);
    const skill = mod.default;
    if (!skill?.name) throw new Error(`skill "${e.name}" sin export default válido (.name)`);
    for (const fn of ['plan', 'validate']) {
      if (typeof skill[fn] !== 'function') throw new Error(`skill "${skill.name}" no implementa ${fn}()`);
    }
    // process() (provider oauth) o generate() (seam externo, p.ej. rFXGen): uno u otro.
    if (typeof skill.process !== 'function' && typeof skill.generate !== 'function') {
      throw new Error(`skill "${skill.name}" no implementa ni process() ni generate()`);
    }
    skills.set(skill.name, skill.usesGlobalArtDirection === false ? skill : withGlobalArtDirection(skill));
  }
  return skills;
}

export async function getSkill(name) {
  const skills = await loadSkills();
  const skill = skills.get(name);
  if (!skill) {
    const have = [...skills.keys()].join(', ') || '(ninguna)';
    throw new Error(`skill desconocida "${name}". Disponibles: ${have}`);
  }
  return skill;
}
