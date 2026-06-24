import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCTS } from "../src/content/products.js";
import { CUSTOMERS } from "../src/content/customers.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("V0 products include exactly the scoped product ids", () => {
  assert.deepEqual(
    Object.keys(PRODUCTS).sort(),
    ["cafe", "chicles", "cigarros-ficticios", "vela"].sort(),
  );
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
