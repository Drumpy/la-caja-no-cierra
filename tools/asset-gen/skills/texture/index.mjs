import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(path.join(HERE, "prompt-rules.md"), "utf8");
const ASSET_DIRECTION = readFileSync(path.join(HERE, "..", "..", "art-direction.md"), "utf8");

export default {
  name: "texture",
  description: "Opaque PNG textures for PlayCanvas 3D meshes via ima2/ChatGPT.",
  outputDir: "public/assets/textures",
  defaults: {
    size: "1024x1024",
    n: 2,
    maxSize: 1024,
  },

  plan({ prompt, ref, n, size, config }) {
    const refs = [];
    if (ref) refs.push(ref);
    if (!refs.length && config.styleRef) refs.push(config.styleRef);

    return [
      {
        id: "texture",
        prompt: `${prompt}\n\n${ASSET_DIRECTION}\n\n${RULES}`,
        refs,
        size: size || this.defaults.size,
        n: n || this.defaults.n,
      },
    ];
  },

  async process(buffer, { ops, spec = {} } = {}) {
    const maxSize = spec.maxSize ?? this.defaults.maxSize;
    const out = await ops.optimize(buffer, {
      maxSize,
      palette: false,
      keepAlpha: false,
    });
    return [{ name: spec.name, buffer: out }];
  },

  async validate(buffer, { qa } = {}) {
    return qa.validate(buffer, { expectAlpha: false });
  },
};
