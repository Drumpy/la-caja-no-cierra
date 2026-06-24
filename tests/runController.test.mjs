import assert from "node:assert/strict";
import test from "node:test";
import { createRunController } from "../src/game/runController.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("run starts with the taxista transaction", () => {
  const run = createRunController();
  assert.equal(run.getSnapshot().currentTransaction.id, "taxista-lluvia-01");
});

test("charging advances from taxista to Julia", () => {
  const run = createRunController();
  run.chooseAction("charge");
  assert.equal(run.getSnapshot().currentTransaction.id, "julia-libreta-01");
});

test("crediting taxista appends his return after base queue", () => {
  const run = createRunController();
  run.chooseAction("credit");
  run.chooseAction("charge");
  run.chooseAction("charge");
  assert.equal(run.getSnapshot().currentTransaction.id, "taxista-vuelve-01");
});

test("run closes after queue is empty", () => {
  const run = createRunController();
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.chooseAction("charge");
  const snapshot = run.getSnapshot();
  assert.equal(snapshot.currentTransaction, null);
  assert.equal(snapshot.closed, true);
  assert.match(snapshot.state.lastMessage, /Saldo pendiente/);
});

test("snapshots do not expose mutable controller state or content", () => {
  const run = createRunController();
  const snapshot = run.getSnapshot();

  snapshot.state.money = 999;
  snapshot.currentTransaction.actions.charge.ticketSymbols.push("mutated");

  assert.equal(run.getSnapshot().state.money, 0);
  assert.deepEqual(
    TRANSACTIONS["taxista-lluvia-01"].actions.charge.ticketSymbols,
    ["taxi", "humo", "lluvia"],
  );
});

test("listeners added or removed during emit do not affect current emit", () => {
  const run = createRunController();
  const calls = [];
  let unsubscribeSecond = () => {};

  run.subscribe(() => {
    calls.push("first");
    unsubscribeSecond();
  });
  unsubscribeSecond = run.subscribe(() => {
    calls.push("second");
  });

  calls.length = 0;
  run.chooseAction("charge");

  assert.deepEqual(calls, ["first", "second"]);
});

test("invalid actions do not throw or advance the customer", () => {
  const run = createRunController();

  assert.doesNotThrow(() => run.chooseAction("dance"));

  const snapshot = run.getSnapshot();
  assert.equal(snapshot.currentTransaction.id, "taxista-lluvia-01");
  assert.equal(snapshot.state.lastMessage, "La caja no entiende esa accion.");
});

test("product selection rejects products outside the current request", () => {
  const run = createRunController();

  run.selectProduct("vela");
  assert.deepEqual(run.getSnapshot().state.selectedProductIds, []);

  run.selectProduct("cafe");
  assert.deepEqual(run.getSnapshot().state.selectedProductIds, ["cafe"]);
});
