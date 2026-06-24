import assert from "node:assert/strict";
import test from "node:test";
import { createRunController } from "../src/game/runController.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("run starts in title phase", () => {
  const run = createRunController();
  assert.equal(run.getSnapshot().phase, "title");
  assert.equal(run.getSnapshot().currentTransaction, null);
});

test("start() begins night 1 with taxista", () => {
  const run = createRunController();
  run.start();
  const snap = run.getSnapshot();
  assert.equal(snap.phase, "playing");
  assert.equal(snap.night, 1);
  assert.equal(snap.currentTransaction.id, "taxista-lluvia-01");
});

test("charging advances from taxista to Julia", () => {
  const run = createRunController();
  run.start();
  run.chooseAction("charge");
  assert.equal(run.getSnapshot().currentTransaction.id, "julia-libreta-01");
});

test("crediting taxista appends his return after base queue", () => {
  const run = createRunController();
  run.start();
  run.chooseAction("credit");
  run.chooseAction("charge");
  run.chooseAction("charge");
  assert.equal(run.getSnapshot().currentTransaction.id, "taxista-vuelve-01");
});

test("night 1 closes into nightClosed phase", () => {
  const run = createRunController();
  run.start();
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.chooseAction("charge");
  const snap = run.getSnapshot();
  assert.equal(snap.currentTransaction, null);
  assert.equal(snap.phase, "nightClosed");
  assert.equal(snap.night, 1);
});

test("nextNight advances to night 2", () => {
  const run = createRunController();
  run.start();
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.nextNight();
  const snap = run.getSnapshot();
  assert.equal(snap.phase, "playing");
  assert.equal(snap.night, 2);
  assert.equal(snap.currentTransaction.id, "delivery-apurado-01");
});

test("finishing night 3 triggers gameEnd", () => {
  const run = createRunController();
  run.start();
  // Night 1
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.nextNight();
  // Night 2
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.nextNight();
  // Night 3
  run.chooseAction("charge");
  run.chooseAction("charge");
  const snap = run.getSnapshot();
  assert.equal(snap.phase, "gameEnd");
  assert.match(snap.state.lastMessage, /Saldo pendiente/);
});

test("restart returns to title", () => {
  const run = createRunController();
  run.start();
  run.restart();
  assert.equal(run.getSnapshot().phase, "title");
});

test("snapshots do not expose mutable controller state or content", () => {
  const run = createRunController();
  run.start();
  const snap = run.getSnapshot();
  snap.state.money = 999;
  snap.currentTransaction.actions.charge.ticketSymbols.push("mutated");
  assert.equal(run.getSnapshot().state.money, 0);
  assert.deepEqual(TRANSACTIONS["taxista-lluvia-01"].actions.charge.ticketSymbols, ["taxi", "humo", "lluvia"]);
});

test("invalid actions do not throw or advance", () => {
  const run = createRunController();
  run.start();
  assert.doesNotThrow(() => run.chooseAction("dance"));
  const snap = run.getSnapshot();
  assert.equal(snap.currentTransaction.id, "taxista-lluvia-01");
  assert.equal(snap.state.lastMessage, "La caja no entiende esa accion.");
});

test("product selection rejects products outside the current request", () => {
  const run = createRunController();
  run.start();
  run.selectProduct("vela");
  assert.deepEqual(run.getSnapshot().state.selectedProductIds, []);
  run.selectProduct("cafe");
  assert.deepEqual(run.getSnapshot().state.selectedProductIds, ["cafe"]);
});
