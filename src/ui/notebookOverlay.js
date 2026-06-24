import { CUSTOMERS } from "../content/customers.js";

export function createNotebookOverlay(root, runController) {
  root.insertAdjacentHTML("beforeend", `<div class="notebook-overlay" hidden></div>`);
  const el = root.querySelector(".notebook-overlay");

  function render(snap) {
    const { state } = snap;
    const activeDebts = Object.entries(state.debts);
    const oldDebts = Object.entries(state.oldDebts);

    el.innerHTML = `
      <div class="notebook-page">
        <div class="notebook-title">LIBRETA DE FIADO</div>
        ${activeDebts.length === 0 && oldDebts.length === 0 ? `
          <p class="notebook-empty">Las paginas estan en blanco.<br>Pero hay marcas de algo escrito y borrado.</p>
        ` : ""}
        ${activeDebts.length > 0 ? `
          <div class="notebook-section">Deudas activas</div>
          ${activeDebts.map(([id, debt]) => `
            <div class="notebook-line">
              <strong>${CUSTOMERS[id]?.displayName ?? id}</strong>
              <span>$${debt.amount}</span>
              <small>${debt.notes.join(", ")}</small>
            </div>
          `).join("")}
        ` : ""}
        ${oldDebts.length > 0 ? `
          <div class="notebook-section notebook-old">Deudas viejas</div>
          ${oldDebts.map(([id, debt]) => `
            <div class="notebook-line notebook-faded">
              <strong>${CUSTOMERS[id]?.displayName ?? id}</strong>
              <span>${debt.note}</span>
              <small>Saldo pendiente desde ${debt.since}</small>
            </div>
          `).join("")}
        ` : ""}
        <button class="notebook-close" data-notebook-close>Cerrar libreta</button>
      </div>
    `;
  }

  let visible = false;

  function toggle() {
    visible = !visible;
    el.hidden = !visible;
    if (visible) render(runController.getSnapshot());
  }

  el.addEventListener("click", (e) => {
    if (e.target.dataset.notebookClose !== undefined) toggle();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyL" && runController.getSnapshot().phase === "playing") toggle();
  });

  const unsubscribe = runController.subscribe((snap) => {
    if (visible) render(snap);
  });

  return {
    toggle,
    destroy() {
      unsubscribe();
      el.remove();
    },
  };
}
