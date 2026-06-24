import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCTS } from "../src/content/products.js";
import { CUSTOMERS } from "../src/content/customers.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("V0 core products exist", () => {
  for (const id of ["cafe", "chicles", "cigarros-ficticios", "vela"]) {
    assert.ok(PRODUCTS[id], `Missing core product ${id}`);
  }
});

test("all products have valid prices", () => {
  for (const p of Object.values(PRODUCTS)) {
    assert.ok(typeof p.price === "number" && p.price >= 0, `${p.id} has invalid price`);
    assert.ok(p.label, `${p.id} missing label`);
    assert.ok(p.symbols, `${p.id} missing symbols`);
  }
});

test("all customers have displayName and color", () => {
  for (const c of Object.values(CUSTOMERS)) {
    assert.ok(c.displayName, `${c.id} missing displayName`);
    assert.ok(c.color, `${c.id} missing color`);
    assert.ok(c.role, `${c.id} missing role`);
  }
});

test("all transaction product ids exist", () => {
  for (const tx of Object.values(TRANSACTIONS)) {
    for (const productId of tx.request.productIds) {
      assert.ok(PRODUCTS[productId], `${tx.id} references missing ${productId}`);
    }
  }
});

test("all transaction customer ids exist", () => {
  for (const tx of Object.values(TRANSACTIONS)) {
    assert.ok(CUSTOMERS[tx.customerId], `${tx.id} references missing customer`);
  }
});

test("V0 content uses named characters, not type labels", () => {
  assert.equal(CUSTOMERS["el-yona"].displayName, "El Yona");
  assert.equal(CUSTOMERS["julia-r"].displayName, "Julia R.");
});
