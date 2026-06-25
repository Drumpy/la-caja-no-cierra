import assert from "node:assert/strict";
import test from "node:test";
import { frontWallPanels, serviceWindowLayout } from "../src/playcanvas/createScene.js";

test("front wall panels keep a single window hole", () => {
  const panels = frontWallPanels(0, 3.5, 2.6, 1.28, 0.95, 0.95);

  assert.deepEqual(panels.map((p) => p.name), ["sill", "left", "right", "top"]);
  const top = panels.find((p) => p.name === "top");
  assert.equal(top.name, "top");
  assert.equal(top.x0, -0.64);
  assert.equal(top.x1, 0.64);
  assert.ok(Math.abs(top.y0 - 1.9) < 1e-9);
  assert.equal(top.y1, 2.6);
  assert.equal(panels.find((p) => p.name === "sill").x0, -1.75);
  assert.equal(panels.find((p) => p.name === "sill").x1, 1.75);
});

test("customer target aligns with the small service hatch", () => {
  const layout = serviceWindowLayout(-2.25);

  assert.equal(layout.hole.w, 1.28);
  assert.equal(layout.hole.h, 0.95);
  assert.equal(layout.hatch.cx, -0.36);
  assert.equal(layout.hatch.openAngle, -68);
  assert.equal(layout.customerTarget.x, layout.hatch.cx);
  assert.equal(layout.customerTarget.z, -2.83);
});
