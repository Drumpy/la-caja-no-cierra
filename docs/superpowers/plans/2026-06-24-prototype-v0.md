# Prototype V0 Implementation Plan

**For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable prototype that validates whether serving customers through a window with a cash register and debt notebook is tense and fun.

**Architecture:** Keep gameplay rules in small pure JavaScript modules with Node tests, then bind those rules to a simple PlayCanvas placeholder scene. Use data files for products, customers and transactions so content can evolve without rewriting engine logic.

**Tech Stack:** Vite, PlayCanvas Engine, vanilla JavaScript modules, Node `node:test`, placeholder geometry/materials, no asset generator in V0.

---

## Scope

Build only Prototype V0:

- One 6-8 minute night.
- One fixed PlayCanvas scene.
- Window + street, cash register, notebook, radio, cat, four product buttons/objects.
- Products: `cafe`, `cigarros-ficticios`, `chicles`, `vela`.
- Customers: `taxista`, `julia-r`, `el-yona`.
- Variables: `money`, `curse`, `reputation`, `debts`.
- Actions: `charge`, `credit`, `ask`, `cancel`, plus Julia's `openNotebook`.
- No asset-gen implementation yet; create only an art-direction stub so the future pipeline has a home.

## File Structure

Create:

- `package.json` - scripts and dependencies.
- `index.html` - Vite entry.
- `src/main.js` - browser entry point.
- `src/app/createGame.js` - compose state, renderer and UI.
- `src/content/products.js` - V0 product definitions.
- `src/content/customers.js` - V0 customer definitions.
- `src/content/transactions.js` - V0 transaction definitions.
- `src/game/state.js` - initial state and small state helpers.
- `src/game/transactionEngine.js` - pure transaction resolution.
- `src/game/runController.js` - customer queue, current transaction, action flow.
- `src/ui/domHud.js` - DOM HUD and action panel.
- `src/playcanvas/createScene.js` - placeholder 3D scene.
- `src/styles.css` - layout and cozy horror palette.
- `tests/content.test.mjs` - content integrity tests.
- `tests/transactionEngine.test.mjs` - transaction outcome tests.
- `tests/runController.test.mjs` - queue/progression tests.
- `tools/asset-gen/art-direction.md` - future generator direction stub.

Modify:

- `docs/asset-pipeline.md` only if implementation reveals mismatch; otherwise leave docs as-is.

---

## Task 1: Scaffold Vite + PlayCanvas Project

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles.css`
- Create: `src/app/createGame.js`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "la-caja-no-cierra",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "node --test tests/*.test.mjs"
  },
  "dependencies": {
    "playcanvas": "^2.12.3",
    "vite": "^7.2.7"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create HTML entry**

Create `index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>La Caja No Cierra - Prototype V0</title>
  </head>
  <body>
    <div id="app">
      <canvas id="game-canvas" aria-label="La Caja No Cierra prototype"></canvas>
      <div id="hud-root"></div>
    </div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Create initial CSS**

Create `src/styles.css`:

```css
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  overflow: hidden;
  background: #0b0f12;
  color: #f4e6c8;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

#game-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

#hud-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.hud {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr minmax(220px, 340px);
  gap: 12px;
  align-items: end;
}

.panel {
  pointer-events: auto;
  background: rgba(20, 18, 14, 0.9);
  border: 1px solid rgba(241, 203, 126, 0.35);
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.stats {
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.customer-line {
  min-height: 76px;
  font-size: 18px;
  line-height: 1.35;
}

.actions {
  display: grid;
  gap: 8px;
}

.product-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(244, 230, 200, 0.18);
}

button {
  min-height: 38px;
  border: 1px solid rgba(244, 230, 200, 0.35);
  border-radius: 5px;
  background: #2d3529;
  color: #f4e6c8;
  font: inherit;
  cursor: pointer;
}

button:hover {
  background: #3b4a34;
}

button:disabled {
  cursor: default;
  opacity: 0.45;
}

.selected-products {
  font-size: 13px;
  color: #d9c69b;
}
```

