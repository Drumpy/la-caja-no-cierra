import { CUSTOMERS } from "../content/customers.js";

const SYMBOL_GLYPHS = {
  taxi: "🚖", humo: "☁", lluvia: "🌧", vela: "🕯", libreta: "📓",
  mate: "🧉", boleto: "🎫", radio: "📻", futbol: "⚽", tablado: "🎭",
  taxi2: "🚖", sombra: "👤",
};

// Frases fantasma que la caja imprime cuando la maldición está alta.
const GHOST_LINES = [
  "saldo: una deuda que no anotaste",
  "gracias por su compra ████",
  "vuelva pronto. siempre vuelven.",
  "este ticket ya se imprimió antes",
  "no cierra. no cierra. no cierra.",
];

export function createTicketOverlay(root, runController) {
  root.insertAdjacentHTML("beforeend", `<div class="ticket-overlay" hidden></div>`);
  const el = root.querySelector(".ticket-overlay");
  let timer = null;

  function show(ticket, message, customerId, curse = 0) {
    const customer = CUSTOMERS[customerId];
    const glyphs = (ticket.symbols || []).map((s) => SYMBOL_GLYPHS[s] ?? "◆").join("  ");
    const cursed = curse >= 4;
    const ghost = cursed
      ? `<div class="ticket-ghost">${GHOST_LINES[Math.floor(Math.random() * GHOST_LINES.length)]}</div>`
      : "";
    const footer = cursed ? "~~~ c̷a̴j̶a̸ ̴r̷e̶g̴i̵s̷t̴r̶a̸d̷o̴r̶a̵ ~~~" : "~~~ caja registradora ~~~";

    el.innerHTML = `
      <div class="ticket-paper${cursed ? " ticket-glitch" : ""}">
        <div class="ticket-header">${customer?.displayName ?? "CLIENTE"}</div>
        <div class="ticket-symbols">${glyphs}</div>
        <div class="ticket-message">${message}</div>
        ${ghost}
        <div class="ticket-footer">${footer}</div>
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
      show(ticket, snap.state.lastMessage, ticket.customerId, snap.state.curse);
    }
  });

  return {
    destroy() {
      unsubscribe();
      el.remove();
    },
  };
}
