import { CUSTOMERS } from "../content/customers.js";
import { PRODUCTS } from "../content/products.js";

function moneyLabel(value) {
  return `$${value}`;
}

function productText(productIds) {
  if (!productIds.length) return "Sin productos seleccionados";
  return productIds.map((id) => PRODUCTS[id]?.label ?? id).join(", ");
}

function renderProducts(selectedProductIds) {
  return `
    <div class="product-buttons">
      ${Object.values(PRODUCTS)
        .map((product) => {
          const selected = selectedProductIds.includes(product.id);
          return `<button type="button" data-product="${product.id}">
            ${selected ? "* " : ""}${product.label}
          </button>`;
        })
        .join("")}
    </div>
  `;
}

function renderActions(transaction) {
  if (!transaction) return "<button disabled>Caja cerrada</button>";
  return Object.entries(transaction.actions)
    .map(
      ([id, action]) =>
        `<button type="button" data-action="${id}">${action.label}</button>`,
    )
    .join("");
}

export function createDomHud(root, runController) {
  root.innerHTML = `<div class="controls-hint">Arrastra para mirar &middot; Click objetos para usar &middot; Scroll para zoom</div><div class="hud"></div>`;
  const hud = root.querySelector(".hud");

  function render(snapshot) {
    const tx = snapshot.currentTransaction;
    const customer = tx ? CUSTOMERS[tx.customerId] : null;
    const selected = snapshot.state.selectedProductIds;

    hud.innerHTML = `
      <section class="panel stats">
        <strong>Turno nuevo</strong>
        <span>Plata: ${moneyLabel(snapshot.state.money)}</span>
        <span>Maldicion: ${snapshot.state.curse}</span>
        <span>Reputacion: ${snapshot.state.reputation}</span>
        <span>Deudas activas: ${Object.keys(snapshot.state.debts).length}</span>
        <span class="selected-products">${productText(selected)}</span>
      </section>
      <section class="panel customer-line">
        <strong>${customer?.displayName ?? "Cierre de caja"}</strong>
        <p>${tx?.request.line ?? snapshot.state.lastMessage}</p>
        <small>${snapshot.state.lastMessage}</small>
      </section>
      <section class="panel actions">
        ${renderProducts(snapshot.state.selectedProductIds)}
        ${renderActions(tx)}
      </section>
    `;

    hud.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        runController.chooseAction(button.dataset.action);
      });
    });

    hud.querySelectorAll("[data-product]").forEach((button) => {
      button.addEventListener("click", () => {
        runController.selectProduct(button.dataset.product);
      });
    });
  }

  const unsubscribe = runController.subscribe(render);

  return {
    destroy() {
      unsubscribe();
      root.innerHTML = "";
    },
  };
}
