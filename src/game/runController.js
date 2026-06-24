import { PRODUCTS } from "../content/products.js";
import { TRANSACTIONS } from "../content/transactions.js";
import { cloneState, createInitialState } from "./state.js";
import {
  requiresProductsForAction,
  resolveTransactionAction,
} from "./transactionEngine.js";

const NIGHT_QUEUES = {
  1: ["taxista-lluvia-01", "julia-libreta-01", "yona-aviso-01"],
};

const NIGHT_INFO = {
  1: {
    title: "Turno nuevo",
    subtitle: "Lluvia fina. Primer turno del almacen.",
    state: "lluvia-fina",
  },
};

const MAX_NIGHT = 1;

function resolveQueue(queue) {
  return queue.map((id) => {
    const tx = TRANSACTIONS[id];
    if (!tx) throw new Error(`Missing transaction ${id}`);
    return tx;
  });
}

function cloneTx(transaction) {
  return transaction ? structuredClone(transaction) : null;
}

function productLabel(productId) {
  return PRODUCTS[productId]?.label ?? productId;
}

function missingProductIds(state, transaction) {
  return transaction.request.productIds.filter(
    (productId) => !state.selectedProductIds.includes(productId),
  );
}

function withMessage(state, lastMessage) {
  return { ...state, lastMessage };
}

export function createRunController() {
  let phase = "title"; // title | playing | nightClosed | gameEnd
  let night = 1;
  let state = createInitialState();
  let queue = [];
  let currentId = null;
  const listeners = new Set();

  function emit() {
    const snap = controller.getSnapshot();
    for (const listener of Array.from(listeners)) listener(snap);
  }

  function closeIfDone() {
    if (phase !== "playing" || currentId) return;
    const finalNight = night >= MAX_NIGHT;
    phase = finalNight ? "gameEnd" : "nightClosed";
    state = withMessage(
      state,
      finalNight
        ? "Cierre de caja. Falta una deuda que nadie recuerda haber anotado."
        : `Cierre de noche ${night}. La caja cuenta sola.`,
    );
  }

  function startNight(n) {
    night = n;
    phase = "playing";
    queue = [...(NIGHT_QUEUES[n] ?? [])];
    currentId = queue.shift() ?? null;
    state = withMessage(createInitialState(), NIGHT_INFO[n]?.subtitle ?? "Turno abierto.");
    closeIfDone();
  }

  const controller = {
    start() {
      if (phase !== "title" && phase !== "gameEnd") return controller.getSnapshot();
      startNight(1);
      emit();
      return controller.getSnapshot();
    },

    nextNight() {
      if (phase !== "nightClosed") return controller.getSnapshot();
      if (night >= MAX_NIGHT) {
        phase = "gameEnd";
        emit();
        return controller.getSnapshot();
      }
      startNight(night + 1);
      emit();
      return controller.getSnapshot();
    },

    restart() {
      phase = "title";
      night = 1;
      state = createInitialState();
      queue = [];
      currentId = null;
      emit();
      return controller.getSnapshot();
    },

    chooseAction(actionId) {
      if (phase !== "playing" || !currentId) return controller.getSnapshot();
      const transaction = TRANSACTIONS[currentId];
      const action = transaction.actions[actionId];

      if (!action) {
        state = withMessage(state, "La caja no entiende esa accion.");
        emit();
        return controller.getSnapshot();
      }

      const missing = missingProductIds(state, transaction);
      if (requiresProductsForAction(actionId, action) && missing.length > 0) {
        state = withMessage(
          state,
          `Falta entregar: ${missing.map(productLabel).join(", ")}.`,
        );
        emit();
        return controller.getSnapshot();
      }

      const result = resolveTransactionAction(state, transaction, actionId);
      state = result.state;

      if (result.nextTransactionId) queue.unshift(result.nextTransactionId);
      if (result.deferredTransactionIds.length > 0) {
        queue.push(...result.deferredTransactionIds);
      }

      currentId = queue.shift() ?? null;
      closeIfDone();
      emit();
      return controller.getSnapshot();
    },

    selectProduct(productId) {
      const transaction = currentId ? TRANSACTIONS[currentId] : null;
      if (!transaction?.request.productIds.includes(productId)) {
        state = withMessage(state, "Eso no es lo que pidieron.");
        emit();
        return controller.getSnapshot();
      }

      const selected = state.selectedProductIds.includes(productId)
        ? state.selectedProductIds.filter((id) => id !== productId)
        : [...state.selectedProductIds, productId];

      state = { ...state, selectedProductIds: selected };
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
        phase,
        night,
        nightInfo: NIGHT_INFO[night],
        state: cloneState(state),
        queue: resolveQueue(queue).map(cloneTx),
        currentTransaction: cloneTx(currentId ? TRANSACTIONS[currentId] : null),
        maxNight: MAX_NIGHT,
      };
    },
  };

  return controller;
}
