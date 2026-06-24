import * as pc from "playcanvas";

const CHARACTER_BASE = "/assets/characters/";

function fallbackMat(name, color) {
  const material = new pc.StandardMaterial();
  material.name = name;
  material.diffuse = color;
  material.cull = pc.CULLFACE_BACK;
  material.update();
  return material;
}

function characterMat(app, name, file, fallbackColor) {
  const material = fallbackMat(name, fallbackColor);
  const image = new Image();

  image.onload = () => {
    const texture = new pc.Texture(app.graphicsDevice, {
      name: `${name}-texture`,
      mipmaps: true,
      minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
      magFilter: pc.FILTER_LINEAR,
      addressU: pc.ADDRESS_CLAMP_TO_EDGE,
      addressV: pc.ADDRESS_CLAMP_TO_EDGE,
    });
    texture.setSource(image);
    material.diffuseMap = texture;
    material.emissive = new pc.Color(0.72, 0.66, 0.55);
    material.emissiveMap = texture;
    material.emissiveIntensity = 0.75;
    material.opacityMap = texture;
    material.opacityMapChannel = "a";
    material.blendType = pc.BLEND_NORMAL;
    material.alphaTest = 0.5;
    material.depthWrite = true;
    material.cull = pc.CULLFACE_BACK;
    material.update();
  };

  image.onerror = () => {
    console.warn(`Missing generated character frame: ${CHARACTER_BASE}${file}`);
  };
  image.src = `${CHARACTER_BASE}${file}`;
  return material;
}

export function createTaxistaWalkMaterials(app) {
  const fallback = new pc.Color(0.18, 0.14, 0.1);
  return [1, 2, 3, 4].map((n) =>
    characterMat(app, `taxista-walk-${n}`, `taxista-walk${n}.png`, fallback),
  );
}
