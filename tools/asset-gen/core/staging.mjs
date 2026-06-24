// tools/asset-gen/core/staging.mjs
// Área de trabajo no-destructiva. Las variantes generadas caen en
// staging/<skill>/<name>/ con un report.json; el usuario elige y recién ahí
// `promote` copia la elegida a la carpeta real de assets. Nunca pisa
// public/assets sin promote explícito.
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
export const STAGING_DIR = path.join(ROOT, 'staging');

function stageDir(skill, name) {
  return path.join(STAGING_DIR, skill, name);
}

function extOf(asset) {
  return String(asset.ext || 'png').replace(/^\./, '').toLowerCase();
}

// variants: [{ variant: number, assets: [{ name, buffer }], qa: [report] }]
export async function writeVariants(skill, name, variants, meta = {}) {
  const dir = stageDir(skill, name);
  await mkdir(dir, { recursive: true });
  const report = { skill, name, createdAt: new Date().toISOString(), ...meta, variants: [] };

  for (const v of variants) {
    const files = [];
    for (const asset of v.assets) {
      const ext = extOf(asset);
      const file = v.assets.length > 1
        ? `variant_${v.variant}__${asset.name}.${ext}`
        : `variant_${v.variant}.${ext}`;
      await writeFile(path.join(dir, file), asset.buffer);
      files.push(file);
    }
    report.variants.push({ variant: v.variant, assetName: name, files, qa: v.qa });
  }

  await writeFile(path.join(dir, 'report.json'), JSON.stringify(report, null, 2));
  return { dir, report };
}

export async function readReport(skill, name) {
  const raw = await readFile(path.join(stageDir(skill, name), 'report.json'), 'utf8');
  return JSON.parse(raw);
}

// Copia la variante elegida desde staging a la carpeta de salida de la skill.
// Rechaza variantes con QA fallida salvo force. Devuelve los paths destino.
export async function promote(skill, name, variant, { outputDir, force = false } = {}) {
  const report = await readReport(skill, name);
  const entry = report.variants.find((v) => v.variant === Number(variant));
  if (!entry) throw new Error(`variante ${variant} no existe en staging de ${skill}/${name}`);

  const qaOk = (entry.qa || []).every((r) => r.ok);
  if (!qaOk && !force) {
    throw new Error(`la variante ${variant} tiene QA fallida; usá --force para promover igual`);
  }

  const destDir = path.isAbsolute(outputDir) ? outputDir : path.join(REPO_ROOT, outputDir);
  await mkdir(destDir, { recursive: true });
  const src = stageDir(skill, name);
  const written = [];
  for (let i = 0; i < entry.files.length; i++) {
    const file = entry.files[i];
    const ext = path.extname(file) || '.png';
    // multi-asset (frames): conserva el sufijo de nombre; single: usa <name>.png
    const destName = entry.files.length > 1
      ? file.replace(/^variant_\d+__/, '')
      : `${name}${ext}`;
    const dest = path.join(destDir, destName);
    await copyFile(path.join(src, file), dest);
    written.push(dest);
  }
  return written;
}
