import { CUSTOMERS } from "../content/customers.js";
import { PRODUCTS } from "../content/products.js";
import { getInterferenceLine, getRadioLine } from "../content/radio.js";
import { setVolume } from "../game/audio.js";
import { requiresProductsForAction } from "../game/transactionEngine.js";

function moneyLabel(value) {
  return value >= 0 ? `$${value}` : `-$${-value}`;
}

function productLabel(productId) {
  return PRODUCTS[productId]?.label ?? productId;
}

function productText(productIds) {
  if (!productIds.length) return "Sin productos";
  return productIds.map(productLabel).join(", ");
}

function missingProductIds(transaction, selectedProductIds) {
  if (!transaction) return [];
  return transaction.request.productIds.filter(
    (productId) => !selectedProductIds.includes(productId),
  );
}

function selectionText(transaction, selectedProductIds) {
  if (!transaction) return "Caja cerrada";
  const missing = missingProductIds(transaction, selectedProductIds);
  if (missing.length === transaction.request.productIds.length) {
    return `Pedido: ${productText(transaction.request.productIds)}`;
  }
  if (missing.length > 0) return `Falta: ${productText(missing)}`;
  return `Listo: ${productText(transaction.request.productIds)}`;
}

function renderProducts(transaction, selectedProductIds) {
  if (!transaction) return "<div class=\"product-buttons\"></div>";
  return `
    <div class="product-buttons">
      ${transaction.request.productIds
        .map((productId) => {
          const selected = selectedProductIds.includes(productId);
          return `
            <button
              type="button"
              class="${selected ? "is-selected" : ""}"
              data-product="${productId}"
              aria-pressed="${selected}"
            >${productLabel(productId)}</button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderActions(transaction, selectedProductIds) {
  if (!transaction) return "<button disabled>Caja cerrada</button>";
  const missing = missingProductIds(transaction, selectedProductIds);
  return Object.entries(transaction.actions)
    .map(([id, action]) => {
      const disabled = requiresProductsForAction(id, action) && missing.length > 0;
      return `
        <button
          type="button"
          class="action-button"
          data-action="${id}"
          ${disabled ? "disabled" : ""}
        >${action.label}</button>
      `;
    })
    .join("");
}

function renderTitleScreen() {
  return `
    <div class="screen title-screen">
      <h1>La Caja No Cierra</h1>
      <p class="subtitle">
        Atendes un almacen uruguayo de madrugada.<br>
        Fias productos a clientes imposibles.<br>
        La libreta cobra deudas de vivos y muertos.
      </p>
      <button class="big-button" data-action="start">Empezar turno</button>
    </div>
  `;
}

function renderNightClosed(night, state) {
  return `
    <div class="screen closure-screen">
      <small>Cierre de noche ${night}</small>
      <h2>La caja cuenta sola</h2>
      <p class="closure-message">${state.lastMessage}</p>
      <div class="closure-stats">
        <span>Plata: ${moneyLabel(state.money)}</span>
        <span>Maldicion: ${state.curse}</span>
        <span>Reputacion: ${state.reputation}</span>
        <span>Deudas: ${Object.keys(state.debts).length}</span>
      </div>
      <button class="big-button" data-action="nextNight">Siguiente noche</button>
    </div>
  `;
}

function renderGameEnd(state) {
  return `
    <div class="screen closure-screen">
      <small>Cierre de caja</small>
      <h2>La caja no cierra</h2>
      <p class="closure-message">${state.lastMessage}</p>
      <div class="closure-stats">
        <span>Plata: ${moneyLabel(state.money)}</span>
        <span>Maldicion: ${state.curse}</span>
        <span>Reputacion: ${state.reputation}</span>
        <span>Deudas activas: ${Object.keys(state.debts).length}</span>
      </div>
      <button class="big-button" data-action="restart">Reiniciar turno</button>
    </div>
  `;
}

function renderHud(snapshot) {
  const tx = snapshot.currentTransaction;
  const customer = tx ? CUSTOMERS[tx.customerId] : null;
  const selected = snapshot.state.selectedProductIds;

  return `
    <div class="hud">
      <section class="panel stats">
        <strong>${snapshot.nightInfo?.title ?? "Turno"}</strong>
        <span>Plata: <span class="stat-value">${moneyLabel(snapshot.state.money)}</span></span>
        <span>Maldicion: <span class="stat-value">${snapshot.state.curse}</span></span>
        <span>Reputacion: <span class="stat-value">${snapshot.state.reputation}</span></span>
        <span>Deudas: <span class="stat-value">${Object.keys(snapshot.state.debts).length}</span></span>
        <span>Pendientes: <span class="stat-value">${snapshot.queue.length}</span></span>
        <span class="selected-products">${selectionText(tx, selected)}</span>
      </section>

      <section class="panel customer-line">
        <strong>${customer?.displayName ?? "Cierre de caja"}</strong>
        <p>${tx?.request.line ?? snapshot.state.lastMessage}</p>
        <small>${snapshot.state.lastMessage}</small>
      </section>

      <section class="panel actions">
        ${renderProducts(tx, selected)}
        ${renderActions(tx, selected)}
        <button type="button" class="ghost-button" data-action="clearProducts">Limpiar pedido</button>
      </section>
    </div>
  `;
}

export function createDomHud(root, runController) {
  const hud = document.createElement("div");
  root.appendChild(hud);

  // Ticker de radio: vive aparte del hud (que se re-renderiza entero cada snapshot).
  const radioEl = document.createElement("div");
  radioEl.className = "radio-ticker";
  root.appendChild(radioEl);

  // Sliders de volumen (el audio comunica información: hay que poder bajarlo por canal).
  const VOL_DEFAULTS = { master: 0.8, sfx: 1, ambient: 0.6, voice: 0.9 };
  const VOL_LABELS = { master: "Vol", sfx: "SFX", ambient: "Amb", voice: "Voz" };
  const settingsEl = document.createElement("div");
  settingsEl.className = "audio-settings";
  settingsEl.innerHTML = Object.keys(VOL_DEFAULTS)
    .map((ch) => {
      const raw = localStorage.getItem(`lcnc.vol.${ch}`);
      const v = raw === null ? VOL_DEFAULTS[ch] : Number(raw);
      setVolume(ch, v);
      return `<label>${VOL_LABELS[ch]}<input type="range" min="0" max="1" step="0.05" value="${v}" data-ch="${ch}"></label>`;
    })
    .join("");
  root.appendChild(settingsEl);
  settingsEl.addEventListener("input", (e) => {
    const ch = e.target.dataset?.ch;
    if (!ch) return;
    const v = Number(e.target.value);
    setVolume(ch, v);
    localStorage.setItem(`lcnc.vol.${ch}`, String(v));
  });

  let curse = 0;
  let lastCustomerId = null;
  let radioOn = false;

  function setRadio(text) {
    radioEl.textContent = `📻 ${text}`;
    radioEl.classList.remove("show");
    void radioEl.offsetWidth; // reinicia el fade
    radioEl.classList.add("show");
  }

  // Sin dead air: la radio habla sola cada tanto mientras el turno está abierto.
  const radioTimer = setInterval(() => {
    if (radioOn) setRadio(getRadioLine(curse));
  }, 14000);

  function render(snapshot) {
    if (snapshot.phase === "title") {
      hud.innerHTML = renderTitleScreen();
      radioOn = false;
      radioEl.style.display = "none";
      return;
    }
    if (snapshot.phase === "nightClosed") {
      hud.innerHTML = renderNightClosed(snapshot.night, snapshot.state);
      radioOn = false;
      radioEl.style.display = "none";
      return;
    }
    if (snapshot.phase === "gameEnd") {
      hud.innerHTML = renderGameEnd(snapshot.state);
      radioOn = false;
      radioEl.style.display = "none";
      return;
    }
    hud.innerHTML = renderHud(snapshot);

    // Radio diegética: presagio (interferencia) al llegar un cliente no humano.
    radioOn = true;
    radioEl.style.display = "";
    curse = snapshot.state.curse;
    const cid = snapshot.currentTransaction?.customerId ?? null;
    const kind = snapshot.currentTransaction?.request.kind;
    if (cid !== lastCustomerId) {
      lastCustomerId = cid;
      if (kind && kind !== "human") setRadio(getInterferenceLine());
      else if (!radioEl.textContent) setRadio(getRadioLine(curse));
    }
  }

  function onClick(event) {
    const button = event.target.closest("button");
    if (!button || button.disabled || !hud.contains(button)) return;

    if (button.dataset.product) {
      runController.selectProduct(button.dataset.product);
      return;
    }

    const action = button.dataset.action;
    if (action === "start") runController.start();
    else if (action === "nextNight") runController.nextNight();
    else if (action === "restart") runController.restart();
    else if (action === "clearProducts") runController.clearProducts();
    else if (action) runController.chooseAction(action);
  }

  hud.addEventListener("click", onClick);
  const unsubscribe = runController.subscribe(render);

  return {
    destroy() {
      unsubscribe();
      clearInterval(radioTimer);
      hud.removeEventListener("click", onClick);
      hud.remove();
      radioEl.remove();
      settingsEl.remove();
    },
  };
}
