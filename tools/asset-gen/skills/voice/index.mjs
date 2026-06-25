import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSET_GEN_DIR = path.resolve(HERE, "..", "..");
const REFERENCES_DIR = path.join(ASSET_GEN_DIR, "references");
const AUDIO_EXTS = ["mp3", "wav", "ogg", "m4a"];

function slug(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "voice";
}

function extOf(file) {
  return path.extname(file).replace(/^\./, "").toLowerCase();
}

function resolveSource(prompt, ref) {
  if (ref) return ref;
  const name = String(prompt || "").trim();
  if (extOf(name)) return path.join(REFERENCES_DIR, name);
  return path.join(REFERENCES_DIR, `${slug(name)}.mp3`);
}

export default {
  name: "voice",
  description: "Promueve voces desde tools/asset-gen/references; el toque retro se aplica en runtime.",
  outputDir: "public/audio/voices",
  usesGlobalArtDirection: false,
  defaults: { n: 1 },

  plan({ prompt, ref } = {}) {
    const source = resolveSource(prompt, ref);
    return [{
      id: "voice",
      prompt,
      source,
      ext: extOf(source) || "mp3",
      variant: 1,
    }];
  },

  async generate(req) {
    const buffer = await readFile(req.source);
    return [{ name: slug(req.prompt), ext: req.ext, buffer }];
  },

  async validate(buffer, { asset } = {}) {
    const issues = [];
    const ext = asset?.ext;
    if (!buffer.length) issues.push("archivo de audio vacío");
    if (!AUDIO_EXTS.includes(ext)) issues.push(`formato no soportado: ${ext || "desconocido"}`);
    return { ok: issues.length === 0, issues, bytes: buffer.length, ext };
  },
};
