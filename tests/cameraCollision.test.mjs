import assert from "node:assert/strict";
import test from "node:test";
import { applyMovementConstraints } from "../src/playcanvas/firstPersonCamera.js";

const bounds = { minX: -1.45, maxX: 1.45, minZ: -2, maxZ: 1.9 };
const counter = { minX: -1.75, maxX: 1.75, minZ: -2.25, maxZ: -1.63 };
// Estantería del fondo: tablas a z=2.0, profundidad 0.32 -> frente con radio en z≈1.62.
const shelf = { minX: -1.625, maxX: 1.625, minZ: 1.84, maxZ: 2.16 };

test("camera cannot walk through the counter", () => {
  assert.deepEqual(
    applyMovementConstraints(
      { x: 0, y: 1.55, z: -1.55 },
      { x: 0, y: 1.55, z: -1.35 },
      { bounds, obstacles: [counter], radius: 0.22 },
    ),
    { x: 0, y: 1.55, z: -1.41 },
  );
});

test("camera cannot walk into the back shelf", () => {
  assert.deepEqual(
    applyMovementConstraints(
      { x: 0, y: 1.55, z: 1.85 },
      { x: 0, y: 1.55, z: 1.5 },
      { bounds, obstacles: [counter, shelf], radius: 0.22 },
    ),
    { x: 0, y: 1.55, z: shelf.minZ - 0.22 },
  );
});
