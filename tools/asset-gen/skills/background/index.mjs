// tools/asset-gen/skills/background/index.mjs
// Skill: fondos / escenas 2D (mapas, parallax). A diferencia de `sprite`, NO es
// transparente por defecto: las capas de escenario (full/sky/far) salen OPACAS;
// las de overlay (mid/near) usan chroma verde para apilarse sobre las demás.
// Ideas: agent-sprite-forge generate2dmap (capas, foundation-only) + sprite-sheet-creator (parallax sky/mid/fg).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(path.join(HERE, 'prompt-rules.md'), 'utf8');
const ASSET_DIRECTION = readFileSync(path.join(HERE, '..', '..', 'art-direction.md'), 'utf8');
const KEY_COLOR = [0, 255, 0];

// Capas de parallax (de lejos a cerca). transparent=true -> overlay con chroma.
const LAYERS = {
  full: { transparent: false, text: 'A single COMPLETE background scene filling the whole frame: sky, distant scenery, midground and the ground/horizon, as one cohesive painting. Foundation/scenery only.' },
  sky:  { transparent: false, text: 'The FURTHEST parallax layer: sky/backdrop only — sky gradient, clouds, sun or moon, and very distant mountain/city silhouettes on the horizon. Fills the whole frame.' },
  far:  { transparent: false, text: 'A FAR parallax layer over the sky: distant low-contrast scenery silhouettes (far mountains, distant buildings or trees) sitting low in the frame for atmospheric depth.' },
  mid:  { transparent: true,  text: 'A MID parallax OVERLAY layer: mid-distance scenery (closer trees, hills, structures) across the lower-middle of the frame. Everything that is not scenery is flat green #00FF00 (it becomes transparent).' },
  near: { transparent: true,  text: 'A NEAR parallax OVERLAY layer closest to the camera: foreground scenery framing the lower edges (close foliage, rocks, grass). Everything else is flat green #00FF00 (transparent).' },
};

export default {
  name: 'background',
  description: 'Fondo / escena 2D (opaco) o capa de parallax (transparente). No es sprite. --layer full|sky|far|mid|near.',
  outputDir: 'public/assets',
  // Fondos son grandes y anchos: 16:9-ish, maxSize alto para conservar detalle.
  defaults: { size: '1536x1024', n: 3, maxSize: 1536, layer: 'full' },
  layers: LAYERS,

  plan({ prompt, ref, refs, n, size, layer, config = {} } = {}) {
    const refList = refs ? [...refs] : (ref ? [ref] : []);
    if (!refList.length && config.styleRef) refList.push(config.styleRef);
    const l = LAYERS[layer] || LAYERS.full;
    return [{
      id: 'background',
      prompt: `${prompt}\n\n${l.text}\n\n${ASSET_DIRECTION}\n\n${RULES}`,
      refs: refList,
      size: size || this.defaults.size,
      n: n || this.defaults.n,
    }];
  },

  async process(buffer, { ops, spec = {} } = {}) {
    const layer = LAYERS[spec.layer] || LAYERS.full;
    const maxSize = spec.maxSize ?? this.defaults.maxSize;
    let buf;
    if (layer.transparent) {
      // overlay: vuela el verde, limpia specks, recorta, comprime con paleta
      const keyed = await ops.removeChromaHalo(await ops.chromaKey(buffer, { color: spec.keyColor || KEY_COLOR }));
      const cleaned = (spec.component || 'despeckle') === 'all' ? keyed : await ops.cleanAlpha(keyed, { mode: spec.component || 'despeckle' });
      buf = await ops.optimize(await ops.trim(cleaned), { maxSize, palette: true });
    } else {
      // opaco: sin chroma, full-color (sin paleta -> evita banding en el cielo)
      buf = await ops.optimize(buffer, { maxSize, palette: false, keepAlpha: false });
    }
    return [{ name: spec.name, buffer: buf }];
  },

  async validate(buffer, { qa, spec = {} } = {}) {
    const layer = LAYERS[spec.layer] || LAYERS.full;
    // capas opacas no requieren alpha; overlays sí (transparencia removida)
    return qa.validate(buffer, { size: null, expectAlpha: !!layer.transparent });
  },
};
