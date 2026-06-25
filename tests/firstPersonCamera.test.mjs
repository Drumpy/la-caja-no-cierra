import assert from "node:assert/strict";
import test from "node:test";
import { applyLookDelta } from "../src/playcanvas/firstPersonCamera.js";

test("mouse look applies deltas and clamps pitch", () => {
  assert.deepEqual(
    applyLookDelta({ yaw: 0, pitch: 0 }, { dx: 10, dy: -20, sensitivity: 0.2 }),
    { yaw: -2, pitch: 4 },
  );

  assert.deepEqual(
    applyLookDelta({ yaw: 0, pitch: 24 }, { dx: 0, dy: -20, sensitivity: 0.2 }),
    { yaw: 0, pitch: 25 },
  );

  assert.deepEqual(
    applyLookDelta({ yaw: 0, pitch: -59 }, { dx: 0, dy: 20, sensitivity: 0.2 }),
    { yaw: 0, pitch: -60 },
  );
});
