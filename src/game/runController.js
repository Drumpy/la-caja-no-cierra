import { TRANSACTIONS } from "../content/transactions.js";
import { cloneState, createInitialState } from "./state.js";
import { resolveTransactionAction } from "./transactionEngine.js";

// Cola por noche
const NIGHT_QUEUES = {
  1: ["taxista-lluvia-01", "julia-libreta-01", "yona-aviso-01"],
  2: ["delivery-apurado-01", "cuidacoches-radar-01", "cheto-premium-01", "flaco-frio-01"],
  3: ["mabel-entrada-01", "mabel-oraculo-01"],
};

const NIGHT_INFO = {
  1: { title: "Turno nuevo", subtitle: "Lluvia fina. Primer turno del almacen.", state: "lluvia-fina" },
  2: { title: "Fiado", subtitle: "La libreta ya tiene paginas usadas. La calle se mueve.", state: "lluvia-fina" },
  3: { title: "Tablado", subtitle: "Tambores lejanos. Alguien del carnaval viene a verte.", state: "tablado" },
};

const MAX_NIGHT = 3;

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

  function startNight(n) {
    queue = [...(NIGHT_QUEUES[n] ?? [])];
    currentId = queue.shift() ?? null;
    state = { ...state, selectedProductIds: [] };
    phase = "playing";
  }

  function closeIfDone() {
    if (currentId || phase !== "playing") return;
    if (night >= MAX_NIGHT) {
      phase = "gameEnd";
      state = { ...state, lastMessage: "La caja no cierra. Saldo pendiente: una noche mas." };
    } else {
      phase = "nightClosed";
      state = { ...state, lastMessage: `Cierre de noche ${night}. La caja cuenta sola.` };
    }
  }

  const controller = {
    start() {
      if (phase !== "title") return controller.getSnapshot();
      night = 1;
      state = createInitialState();
      startNight(1);
      emit();
      return controller.getSnapshot();
    },

    nextNight() {
      if (phase !== "nightClosed") return controller.getSnapshot();
      night++;
      startNight(night);
      emit();
      return controller.getSnapshot();
    },

    restart() {
      night = 1;
      state = createInitialState();
      phase = "title";
      emit();
      return controller.getSnapshot();
    },

    chooseAction(actionId) {
      if (phase !== "playing" || !currentId) return controller.getSnapshot();

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
      if (!transaction?.request.productIds.includes(productId)) return controller.getSnapshot();
      if (state.selectedProductIds.includes(productId)) return controller.getSnapshot();
      state = { ...state, selectedProductIds: [...state.selectedProductIds, productId] };
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
