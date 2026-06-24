import * as pc from "playcanvas";

const TEXTURE_BASE = "/assets/textures/";

export function makeMat(name, color, opts = {}) {
  const material = new pc.StandardMaterial();
  material.name = name;
  material.diffuse = color;
  // Mate: sin brillo especular (yeso/madera no son plástico). Quita el sheen que
  // hacía ver las paredes "iluminadas". El terror vive en superficies mate y oscuras.
  material.specular = new pc.Color(0, 0, 0);
  material.gloss = 0;
  material.useMetalness = false;
  if (opts.emissive) {
    material.emissive = opts.emissive;
    material.emissiveIntensity = opts.emissiveIntensity ?? 0.35;
  }
  if (opts.opacity !== undefined) {
    material.opacity = opts.opacity;
    material.blendType = pc.BLEND_NORMAL;
  }
  material.update();
  return material;
}

export function texturedMat(app, name, fallbackColor, file, opts = {}) {
  const material = makeMat(name, fallbackColor, opts);
  const image = new Image();

  image.onload = () => {
    const texture = new pc.Texture(app.graphicsDevice, {
      name: `${name}-texture`,
      mipmaps: true,
      minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
      magFilter: pc.FILTER_LINEAR,
      addressU: pc.ADDRESS_REPEAT,
      addressV: pc.ADDRESS_REPEAT,
    });
    texture.setSource(image);
    material.diffuseMap = texture;
    if (opts.tiling) material.diffuseMapTiling = new pc.Vec2(opts.tiling.u, opts.tiling.v);
    material.update();
  };

  image.onerror = () => {
    // Assets are generated/promoted during development. Fallback keeps builds playable.
    console.warn(`Missing generated texture: ${TEXTURE_BASE}${file}`);
  };
  image.src = `${TEXTURE_BASE}${file}`;
  return material;
}

export function createKioskMaterials(app) {
  return {
    floor: texturedMat(app, "floor-tile", new pc.Color(0.24, 0.18, 0.12), "floor-tile.png", {
      tiling: { u: 3.5, v: 4.5 },
    }),
    wall: texturedMat(app, "wall-plaster", new pc.Color(0.56, 0.38, 0.2), "wall-plaster.png", {
      tiling: { u: 2.5, v: 1.8 },
    }),
    ceiling: texturedMat(app, "ceiling-sheet", new pc.Color(0.82, 0.78, 0.68), "ceiling-sheet.png", {
      tiling: { u: 2.5, v: 3 },
      emissive: new pc.Color(0.13, 0.11, 0.08),
      emissiveIntensity: 0.5,
    }),
    wood: texturedMat(app, "wood-counter", new pc.Color(0.35, 0.23, 0.13), "wood-counter.png", {
      tiling: { u: 2.4, v: 1 },
    }),
    products: {
      cafe: texturedMat(app, "product-cafe", new pc.Color(0.45, 0.28, 0.15), "product-cafe.png"),
      "cigarros-ficticios": texturedMat(
        app,
        "product-cigarros",
        new pc.Color(0.43, 0.31, 0.26),
        "product-cigarros.png",
      ),
      chicles: texturedMat(app, "product-chicles", new pc.Color(0.23, 0.52, 0.43), "product-chicles.png"),
      vela: texturedMat(app, "product-vela", new pc.Color(0.78, 0.68, 0.37), "product-vela.png"),
    },
    taxista: texturedMat(app, "taxista-cutout", new pc.Color(0.18, 0.14, 0.1), "taxista-cutout.png"),
  };
}