- [ ] **Step 4: Create app composer stub**

Create `src/app/createGame.js`:

```js
export function createGame({ canvas, hudRoot }) {
  if (!canvas) throw new Error("createGame requires a canvas");
  if (!hudRoot) throw new Error("createGame requires a HUD root");

  const cleanup = [];

  return {
    destroy() {
      for (const fn of cleanup.splice(0)) fn();
    },
  };
}
```

- [ ] **Step 5: Create main entry**

Create `src/main.js`:

```js
import "./styles.css";
import { createGame } from "./app/createGame.js";

const canvas = document.querySelector("#game-canvas");
const hudRoot = document.querySelector("#hud-root");

createGame({ canvas, hudRoot });
```

- [ ] **Step 6: Install dependencies**

Run:

```bash
rtk pnpm install
```

Expected: `pnpm-lock.yaml` is created and dependencies install without errors.

- [ ] **Step 7: Verify empty app builds**

Run:

```bash
rtk pnpm run build
```

Expected: Vite build succeeds and writes `dist/`.

---

## Task 2: Add V0 Content Data

**Files:**

- Create: `src/content/products.js`
- Create: `src/content/customers.js`
- Create: `src/content/transactions.js`
- Create: `tests/content.test.mjs`

- [ ] **Step 1: Write content integrity tests**

Create `tests/content.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCTS } from "../src/content/products.js";
import { CUSTOMERS } from "../src/content/customers.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("V0 products include exactly the scoped product ids", () => {
  assert.deepEqual(
    Object.keys(PRODUCTS).sort(),
    ["cafe", "chicles", "cigarros-ficticios", "vela"].sort(),
  );
});

test("all transaction product ids exist", () => {
  for (const tx of Object.values(TRANSACTIONS)) {
    for (const productId of tx.request.productIds) {
      assert.ok(PRODUCTS[productId], `${tx.id} references missing ${productId}`);
    }
  }
});

test("all transaction customer ids exist", () => {
  for (const tx of Object.values(TRANSACTIONS)) {
    assert.ok(CUSTOMERS[tx.customerId], `${tx.id} references missing customer`);
  }
});

test("V0 content uses named characters, not type labels", () => {
  assert.equal(CUSTOMERS["el-yona"].displayName, "El Yona");
  assert.equal(CUSTOMERS["julia-r"].displayName, "Julia R.");
});
```

- [ ] **Step 2: Run tests and verify fail**

Run:

```bash
rtk pnpm test
```

Expected: FAIL because content modules do not exist.

- [ ] **Step 3: Create products**

Create `src/content/products.js`:

```js
export const PRODUCTS = {
  cafe: {
    id: "cafe",
    label: "Cafe",
    price: 45,
    visible: true,
    symbols: ["lluvia"],
  },
  "cigarros-ficticios": {
    id: "cigarros-ficticios",
    label: "Cigarros",
    price: 110,
    visible: false,
    symbols: ["humo"],
    note: "Producto ficticio guardado fuera de gondola.",
  },
  chicles: {
    id: "chicles",
    label: "Chicles",
    price: 35,
    visible: true,
    symbols: ["taxi"],
  },
  vela: {
    id: "vela",
    label: "Vela",
    price: 55,
    visible: true,
    symbols: ["vela"],
  },
};
```

- [ ] **Step 4: Create customers**

Create `src/content/customers.js`:

```js
export const CUSTOMERS = {
  taxista: {
    id: "taxista",
    displayName: "Taxista",
    role: "Rumor de ciudad",
    color: "#b98a4d",
  },
  "julia-r": {
    id: "julia-r",
    displayName: "Julia R.",
    role: "Memoria del barrio",
    color: "#8e7aa8",
  },
  "el-yona": {
    id: "el-yona",
    displayName: "El Yona",
    role: "Codigo de barrio",
    color: "#6fa06c",
  },
};
```

- [ ] **Step 5: Create transactions**

