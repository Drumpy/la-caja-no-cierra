import { CUSTOMERS } from "../content/customers.js";

const SYMBOL_GLYPHS = {
  taxi: "🚖", humo: "☁", lluvia: "🌧", vela: "🕯", libreta: "📓",
  mate: "🧉", boleto: "🎫", radio: "📻", futbol: "⚽", tablado: "🎭",
  taxi2: "🚖", sombra: "👤",
};

export function createTicketOverlay(root, runController) {
  root.insertAdjacentHTML("beforeend", `<div class="ticket-overlay" hidden></div>`);
  const el = root.querySelector(".ticket-overlay");
  let timer = null;

  function show(ticket, message, customerId) {
    const customer = CUSTOMERS[customerId];
    const glyphs = (ticket.symbols || []).map((s) => SYMBOL_GLYPHS[s] ?? "◆").join("  ");

    el.innerHTML = `
      <div class="ticket-paper">
        <div class="ticket-header">${customer?.displayName ?? "CLIENTE"}</div>
        <div class="ticket-symbols">${glyphs}</div>
        <div class="ticket-message">${message}</div>
        <div class="ticket-footer">~~~ caja registradora ~~~</div>
      </div>
    `;
    el.hidden = false;
    el.classList.add("ticket-show");

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      el.classList.remove("ticket-show");
      el.hidden = true;
    }, 4000);
  }

  let lastTicket = null;
  const unsubscribe = runController.subscribe((snap) => {
    const ticket = snap.state.lastTicket;
    if (!ticket || ticket === lastTicket) return;
    lastTicket = ticket;
    if (snap.phase === "playing") {
      show(ticket, snap.state.lastMessage, ticket.customerId);
    }
  });

  return {
    destroy() {
      unsubscribe();
      el.remove();
    },
  };
}
