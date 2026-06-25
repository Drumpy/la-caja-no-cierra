import assert from "node:assert/strict";
import test from "node:test";
import config from "../tools/asset-gen/asset-gen.config.mjs";

test("texture asset specs include dimensions 3D targets", () => {
  const textureSpecs = config.assets.texture;
  assert.deepEqual(Object.keys(textureSpecs).sort(), [
    "ceilingSheet",
    "floorTile",
    "productCafe",
    "productChicles",
    "productCigarros",
    "productVela",
    "taxistaCutout",
    "wallPlaster",
    "windowMetal",
    "woodCounter",
  ]);

  for (const [key, spec] of Object.entries(textureSpecs)) {
    assert.ok(spec.name, `${key} missing output name`);
    assert.ok(spec.prompt.includes("PlayCanvas") || spec.prompt.includes("3D"), `${key} missing 3D prompt context`);
    assert.ok(spec.objectDimensionsMeters, `${key} missing object dimensions`);
    assert.ok(spec.uvRepeat, `${key} missing UV repeat`);
  }
});

test("taxista character spec animation world placement", () => {
  const spec = config.assets.character.taxistaWalk;

  assert.equal(spec.name, "taxista-walk");
  assert.equal(spec.frames, "4x1");
  assert.ok(spec.objectDimensionsMeters);
  assert.ok(spec.windowPositionMeters);
  assert.ok(spec.approachPathMeters);
  assert.match(spec.prompt, /Full-body human Taxista/);
});

test("wall and ceiling texture specs use local references", () => {
  assert.equal(config.refs.brickWall, "tools/asset-gen/references/pared-ladrillo.jpg");
  assert.equal(config.refs.rustyRoof, "tools/asset-gen/references/techo-chapa.jpg");
  assert.equal(config.refs.serviceWindow, "tools/asset-gen/references/ventana.jpg");
  assert.match(config.assets.texture.wallPlaster.prompt, /seamless/i);
  assert.match(config.assets.texture.wallPlaster.prompt, /ladrillo|brick/i);
  assert.match(config.assets.texture.ceilingSheet.prompt, /seamless/i);
  assert.match(config.assets.texture.ceilingSheet.prompt, /chapa|corrugated/i);
});