Create `src/content/transactions.js`:

```js
export const TRANSACTIONS = {
  "taxista-lluvia-01": {
    id: "taxista-lluvia-01",
    customerId: "taxista",
    nightState: "lluvia-fina",
    request: {
      kind: "human",
      productIds: ["cafe", "cigarros-ficticios", "chicles"],
      line:
        "Bo, dame un cafe y unos cigarros. Y chicles, que subi a uno que olia a agua estancada.",
    },
    actions: {
      charge: {
        label: "Cobrar normal",
        money: 190,
        reputation: 0,
        curse: 1,
        ticketSymbols: ["taxi", "humo", "lluvia"],
        effectText: "La radio repite una frase del pasajero.",
      },
      credit: {
        label: "Fiar",
        money: 0,
        reputation: 2,
        curse: 0,
        debt: { customerId: "taxista", amount: 190, note: "Cafe, cigarros y chicles" },
        deferredTransactionId: "taxista-vuelve-01",
        effectText: "El taxi queda prendido afuera aunque el chofer se va.",
      },
      ask: {
        label: "Preguntar por el pasajero",
        money: 0,
        reputation: 1,
        curse: 1,
        clueText: "Me pidio venir aca, pero cuando llegamos ya estaba parado en tu ventanilla.",
      },
      cancel: {
        label: "Negar cigarros",
        money: 0,
        reputation: -1,
        curse: 0,
        effectText: "La ventanilla se empana desde afuera.",
      },
    },
  },
  "julia-libreta-01": {
    id: "julia-libreta-01",
    customerId: "julia-r",
    nightState: "lluvia-fina",
    request: {
      kind: "tensioned",
      productIds: ["vela"],
      line: "Antes me lo anotaban.",
    },
    actions: {
      charge: {
        label: "Cobrar normal",
        money: 55,
        reputation: -1,
        curse: 1,
        ticketSymbols: ["vela", "lluvia"],
        effectText: "Julia cuenta monedas exactas y mira la libreta.",
      },
      credit: {
        label: "Fiar vela",
        money: 0,
        reputation: 2,
        curse: 1,
        debt: { customerId: "julia-r", amount: 55, note: "Vela" },
        ticketSymbols: ["vela", "libreta", "lluvia"],
        effectText: "La radio pierde la fecha actual durante diez segundos.",
      },
      openNotebook: {
        label: "Abrir libreta",
        money: 0,
        reputation: 0,
        curse: 2,
        oldDebt: {
          customerId: "julia-r",
          note: "Pan, leche, vela",
          since: "1998",
          amount: 0,
        },
        effectText: "JULIA R. Pan, leche, vela. Saldo pendiente desde 1998.",
      },
      cancel: {
        label: "Cerrar ventanilla",
        money: 0,
        reputation: -2,
        curse: 1,
        effectText: "Julia espera bajo la lluvia sin moverse.",
      },
    },
  },
  "yona-aviso-01": {
    id: "yona-aviso-01",
    customerId: "el-yona",
    nightState: "lluvia-fina",
    request: {
      kind: "tensioned",
      productIds: ["chicles", "vela"],
      line: "Ese del taxi no camino hasta aca. Aparecio.",
    },
    actions: {
      charge: {
        label: "Cobrar normal",
        money: 90,
        reputation: 1,
        curse: 0,
        ticketSymbols: ["taxi", "vela"],
        effectText: "El Yona senala una sombra que no toca el piso.",
      },
      credit: {
        label: "Fiar",
        money: 0,
        reputation: 2,
        curse: 0,
        debt: { customerId: "el-yona", amount: 90, note: "Chicles y vela" },
        effectText: "El Yona promete avisar si vuelve el que no pisa sombra.",
      },
      ask: {
        label: "Preguntar que vio",
        money: 0,
        reputation: 1,
        curse: 1,
        clueText: "Si entra con lentes de sol de noche, apaga la heladera.",
      },
      cancel: {
        label: "No atender",
        money: 0,
        reputation: -1,
        curse: 1,
        effectText: "El Yona se va diciendo que no juzga, pero aprende.",
      },
    },
  },
  "taxista-vuelve-01": {
    id: "taxista-vuelve-01",
    customerId: "taxista",
    nightState: "lluvia-fina",
    request: {
      kind: "impossible",
      productIds: ["cafe"],
      line: "Me mandaron a una direccion que no existe. Igual me debe el viaje.",
    },
    actions: {
      charge: {
        label: "Cobrar el cafe",
        money: 45,
        reputation: 0,
        curse: 2,
        ticketSymbols: ["taxi", "libreta"],
        effectText: "El ticket imprime una direccion que no figura en Montevideo.",
      },
      cancel: {
        label: "Cerrar sin vender",
        money: 0,
        reputation: -1,
        curse: 1,
        effectText: "El taxi queda prendido hasta el cierre.",
      },
    },
  },
};
```

