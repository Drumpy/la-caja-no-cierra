export function createInitialState() {
  return {
    money: 0,
    curse: 0,
    reputation: 0,
    debts: {},
    oldDebts: {},
    selectedProductIds: [],
    lastTicket: null,
    lastMessage: "La lluvia golpea la ventanilla.",
  };
}

export function cloneState(state) {
  return {
    ...state,
    debts: structuredClone(state.debts),
    oldDebts: structuredClone(state.oldDebts),
    selectedProductIds: [...state.selectedProductIds],
    lastTicket: state.lastTicket
      ? { ...state.lastTicket, symbols: [...state.lastTicket.symbols] }
      : null,
  };
}
