import { cloneState } from "./state.js";

function addDebt(state, debt) {
  if (!debt) return;
  const current = state.debts[debt.customerId] ?? { amount: 0, notes: [] };
  state.debts[debt.customerId] = {
    amount: current.amount + debt.amount,
    notes: [...current.notes, debt.note],
  };
}

function addOldDebt(state, oldDebt) {
  if (!oldDebt) return;
  state.oldDebts[oldDebt.customerId] = {
    note: oldDebt.note,
    since: oldDebt.since,
    amount: oldDebt.amount,
  };
}

export function resolveTransactionAction(state, transaction, actionId) {
  const action = transaction.actions[actionId];
  if (!action) {
    throw new Error(`Unknown action ${actionId} for ${transaction.id}`);
  }

  const next = cloneState(state);
  next.money += action.money ?? 0;
  next.curse += action.curse ?? 0;
  next.reputation += action.reputation ?? 0;

  addDebt(next, action.debt);
  addOldDebt(next, action.oldDebt);

  const ticket = {
    transactionId: transaction.id,
    customerId: transaction.customerId,
    actionId,
    symbols: [...(action.ticketSymbols ?? [])],
  };

  const message = action.effectText ?? action.clueText ?? "La caja no dice nada.";

  next.lastTicket = { ...ticket, symbols: [...ticket.symbols] };
  next.lastMessage = message;
  next.selectedProductIds = [];

  return {
    state: next,
    ticket,
    message,
    deferredTransactionIds: action.deferredTransactionId
      ? [action.deferredTransactionId]
      : [],
  };
}
