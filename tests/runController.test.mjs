import assert from "node:assert/strict";
import test from "node:test";
import { createRunController } from "../src/game/runController.js";

function selectRequested(run) {
  const tx = run.getSnapshot().currentTransaction;
  for (const productId of tx.request.productIds) run.selectProduct(productId);
}

function resolveWithProducts(run, actionId = "charge") {
  selectRequested(run);
  return run.chooseAction(actionId);
}

test("run starts in title phase", () => {
  const run = createRunController();

  assert.equal(run.getSnapshot().phase, "title");
  assert.equal(run.getSnapshot().currentTransaction, null);
});

test("start() begins night 1 with the taxista", () => {
  const run = createRunController();

  run.start();
  const snap = run.getSnapshot();

  assert.equal(snap.phase, "playing");
  assert.equal(snap.night, 1);
  assert.equal(snap.maxNight, 1);
  assert.equal(snap.currentTransaction.id, "taxista-lluvia-01");
});

test("money actions require the requested products", () => {
  const run = createRunController();
  run.start();

  run.chooseAction("charge");
  let snap = run.getSnapshot();
  assert.equal(snap.currentTransaction.id, "taxista-lluvia-01");
  assert.match(snap.state.lastMessage, /Falta entregar: Cafe, Cigarros, Chicles/);

  selectRequested(run);
  snap = run.chooseAction("charge");
  assert.equal(snap.currentTransaction.id, "julia-libreta-01");
});

test("product selection toggles and rejects products outside the request", () => {
  const run = createRunController();
  run.start();

  run.selectProduct("cafe");
  assert.deepEqual(run.getSnapshot().state.selectedProductIds, ["cafe"]);

  run.selectProduct("cafe");
  assert.deepEqual(run.getSnapshot().state.selectedProductIds, []);

  run.selectProduct("vela");
  const snap = run.getSnapshot();
  assert.deepEqual(snap.state.selectedProductIds, []);
  assert.equal(snap.state.lastMessage, "Eso no es lo que pidieron.");
});

test("charging advances taxista to Julia", () => {
  const run = createRunController();
  run.start();

  resolveWithProducts(run, "charge");

  assert.equal(run.getSnapshot().currentTransaction.id, "julia-libreta-01");
});

test("opening Julia's notebook resolves before El Yona", () => {
  const run = createRunController();
  run.start();
  resolveWithProducts(run, "charge");

  run.chooseAction("openNotebook");
  const snap = run.getSnapshot();

  assert.equal(snap.currentTransaction.id, "julia-deuda-1998-01");
  assert.deepEqual(snap.state.oldDebts["julia-r"], {
    note: "Pan, leche, vela",
    since: "1998",
    amount: 0,
  });
});

test("forgiving Julia's old debt clears it then advances to El Yona", () => {
  const run = createRunController();
  run.start();
  resolveWithProducts(run, "charge");
  run.chooseAction("openNotebook");

  const snap = run.chooseAction("forgiveOldDebt");

  assert.equal(snap.currentTransaction.id, "yona-aviso-01");
  assert.equal(snap.state.oldDebts["julia-r"], undefined);
  assert.equal(snap.state.money, 135);
  assert.equal(snap.state.curse, 1);
});

test("crediting taxista appends his return after the base queue", () => {
  const run = createRunController();
  run.start();

  resolveWithProducts(run, "credit");
  resolveWithProducts(run, "charge");
  resolveWithProducts(run, "charge");

  assert.equal(run.getSnapshot().currentTransaction.id, "taxista-vuelve-01");
});

test("V0 closes the run after night 1", () => {
  const run = createRunController();
  run.start();

  resolveWithProducts(run, "charge");
  resolveWithProducts(run, "charge");
  resolveWithProducts(run, "charge");
  const snap = run.getSnapshot();

  assert.equal(snap.currentTransaction, null);
  assert.equal(snap.phase, "gameEnd");
  assert.equal(snap.night, 1);
  assert.match(snap.state.lastMessage, /Falta una deuda/);
});

test("restart returns to title", () => {
  const run = createRunController();
  run.start();
  resolveWithProducts(run, "charge");
  resolveWithProducts(run, "charge");
  resolveWithProducts(run, "charge");

  run.restart();
  const snap = run.getSnapshot();

  assert.equal(snap.phase, "title");
  assert.equal(snap.night, 1);
  assert.equal(snap.currentTransaction, null);
});

test("snapshots do not expose mutable controller state", () => {
  const run = createRunController();
  run.start();
  const snap = run.getSnapshot();

  snap.state.money = 999;
  snap.queue.length = 0;
  snap.currentTransaction.request.productIds.length = 0;

  const next = run.getSnapshot();
  assert.equal(next.state.money, 0);
  assert.equal(next.queue.length, 2);
  assert.deepEqual(next.currentTransaction.request.productIds, [
    "cafe",
    "cigarros-ficticios",
    "chicles",
  ]);
});

test("invalid actions do not throw or advance", () => {
  const run = createRunController();
  run.start();

  run.chooseAction("wat");
  const snap = run.getSnapshot();

  assert.equal(snap.currentTransaction.id, "taxista-lluvia-01");
  assert.equal(snap.state.lastMessage, "La caja no entiende esa accion.");
});
