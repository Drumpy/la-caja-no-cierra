import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(path.join(HERE, "prompt-rules.md"), "utf8");
const ASSET_DIRECTION = readFileSync(path.join(HERE, "..", "..", "art-direction.md"), "utf8");
const KEY_COLOR = [0, 255, 0];

export default {
  name: "character",
  description: "Transparent full-body character animation frames for 2.5D PlayCanvas billboards.",
  outputDir: "public/assets/characters",
  defaults: {
    size: "1024x1024",
    n: 1,
    maxSize: 512,
    component: "despeckle",
    align: "bottom",
  },

  plan({ prompt, ref, n, size, config }) {
    const refs = [];
    if (ref) refs.push(ref);
    if (!refs.length && config.styleRef) refs.push(config.styleRef);

    return [
      {
        id: "character",
        prompt: `${prompt}\n\n${ASSET_DIRECTION}\n\n${RULES}`,
        refs,
        size: size || this.defaults.size,
        n: n || this.defaults.n,
      },
    ];
  },

  async process(buffer, { ops, spec = {} } = {}) {
    let keyed = await ops.chromaKey(buffer, { color: spec.keyColor || KEY_COLOR });
    keyed = await ops.removeChromaHalo(keyed);
    if (spec.fillHoles) keyed = (await ops.fillHoles(keyed)).buffer;

    const frames = spec.frames
      ? await ops.splitFramesAuto(keyed, spec.frames)
      : [keyed];

    const cleaned = [];
    for (const frame of frames) {
      const alpha = spec.component === "all"
        ? frame
        : await ops.cleanAlpha(frame, { mode: spec.component || this.defaults.component });
      cleaned.push(await ops.trim(alpha));
    }

    const maxSize = spec.maxSize ?? this.defaults.maxSize;
    const out = [];
    for (let i = 0; i < cleaned.length; i++) {
      const bufferOut = await ops.optimize(cleaned[i], {
        maxSize,
        palette: true,
        keepAlpha: true,
      });
      out.push({ name: cleaned.length > 1 ? `${spec.name}${i + 1}` : spec.name, buffer: bufferOut });
    }
    return out;
  },

  async validate(buffer, { qa } = {}) {
    return qa.validate(buffer, { expectAlpha: true });
  },
};