- [ ] **Step 6: Run content tests**

Run:

```bash
rtk pnpm test
```

Expected: PASS for all content tests.

---

## Task 3: Implement Pure Transaction Engine

**Files:**

- Create: `src/game/state.js`
- Create: `src/game/transactionEngine.js`
- Create: `tests/transactionEngine.test.mjs`

- [ ] **Step 1: Write failing transaction tests**

Create `tests/transactionEngine.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState } from "../src/game/state.js";
import { resolveTransactionAction } from "../src/game/transactionEngine.js";
import { TRANSACTIONS } from "../src/content/transactions.js";

test("charging the taxista adds money and prints ticket symbols", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["taxista-lluvia-01"],
    "charge",
  );

  assert.equal(result.state.money, 190);
  assert.equal(result.state.curse, 1);
  assert.deepEqual(result.ticket.symbols, ["taxi", "humo", "lluvia"]);
  assert.equal(result.message, "La radio repite una frase del pasajero.");
});

test("credit creates debt and schedules deferred transaction", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["taxista-lluvia-01"],
    "credit",
  );

  assert.equal(result.state.money, 0);
  assert.equal(result.state.reputation, 2);
  assert.deepEqual(result.state.debts.taxista, {
    amount: 190,
    notes: ["Cafe, cigarros y chicles"],
  });
  assert.deepEqual(result.deferredTransactionIds, ["taxista-vuelve-01"]);
});

test("opening Julia's notebook records old debt and increases curse", () => {
  const state = createInitialState();
  const result = resolveTransactionAction(
    state,
    TRANSACTIONS["julia-libreta-01"],
    "openNotebook",
  );

  assert.equal(result.state.curse, 2);
  assert.deepEqual(result.state.oldDebts["julia-r"], {
    note: "Pan, leche, vela",
    since: "1998",
    amount: 0,
  });
  assert.match(result.message, /Saldo pendiente desde 1998/);
});

test("unknown action throws a useful error", () => {
  const state = createInitialState();
  assert.throws(
    () =>
      resolveTransactionAction(
        state,
        TRANSACTIONS["taxista-lluvia-01"],
        "dance",
      ),
    /Unknown action dance/,
  );
});
```

- [ ] **Step 2: Run transaction tests and verify fail**

Run:

```bash
rtk pnpm test
```

Expected: FAIL because `src/game/state.js` and `src/game/transactionEngine.js` do not exist.

- [ ] **Step 3: Create state helpers**

Create `src/game/state.js`:

```js
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
    lastTicket: state.lastTicket ? { ...state.lastTicket } : null,
  };
}
```

- [ ] **Step 4: Create transaction engine**

Create `src/game/transactionEngine.js`:

