import assert from "node:assert/strict";
import test from "node:test";
import { bookshelfLayout, counterLayout } from "../src/playcanvas/createScene.js";

test("counter spans wall and reaches the window sill", () => {
  const layout = counterLayout({ width: 3.5, frontZ: -2.25, sillH: 0.95 });

  assert.equal(layout.pos.x, 0);
  assert.equal(layout.pos.y + layout.scale.y / 2, 0.95);
  assert.equal(layout.scale.x, 3.5);
  assert.equal(layout.pos.z - layout.scale.z / 2, -2.25);
});

test("bookshelf spans the back wall and holds all products", () => {
  const shelf = bookshelfLayout({ width: 3.5, backZ: 2.25 });

  assert.equal(shelf.width, 3.25);
  assert.equal(shelf.z, 2.0);
  assert.equal(shelf.shelves.length, 3);
  assert.deepEqual(Object.keys(shelf.products).sort(), ["cafe", "chicles", "cigarros-ficticios", "vela"]);
  for (const product of Object.values(shelf.products)) {
    assert.ok(product.x > -1.625 && product.x < 1.625);
    assert.ok(shelf.shelves.includes(product.shelfY));
  }
});
