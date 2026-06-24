import { TRANSACTIONS } from "../content/transactions.js";
import { cloneState, createInitialState } from "./state.js";
import { resolveTransactionAction } from "./transactionEngine.js";

const BASE_QUEUE = ["taxista-lluvia-01", "julia-libreta-01", "yona-aviso-01"];

function resolveQueue(queue) {
  return queue.map((id) => {
    const tx = TRANSACTIONS[id];
    if (!tx) throw new Error(`Missing transaction ${id}`);
    return tx;
  });
}

function cloneTransaction(transaction) {
  return transaction ? structuredClone(transaction) : null;
}

export function createRunController() {
  let state = createInitialState();
  let queue = [...BASE_QUEUE];
  let currentId = queue.shift();
  let closed = false;
  const listeners = new Set();

  function emit() {
    const snapshot = controller.getSnapshot();
    for (const listener of Array.from(listeners)) listener(snapshot);
  }

  function closeIfDone() {
    if (currentId || closed) return;
    closed = true;
    state = {
      ...state,
      lastMessage: "La caja no cierra. Saldo pendiente: una noche mas.",
    };
  }

  const controller = {
    chooseAction(actionId) {
      if (closed || !currentId) return controller.getSnapshot();

      const transaction = TRANSACTIONS[currentId];
      if (!transaction.actions[actionId]) {
        state = { ...state, lastMessage: "La caja no entiende esa accion." };
        emit();
        return controller.getSnapshot();
      }

      const result = resolveTransactionAction(state, transaction, actionId);
      state = result.state;
      queue.push(...result.deferredTransactionIds);
      currentId = queue.shift() ?? null;
      closeIfDone();
      emit();
      return controller.getSnapshot();
    },

    selectProduct(productId) {
      const transaction = currentId ? TRANSACTIONS[currentId] : null;
      if (!transaction?.request.productIds.includes(productId)) {
        return controller.getSnapshot();
      }

      if (state.selectedProductIds.includes(productId)) return controller.getSnapshot();
      state = {
        ...state,
        selectedProductIds: [...state.selectedProductIds, productId],
      };
      emit();
      return controller.getSnapshot();
    },

    clearProducts() {
      state = { ...state, selectedProductIds: [] };
      emit();
      return controller.getSnapshot();
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(controller.getSnapshot());
      return () => listeners.delete(listener);
    },

    getSnapshot() {
      return {
        state: cloneState(state),
        queue: resolveQueue(queue).map(cloneTransaction),
        currentTransaction: cloneTransaction(currentId ? TRANSACTIONS[currentId] : null),
        closed,
      };
    },
  };

  return controller;
}