```js
import { cloneState } from "./state.js";

function addDebt(state, debt) {
  if (!debt) return;
  const current = state.debts[debt.customerId] ?? { amount: 0, notes: [] };
  state.debts[debt.customerId] = {
    amount: current.amount + debt.amount,
    notes: [...current.notes, debt.note],
  };
}

function addOldDebt(state, oldDebt) {
  if (!oldDebt) return;
  state.oldDebts[oldDebt.customerId] = {
    note: oldDebt.note,
    since: oldDebt.since,
    amount: oldDebt.amount,
  };
}

export function resolveTransactionAction(state, transaction, actionId) {
  const action = transaction.actions[actionId];
  if (!action) {
    throw new Error(`Unknown action ${actionId} for ${transaction.id}`);
  }

  const next = cloneState(state);
  next.money += action.money ?? 0;
  next.curse += action.curse ?? 0;
  next.reputation += action.reputation ?? 0;

  addDebt(next, action.debt);
  addOldDebt(next, action.oldDebt);

  const ticket = {
    transactionId: transaction.id,
    customerId: transaction.customerId,
    actionId,
    symbols: action.ticketSymbols ?? [],
  };

  const message = action.effectText ?? action.clueText ?? "La caja no dice nada.";

  next.lastTicket = ticket;
  next.lastMessage = message;
  next.selectedProductIds = [];

  return {
    state: next,
    ticket,
    message,
    deferredTransactionIds: action.deferredTransactionId
      ? [action.deferredTransactionId]
      : [],
  };
}
```

- [ ] **Step 5: Run transaction tests**

Run:

```bash
rtk pnpm test
```

Expected: PASS for content and transaction tests.

---

## Task 4: Implement Run Controller

**Files:**

- Create: `src/game/runController.js`
- Create: `tests/runController.test.mjs`

- [ ] **Step 1: Write failing run controller tests**

Create `tests/runController.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { createRunController } from "../src/game/runController.js";

test("run starts with the taxista transaction", () => {
  const run = createRunController();
  assert.equal(run.getSnapshot().currentTransaction.id, "taxista-lluvia-01");
});

test("charging advances from taxista to Julia", () => {
  const run = createRunController();
  run.chooseAction("charge");
  assert.equal(run.getSnapshot().currentTransaction.id, "julia-libreta-01");
});

test("crediting taxista appends his return after base queue", () => {
  const run = createRunController();
  run.chooseAction("credit");
  run.chooseAction("charge");
  run.chooseAction("charge");
  assert.equal(run.getSnapshot().currentTransaction.id, "taxista-vuelve-01");
});

test("run closes after queue is empty", () => {
  const run = createRunController();
  run.chooseAction("charge");
  run.chooseAction("charge");
  run.chooseAction("charge");
  const snapshot = run.getSnapshot();
  assert.equal(snapshot.currentTransaction, null);
  assert.equal(snapshot.closed, true);
  assert.match(snapshot.state.lastMessage, /Saldo pendiente/);
});
```

- [ ] **Step 2: Run tests and verify fail**

Run:

```bash
rtk pnpm test
```

Expected: FAIL because `src/game/runController.js` does not exist.

- [ ] **Step 3: Implement run controller**

Create `src/game/runController.js`:

```js
import { TRANSACTIONS } from "../content/transactions.js";
import { createInitialState } from "./state.js";
import { resolveTransactionAction } from "./transactionEngine.js";

const BASE_QUEUE = ["taxista-lluvia-01", "julia-libreta-01", "yona-aviso-01"];

function resolveQueue(queue) {
  return queue.map((id) => {
    const tx = TRANSACTIONS[id];
    if (!tx) throw new Error(`Missing transaction ${id}`);
    return tx;
  });
}

export function createRunController() {
  let state = createInitialState();
  let queue = [...BASE_QUEUE];
  let currentId = queue.shift();
  let closed = false;
  const listeners = new Set();

  function emit() {
    const snapshot = controller.getSnapshot();
    for (const listener of listeners) listener(snapshot);
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
      const result = resolveTransactionAction(state, transaction, actionId);
      state = result.state;
      queue.push(...result.deferredTransactionIds);
      currentId = queue.shift() ?? null;
      closeIfDone();
      emit();
      return controller.getSnapshot();
    },

    selectProduct(productId) {
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
        state,
        queue: resolveQueue(queue),
        currentTransaction: currentId ? TRANSACTIONS[currentId] : null,
        closed,
      };
    },
  };

  return controller;
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
rtk pnpm test
```

