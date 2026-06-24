import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState } from "../src/game/state.js";
import { resolveTransactionAction } from "../src/game/transactionEngine.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("charging the taxista adds money and prints ticket symbols", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["taxista-lluvia-01"],
    "charge",
  );

  assert.equal(result.state.money, 190);
  assert.equal(result.state.curse, 1);
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

test("opening Julia's notebook records old debt and increases curse", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["julia-libreta-01"],
    "openNotebook",
  );

  assert.equal(result.state.curse, 2);
  assert.deepEqual(result.state.oldDebts["julia-r"], {
    note: "Pan, leche, vela",
    since: "1998",
    amount: 0,
  });
  assert.match(result.message, /Saldo pendiente desde 1998/);
});

test("unknown action throws a useful error", () => {
  const state = createInitialState();
  assert.throws(
    () =>
      resolveTransactionAction(
        state,
        TRANSACTIONS["taxista-lluvia-01"],
        "dance",
      ),
    /Unknown action dance/,
  );
});

test("ticket symbols are isolated from source content and prior state", () => {
  const state = createInitialState();
  const first = resolveTransactionAction(
    state,
    TRANSACTIONS["taxista-lluvia-01"],
    "charge",
  );
  const second = resolveTransactionAction(
    first.state,
    TRANSACTIONS["julia-libreta-01"],
    "charge",
  );

  first.ticket.symbols.push("mutated");
  second.state.lastTicket.symbols.push("changed");

  assert.deepEqual(
    TRANSACTIONS["taxista-lluvia-01"].actions.charge.ticketSymbols,
    ["taxi", "humo", "lluvia"],
  );
  assert.deepEqual(first.state.lastTicket.symbols, ["taxi", "humo", "lluvia"]);
  assert.deepEqual(second.ticket.symbols, ["vela", "lluvia"]);
}
);
