import assert from "node:assert/strict";
import test from "node:test";
import config from "../tools/asset-gen/asset-gen.config.mjs";

test("texture asset specs include dimensions for 3D targets", () => {
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
    "woodCounter",
  ]);

  for (const [key, spec] of Object.entries(textureSpecs)) {
    assert.ok(spec.name, `${key} missing output name`);
    assert.ok(spec.prompt.includes("PlayCanvas") || spec.prompt.includes("3D"), `${key} missing 3D prompt context`);
    assert.ok(spec.objectDimensionsMeters, `${key} missing object dimensions`);
    assert.ok(spec.uvRepeat, `${key} missing UV repeat`);
  }
});

test("taxista character spec includes animation and world placement", () => {
  const spec = config.assets.character.taxistaWalk;

  assert.equal(spec.name, "taxista-walk");
  assert.equal(spec.frames, "4x1");
  assert.ok(spec.objectDimensionsMeters);
  assert.ok(spec.windowPositionMeters);
  assert.ok(spec.approachPathMeters);
  assert.match(spec.prompt, /Full-body human Taxista/);
});