Expected: PASS all tests.

---

## Task 5: Build DOM HUD and Action Flow

**Files:**

- Create: `src/ui/domHud.js`
- Modify: `src/app/createGame.js`

- [ ] **Step 1: Create DOM HUD**

Create `src/ui/domHud.js`:

```js
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
            ${selected ? "✓ " : ""}${product.label}
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
  root.innerHTML = `<div class="hud"></div>`;
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
```

- [ ] **Step 2: Wire HUD into app**

Replace `src/app/createGame.js` with:

```js
import { createRunController } from "../game/runController.js";
import { createDomHud } from "../ui/domHud.js";

export function createGame({ canvas, hudRoot }) {
  if (!canvas) throw new Error("createGame requires a canvas");
  if (!hudRoot) throw new Error("createGame requires a HUD root");

  const runController = createRunController();
  const hud = createDomHud(hudRoot, runController);

  return {
    destroy() {
      hud.destroy();
    },
  };
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
rtk pnpm test
```

Expected: PASS.

- [ ] **Step 4: Build**

Run:

```bash
rtk pnpm run build
```

Expected: PASS.

---

## Task 6: Add PlayCanvas Placeholder Scene

**Files:**

- Create: `src/playcanvas/createScene.js`
- Modify: `src/app/createGame.js`

- [ ] **Step 1: Create PlayCanvas scene**

Create `src/playcanvas/createScene.js`:

