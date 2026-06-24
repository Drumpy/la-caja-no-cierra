import { CUSTOMERS } from "../content/customers.js";
import { PRODUCTS } from "../content/products.js";

function moneyLabel(value) {
  return value >= 0 ? `$${value}` : `-$${-value}`;
}

function productText(productIds) {
  if (!productIds.length) return "Sin productos seleccionados";
  return productIds.map((id) => PRODUCTS[id]?.label ?? id).join(", ");
}

function renderProducts(selectedProductIds) {
  return `
    <div class="product-buttons">
      ${Object.values(PRODUCTS)
        .filter((p) => p.visible)
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
    .map(([id, action]) => `<button type="button" data-action="${id}">${action.label}</button>`)
    .join("");
}

function renderTitleScreen() {
  return `
    <div class="screen title-screen">
      <h1>La Caja No Cierra</h1>
      <p class="subtitle">Atendes un almacen uruguayo de madrugada.<br>Fias productos a clientes imposibles.<br>La libreta cobra deudas de vivos y muertos.</p>
      <button class="big-button" data-action="start">Empezar turno</button>
    </div>
  `;
}

function renderNightIntro(night, nightInfo) {
  return `
    <div class="screen night-intro">
      <small>Noche ${night}</small>
      <h2>${nightInfo.title}</h2>
      <p>${nightInfo.subtitle}</p>
      <button class="big-button" data-action="start">Abrir el local</button>
    </div>
  `;
}

function renderNightClosed(night, state) {
  return `
    <div class="screen night-closed">
      <h2>Cierre de noche ${night}</h2>
      <div class="closure-stats">
        <span>Plata: ${moneyLabel(state.money)}</span>
        <span>Maldicion: ${state.curse}</span>
        <span>Reputacion: ${state.reputation}</span>
        <span>Deudas: ${Object.keys(state.debts).length}</span>
      </div>
      <p class="closure-message">${state.lastMessage}</p>
      <button class="big-button" data-action="nextNight">Abrir la siguiente noche</button>
    </div>
  `;
}

function renderGameEnd(state) {
  return `
    <div class="screen game-end">
      <h2>La caja no cierra</h2>
      <div class="closure-stats">
        <span>Plata final: ${moneyLabel(state.money)}</span>
        <span>Maldicion final: ${state.curse}</span>
        <span>Reputacion: ${state.reputation}</span>
      </div>
      <p class="closure-message">${state.lastMessage}</p>
      <p class="end-flavor">Saldo pendiente: una noche mas.</p>
      <button class="big-button" data-action="restart">Otra noche</button>
    </div>
  `;
}

export function createDomHud(root, runController) {
  root.innerHTML = `<div class="controls-hint">Arrastra para mirar &middot; WASD para moverte &middot; Click objetos para usar</div><div class="hud"></div>`;
  const hud = root.querySelector(".hud");

  function render(snapshot) {
    const { phase, night, nightInfo, state, currentTransaction } = snapshot;

    if (phase === "title") {
      hud.innerHTML = renderTitleScreen();
      hud.querySelector("[data-action=start]")?.addEventListener("click", () => runController.start());
      return;
    }

    if (phase === "nightClosed") {
      hud.innerHTML = renderNightClosed(night, state);
      hud.querySelector("[data-action=nextNight]")?.addEventListener("click", () => runController.nextNight());
      return;
    }

    if (phase === "gameEnd") {
      hud.innerHTML = renderGameEnd(state);
      hud.querySelector("[data-action=restart]")?.addEventListener("click", () => runController.restart());
      return;
    }

    // Playing
    const tx = currentTransaction;
    const customer = tx ? CUSTOMERS[tx.customerId] : null;
    const selected = state.selectedProductIds;

    hud.innerHTML = `
      <section class="panel stats">
        <strong>Noche ${night}: ${nightInfo?.title ?? ""}</strong>
        <span>Plata: <span class="stat-value">${moneyLabel(state.money)}</span></span>
        <span>Maldicion: <span class="stat-value">${state.curse}</span></span>
        <span>Reputacion: <span class="stat-value">${state.reputation}</span></span>
        <span>Deudas: <span class="stat-value">${Object.keys(state.debts).length}</span></span>
        <span class="selected-products">${productText(selected)}</span>
      </section>
      <section class="panel customer-line">
        <strong>${customer?.displayName ?? "Cierre de caja"}</strong>
        <p>${tx?.request.line ?? state.lastMessage}</p>
        <small>${state.lastMessage}</small>
      </section>
      <section class="panel actions">
        ${renderProducts(selected)}
        ${renderActions(tx)}
      </section>
    `;

    hud.querySelectorAll("[data-action]").forEach((button) => {
      if (button.dataset.action === "start" || button.dataset.action === "nextNight" || button.dataset.action === "restart") return;
      button.addEventListener("click", () => runController.chooseAction(button.dataset.action));
    });

    hud.querySelectorAll("[data-product]").forEach((button) => {
      button.addEventListener("click", () => runController.selectProduct(button.dataset.product));
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
