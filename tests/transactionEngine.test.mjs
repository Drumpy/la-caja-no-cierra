import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState } from "../src/game/state.js";
import {
  requiresProductsForAction,
  resolveTransactionAction,
} from "../src/game/transactionEngine.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("charging taxista adds money and prints ticket symbols", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["taxista-lluvia-01"],
    "charge",
  );

  assert.equal(result.state.money, 190);
  assert.equal(result.state.curse, 0);
  assert.deepEqual(result.ticket.symbols, ["taxi", "humo", "lluvia"]);
  assert.equal(result.message, "La radio repite una frase del pasajero.");
});

test("credit creates debt and schedules deferred transaction", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["taxista-lluvia-01"],
    "credit",
  );

  assert.equal(result.state.money, 0);
  assert.equal(result.state.reputation, 2);
  assert.deepEqual(result.state.debts.taxista, {
    amount: 190,
    notes: ["Cafe, cigarros y chicles"],
  });
  assert.deepEqual(result.deferredTransactionIds, ["taxista-vuelve-01"]);
});

test("opening Julia's notebook records old debt and queues the debt decision", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["julia-libreta-01"],
    "openNotebook",
  );

  assert.equal(result.state.curse, 2);
  assert.equal(result.nextTransactionId, "julia-deuda-1998-01");
  assert.deepEqual(result.state.oldDebts["julia-r"], {
    note: "Pan, leche, vela",
    since: "1998",
    amount: 0,
  });
  assert.match(result.message, /Saldo pendiente desde 1998/);
});

test("forgiving old debt removes the notebook line without negative curse", () => {
  const state = createInitialState();
  state.curse = 1;
  state.oldDebts["julia-r"] = {
    note: "Pan, leche, vela",
    since: "1998",
    amount: 0,
  };

  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["julia-deuda-1998-01"],
    "forgiveOldDebt",
  );

  assert.equal(result.state.curse, 0);
  assert.equal(result.state.oldDebts["julia-r"], undefined);
  assert.equal(result.state.money, -55);
});

test("action product requirements are centralized", () => {
  assert.equal(requiresProductsForAction("charge"), true);
  assert.equal(requiresProductsForAction("credit"), true);
  assert.equal(requiresProductsForAction("ask"), false);
  assert.equal(requiresProductsForAction("openNotebook"), false);
  assert.equal(requiresProductsForAction("charge", { requiresProducts: false }), false);
});

test("unknown action throws useful error", () => {
  const state = createInitialState();

  assert.throws(
    () => resolveTransactionAction(state, TRANSACTIONS["taxista-lluvia-01"], "wat"),
    /Unknown action wat/,
  );
});

test("ticket symbols are isolated from source content and prior state", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["taxista-lluvia-01"],
    "charge",
  );

  result.ticket.symbols.push("mutated");
  assert.deepEqual(
    TRANSACTIONS["taxista-lluvia-01"].actions.charge.ticketSymbols,
    ["taxi", "humo", "lluvia"],
  );
  assert.equal(state.lastTicket, null);
});