```js
import * as pc from "playcanvas";
import { CUSTOMERS } from "../content/customers.js";

function makeMaterial(name, color) {
  const material = new pc.StandardMaterial();
  material.name = name;
  material.diffuse = color;
  material.update();
  return material;
}

function addBox(app, name, position, scale, material) {
  const entity = new pc.Entity(name);
  entity.addComponent("render", { type: "box", material });
  entity.setLocalPosition(position.x, position.y, position.z);
  entity.setLocalScale(scale.x, scale.y, scale.z);
  app.root.addChild(entity);
  return entity;
}

function customerColor(snapshot) {
  const id = snapshot.currentTransaction?.customerId;
  const hex = CUSTOMERS[id]?.color ?? "#1a1a1a";
  return pc.Color.fromString(hex);
}

export function createScene(canvas, runController) {
  const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
  });

  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();

  const warm = makeMaterial("warm interior", new pc.Color(0.66, 0.52, 0.31));
  const counter = makeMaterial("counter", new pc.Color(0.36, 0.25, 0.17));
  const street = makeMaterial("cold street", new pc.Color(0.07, 0.12, 0.18));
  const glass = makeMaterial("window glow", new pc.Color(0.42, 0.6, 0.72));
  const productMat = makeMaterial("products", new pc.Color(0.76, 0.68, 0.42));
  const customerMat = makeMaterial("customer", new pc.Color(0.08, 0.08, 0.08));
  const objectMat = makeMaterial("objects", new pc.Color(0.18, 0.23, 0.2));

  addBox(app, "back wall", { x: 0, y: 1.4, z: -2.15 }, { x: 4.8, y: 2.8, z: 0.1 }, warm);
  addBox(app, "street", { x: 0, y: 0.2, z: -3.1 }, { x: 5.8, y: 0.08, z: 1.9 }, street);
  addBox(app, "service window", { x: 0, y: 1.55, z: -2.05 }, { x: 2.2, y: 1.15, z: 0.06 }, glass);
  addBox(app, "counter", { x: 0, y: 0.35, z: -0.65 }, { x: 4.6, y: 0.35, z: 1.0 }, counter);
  addBox(app, "cash register", { x: -1.25, y: 0.78, z: -0.7 }, { x: 0.55, y: 0.25, z: 0.42 }, objectMat);
  addBox(app, "notebook", { x: 1.2, y: 0.72, z: -0.5 }, { x: 0.58, y: 0.06, z: 0.42 }, objectMat);
  addBox(app, "radio", { x: 1.9, y: 0.82, z: -1.25 }, { x: 0.34, y: 0.3, z: 0.25 }, objectMat);
  addBox(app, "cat", { x: -1.95, y: 0.76, z: -1.0 }, { x: 0.38, y: 0.16, z: 0.22 }, objectMat);

  const customer = addBox(
    app,
    "customer silhouette",
    { x: 0, y: 1.12, z: -2.42 },
    { x: 0.55, y: 1.25, z: 0.08 },
    customerMat,
  );

  addBox(app, "product cafe", { x: -1.7, y: 0.85, z: -1.3 }, { x: 0.28, y: 0.22, z: 0.28 }, productMat);
  addBox(app, "product cigarros", { x: -1.15, y: 0.85, z: -1.3 }, { x: 0.28, y: 0.22, z: 0.28 }, productMat);
  addBox(app, "product chicles", { x: -0.6, y: 0.85, z: -1.3 }, { x: 0.28, y: 0.22, z: 0.28 }, productMat);
  addBox(app, "product vela", { x: -0.05, y: 0.85, z: -1.3 }, { x: 0.28, y: 0.22, z: 0.28 }, productMat);

  const camera = new pc.Entity("camera");
  camera.addComponent("camera", {
    clearColor: new pc.Color(0.02, 0.025, 0.03),
    fov: 48,
  });
  camera.setLocalPosition(0, 1.35, 3.1);
  camera.lookAt(0, 1.05, -1.8);
  app.root.addChild(camera);

  const interiorLight = new pc.Entity("interior light");
  interiorLight.addComponent("light", {
    type: "omni",
    color: new pc.Color(1.0, 0.78, 0.46),
    intensity: 1.5,
    range: 5,
  });
  interiorLight.setLocalPosition(-1.3, 2.2, 0.4);
  app.root.addChild(interiorLight);

  const streetLight = new pc.Entity("street light");
  streetLight.addComponent("light", {
    type: "omni",
    color: new pc.Color(0.32, 0.48, 0.72),
    intensity: 1.1,
    range: 4,
  });
  streetLight.setLocalPosition(1.4, 2.1, -2.8);
  app.root.addChild(streetLight);

  const unsubscribe = runController.subscribe((snapshot) => {
    const color = customerColor(snapshot);
    customerMat.diffuse = color;
    customerMat.update();
    customer.enabled = Boolean(snapshot.currentTransaction);
  });

  window.addEventListener("resize", () => app.resizeCanvas());

  return {
    destroy() {
      unsubscribe();
      app.destroy();
    },
  };
}
```

- [ ] **Step 2: Wire scene into app**

Replace `src/app/createGame.js` with:

```js
import { createRunController } from "../game/runController.js";
import { createScene } from "../playcanvas/createScene.js";
import { createDomHud } from "../ui/domHud.js";

export function createGame({ canvas, hudRoot }) {
  if (!canvas) throw new Error("createGame requires a canvas");
  if (!hudRoot) throw new Error("createGame requires a HUD root");

  const runController = createRunController();
  const scene = createScene(canvas, runController);
  const hud = createDomHud(hudRoot, runController);

  return {
    destroy() {
      hud.destroy();
      scene.destroy();
    },
  };
}
```

- [ ] **Step 3: Run build**

Run:

```bash
rtk pnpm run build
```

Expected: PASS.

- [ ] **Step 4: Start dev server**

Run:

```bash
rtk pnpm run dev
```

Expected: Vite prints a local URL. Keep server running for browser QA.

---

## Task 7: Add Future Asset-Gen Stub Only

**Files:**

- Create: `tools/asset-gen/art-direction.md`
- Create: `tools/asset-gen/README.md`

- [ ] **Step 1: Create art direction stub**

Create `tools/asset-gen/art-direction.md`:

