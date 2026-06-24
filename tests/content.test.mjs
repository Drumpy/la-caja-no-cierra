import assert from "node:assert/strict";
import test from "node:test";
import { CUSTOMERS } from "../src/content/customers.js";
import { PRODUCTS } from "../src/content/products.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("V0 has only the four playable products", () => {
  assert.deepEqual(Object.keys(PRODUCTS).sort(), [
    "cafe",
    "chicles",
    "cigarros-ficticios",
    "vela",
  ]);
});

test("all products have valid prices", () => {
  for (const product of Object.values(PRODUCTS)) {
    assert.ok(typeof product.price === "number" && product.price >= 0);
    assert.ok(product.label, `${product.id} missing label`);
    assert.ok(product.symbols, `${product.id} missing symbols`);
  }
});

test("V0 uses named characters, not type labels", () => {
  assert.deepEqual(Object.keys(CUSTOMERS).sort(), ["el-yona", "julia-r", "taxista"]);
  assert.equal(CUSTOMERS["el-yona"].displayName, "El Yona");
  assert.equal(CUSTOMERS["julia-r"].displayName, "Julia R.");
});

test("all customers have displayName, role, and color", () => {
  for (const customer of Object.values(CUSTOMERS)) {
    assert.ok(customer.displayName, `${customer.id} missing displayName`);
    assert.ok(customer.color, `${customer.id} missing color`);
    assert.ok(customer.role, `${customer.id} missing role`);
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