```markdown
# La Caja No Cierra Asset Direction

Apply to every generated asset once asset-gen is adapted.

## Visual Identity

- Cozy horror uruguayo.
- Interior calido: yellow/green old-store light.
- Exterior frio: blue rain, wet sidewalk, distant street light.
- Simple geometry, painted materials, readable silhouettes.
- No photorealism.
- No generic stock horror.
- No real brands.
- Everyday objects may have one unsettling detail.

## Characters

- Characters are people, not type labels.
- Mabel Medianoche, El Yona, Julia R. and El Flaco del Frio require dignity and agency.
- Avoid caricature, poverty-as-monster, addiction-as-zombie, trans identity as gag.
- Prototype characters are 2.5D layered cutouts at the service window.

## Diegetic UI

- Tickets, notebook pages, prices and signs must be readable at in-game size.
- Important text should be template/editable when possible.
- Thermal ticket white, notebook brown, register green/amber display.
```

- [ ] **Step 2: Create tool README**

Create `tools/asset-gen/README.md`:

```markdown
# asset-gen

This folder is a placeholder for the future adaptation of `blu-game/tools/asset-gen`.

Prototype V0 does not implement the generator. V0 uses placeholder geometry and a small number of semi-manual 2.5D character assets.

When the core loop is validated, adapt the architecture from `blu-game`:

- CLI `pnpm asset <skill> ...`
- staging variants
- `report.json`
- manual promote
- auto-discovered skills
- global art direction injection
- QA before promotion

Do not copy Blu's art direction, palette or assets.
```

- [ ] **Step 3: Run tests**

Run:

```bash
rtk pnpm test
```

Expected: PASS.

---

## Task 8: Browser QA and Prototype Acceptance

**Files:**

- Modify: only files needed to fix defects found during QA.

- [ ] **Step 1: Open local URL**

Use browser QA with the Vite URL from Task 6.

Expected first view:

- fixed 3D counter scene;
- warm interior;
- blue/cold street visible through service window;
- customer silhouette visible;
- HUD shows Taxista line;
- actions show Taxista choices.

- [ ] **Step 2: Play charge path**

Click `Cobrar normal`.

Expected:

- money becomes `$190`;
- curse becomes `1`;
- current customer advances to Julia R.;
- last message says radio repeats passenger phrase.

- [ ] **Step 3: Refresh and play credit path**

Refresh page, click `Fiar` for Taxista, then choose any valid action for Julia and El Yona.

Expected:

- reputation increases after credit;
- debt count becomes `1`;
- Taxista returns after the base queue;
- final message after last transaction includes `Saldo pendiente: una noche mas`.

- [ ] **Step 4: Verify Julia notebook moment**

Refresh page. Charge/cancel Taxista to reach Julia, then click `Abrir libreta`.

Expected:

- message includes `JULIA R. Pan, leche, vela. Saldo pendiente desde 1998.`;
- curse increases by `2`;
- this happens before the run ends.

- [ ] **Step 5: Acceptance check**

Mark V0 accepted only if:

- serving through the window is understandable without instructions;
- box/notebook choices are visible and clickable;
- debt state changes are visible;
- customer queue reaches closure;
- no V0 feature requires the asset generator.

---

## Final Verification

Run all:

```bash
rtk pnpm test
rtk pnpm run build
```

Expected:

- tests pass;
- build passes;
- dev server can run with `rtk pnpm run dev`;
- playable URL shows the prototype scene.

## Spec Coverage Review

Covered:

- Prototype V0 one-night scope.
- Four products.
- Three clients.
- Taxista recurrent return if credited.
- Julia 1998 notebook moment.
- Transaction grammar.
- Four V0 variables.
- PlayCanvas placeholder scene.
- Asset-gen included only as future stub.

Deferred by design:

- Full asset generator adaptation.
- Mabel Medianoche.
- three-night vertical slice.
- texture/prop/character/ticket/signage skills.
- Steam/Next Fest work.
- polished art/audio.
