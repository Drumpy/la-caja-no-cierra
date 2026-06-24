import * as pc from "playcanvas";
import { CUSTOMERS } from "../content/customers.js";
import { createFirstPersonCamera } from "./firstPersonCamera.js";
import { playClick, playTicket, playCoin, playError, playCat, startRain, stopRain } from "../game/audio.js";
import { getRadioLine } from "../content/radio.js";

// ── helpers ──────────────────────────────────────────────

function makeMat(name, color, opts = {}) {
  const m = new pc.StandardMaterial();
  m.name = name;
  m.diffuse = color;
  if (opts.emissive) {
    m.emissive = opts.emissive;
    m.emissiveIntensity = opts.emissiveIntensity ?? 0.4;
  }
  if (opts.opacity !== undefined) {
    m.opacity = opts.opacity;
    m.blendType = pc.BLEND_NORMAL;
  }
  m.update();
  return m;
}

function addBox(app, name, pos, scale, mat) {
  const e = new pc.Entity(name);
  e.addComponent("render", { type: "box", material: mat });
  e.setLocalPosition(pos.x, pos.y, pos.z);
  e.setLocalScale(scale.x, scale.y, scale.z);
  app.root.addChild(e);
  return e;
}

function addPlane(app, name, pos, scale, mat, rot = { x: -90, y: 0, z: 0 }) {
  const e = new pc.Entity(name);
  e.addComponent("render", { type: "plane", material: mat });
  e.setLocalPosition(pos.x, pos.y, pos.z);
  e.setLocalScale(scale.x, scale.y, scale.z);
  e.setLocalEulerAngles(rot.x, rot.y, rot.z);
  app.root.addChild(e);
  return e;
}

// Muro con hueco: 2 cajas laterales + dintel
function addWallWithHole(app, name, cx, cy, cz, width, height, thickness, holeW, holeH) {
  const sideW = (width - holeW) / 2;
  const lintelH = height - holeH;
  const parts = [];
  if (sideW > 0.01) {
    parts.push(addBox(app, `${name}-L`, { x: cx - holeW/2 - sideW/2, y: cy, z: cz }, { x: sideW, y: height, z: thickness }));
    parts.push(addBox(app, `${name}-R`, { x: cx + holeW/2 + sideW/2, y: cy, z: cz }, { x: sideW, y: height, z: thickness }));
  }
  if (lintelH > 0.01) {
    parts.push(addBox(app, `${name}-top`, { x: cx, y: cy + holeH/2 + lintelH/2, z: cz }, { x: holeW, y: lintelH, z: thickness }));
  }
  return parts;
}

// ── raycast AABB ─────────────────────────────────────────

function rayAABB(ox, oy, oz, dx, dy, dz, cx, cy, cz, hx, hy, hz) {
  const minX = cx - hx, maxX = cx + hx;
  const minY = cy - hy, maxY = cy + hy;
  const minZ = cz - hz, maxZ = cz + hz;
  let tmin = -Infinity, tmax = Infinity;
  for (const [o, d, mn, mx] of [[ox,dx,minX,maxX],[oy,dy,minY,maxY],[oz,dz,minZ,maxZ]]) {
    if (Math.abs(d) > 1e-8) {
      const t1 = (mn - o) / d, t2 = (mx - o) / d;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    } else if (o < mn || o > mx) return null;
  }
  if (tmax < 0 || tmin > tmax) return null;
  return tmin >= 0 ? tmin : tmax;
}

function pickEntity(cameraEntity, screenX, screenY, interactives) {
  const cam = cameraEntity.camera;
  const world = cam.screenToWorld(screenX, screenY, 1);
  const origin = cameraEntity.getPosition();
  const dir = new pc.Vec3().sub2(world, origin).normalize();
  let closest = null, closestT = Infinity;
  for (const entry of interactives) {
    const pos = entry.entity.getPosition();
    const scl = entry.entity.getLocalScale();
    const t = rayAABB(origin.x,origin.y,origin.z, dir.x,dir.y,dir.z, pos.x,pos.y,pos.z, scl.x/2,scl.y/2,scl.z/2);
    if (t !== null && t < closestT) { closestT = t; closest = entry; }
  }
  return closest;
}

// ── scene ────────────────────────────────────────────────

export function createScene(canvas, runController) {
  const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
  });
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();

  app.scene.fog.type = pc.FOG_LINEAR;
  app.scene.fog.color = new pc.Color(0.02, 0.025, 0.04);
  app.scene.fog.start = 4;
  app.scene.fog.end = 12;
  app.scene.ambientLight = new pc.Color(0.1, 0.09, 0.07);

  // Materiales
  const matWall = makeMat("wall", new pc.Color(0.38, 0.32, 0.22));
  const matFloor = makeMat("floor", new pc.Color(0.16, 0.14, 0.1));
  const matCeiling = makeMat("ceiling", new pc.Color(0.22, 0.18, 0.12));
  const matCounter = makeMat("counter", new pc.Color(0.32, 0.22, 0.15));
  const matStreet = makeMat("street", new pc.Color(0.05, 0.08, 0.13));
  const matGlass = makeMat("glass", new pc.Color(0.3, 0.5, 0.65), { opacity: 0.2 });
  const matProduct = makeMat("product", new pc.Color(0.72, 0.62, 0.38), { emissive: new pc.Color(0.12, 0.1, 0.05), emissiveIntensity: 0.15 });
  const matProductGlow = makeMat("productGlow", new pc.Color(0.85, 0.75, 0.45), { emissive: new pc.Color(0.6, 0.45, 0.2), emissiveIntensity: 0.8 });
  const matCustomer = makeMat("customer", new pc.Color(0.08, 0.08, 0.1));
  const matObject = makeMat("object", new pc.Color(0.22, 0.19, 0.15));
  const matCaja = makeMat("caja", new pc.Color(0.25, 0.22, 0.16), { emissive: new pc.Color(0.06, 0.05, 0.02), emissiveIntensity: 0.2 });
  const matLibreta = makeMat("libreta", new pc.Color(0.12, 0.1, 0.07));
  const matRadio = makeMat("radio", new pc.Color(0.2, 0.18, 0.15));
  const matGato = makeMat("gato", new pc.Color(0.3, 0.26, 0.18));

  const W = 3.5, D = 3.5, H = 2.6;
  const HOLE_W = 1.0, HOLE_H = 1.2;
  const WIN_CY = 1.5;

  addPlane(app, "floor", { x: 0, y: 0, z: -0.75 }, { x: W, y: D }, matFloor);
  addPlane(app, "ceiling", { x: 0, y: H, z: -0.75 }, { x: W, y: D }, matCeiling, { x: 90, y: 0, z: 0 });

  addWallWithHole(app, "front-wall", 0, WIN_CY, -D/2 - 0.5, W, H, 0.1, HOLE_W, HOLE_H);
  addBox(app, "window-glass", { x: 0, y: WIN_CY, z: -D/2 - 0.5 }, { x: HOLE_W, y: HOLE_H, z: 0.02 }, matGlass);
  addBox(app, "window-sill", { x: 0, y: WIN_CY - HOLE_H/2 - 0.3, z: -D/2 - 0.5 }, { x: W, y: 0.6, z: 0.1 }, matWall);

  addBox(app, "wall-left", { x: -W/2, y: H/2, z: -0.75 }, { x: 0.1, y: H, z: D }, matWall);
  addBox(app, "wall-right", { x: W/2, y: H/2, z: -0.75 }, { x: 0.1, y: H, z: D }, matWall);
  addBox(app, "wall-back", { x: 0, y: H/2, z: 0.75 }, { x: W, y: H, z: 0.1 }, matWall);

  addBox(app, "counter", { x: 0, y: 0.45, z: -1.2 }, { x: 2.4, y: 0.4, z: 0.5 }, matCounter);
  addBox(app, "shelf", { x: 0, y: 1.4, z: -D/2 - 0.4 }, { x: 2.4, y: 0.4, z: 0.08 }, matCounter);

  const caja = addBox(app, "caja", { x: -0.85, y: 0.75, z: -1.25 }, { x: 0.4, y: 0.2, z: 0.3 }, matCaja);
  const libreta = addBox(app, "libreta", { x: 0.7, y: 0.68, z: -1.15 }, { x: 0.45, y: 0.05, z: 0.32 }, matLibreta);
  const radio = addBox(app, "radio", { x: 1.1, y: 0.72, z: -1.4 }, { x: 0.28, y: 0.22, z: 0.2 }, matRadio);
  const gato = addBox(app, "gato", { x: -1.15, y: 0.68, z: -1.5 }, { x: 0.3, y: 0.14, z: 0.18 }, matGato);

  const productEntities = {
    cafe: addBox(app, "product-cafe", { x: -0.9, y: 1.22, z: -D/2 - 0.44 }, { x: 0.2, y: 0.18, z: 0.2 }, matProduct),
    "cigarros-ficticios": addBox(app, "product-cigarros", { x: -0.45, y: 1.22, z: -D/2 - 0.44 }, { x: 0.2, y: 0.18, z: 0.2 }, matProduct),
    chicles: addBox(app, "product-chicles", { x: 0.0, y: 1.22, z: -D/2 - 0.44 }, { x: 0.2, y: 0.18, z: 0.2 }, matProduct),
    vela: addBox(app, "product-vela", { x: 0.45, y: 1.22, z: -D/2 - 0.44 }, { x: 0.2, y: 0.18, z: 0.2 }, matProduct),
  };
  const productBaseY = {};
  for (const [id, e] of Object.entries(productEntities)) productBaseY[id] = e.getLocalPosition().y;

  const customer = addBox(app, "customer", { x: 0, y: 1.0, z: -D/2 - 0.9 }, { x: 0.5, y: 1.3, z: 0.06 }, matCustomer);

  // Calle
  addPlane(app, "street", { x: 0, y: 0.01, z: -D/2 - 2.5 }, { x: 8, y: 6 }, matStreet);

  const rainDrops = [];
  const RAIN_COUNT = 60;
  const matRain = makeMat("rain", new pc.Color(0.5, 0.6, 0.8), { opacity: 0.4 });
  for (let i = 0; i < RAIN_COUNT; i++) {
    const drop = addBox(app, `rain-${i}`, {
      x: (Math.random() - 0.5) * 7,
      y: Math.random() * 4 + 2,
      z: -D/2 - 1 - Math.random() * 4,
    }, { x: 0.01, y: 0.15, z: 0.01 }, matRain);
    rainDrops.push(drop);
  }

  // ── Luces ──
  const interiorLight = new pc.Entity("interior-light");
  interiorLight.addComponent("light", { type: "omni", color: new pc.Color(1.0, 0.78, 0.46), intensity: 2.2, range: 5 });
  interiorLight.setLocalPosition(0, H - 0.3, -0.5);
  app.root.addChild(interiorLight);

  const streetLight = new pc.Entity("street-light");
  streetLight.addComponent("light", { type: "omni", color: new pc.Color(0.25, 0.4, 0.6), intensity: 1.5, range: 6 });
  streetLight.setLocalPosition(1.5, 2.0, -D/2 - 2.5);
  app.root.addChild(streetLight);

  // ── Cámara primera persona ──
  const camera = new pc.Entity("camera");
  camera.addComponent("camera", { clearColor: new pc.Color(0.02, 0.025, 0.04), fov: 55, farClip: 20 });
  camera.setLocalPosition(0, 1.55, 0.3);
  app.root.addChild(camera);

  // ── Interactivos ──
  const interactives = [
    { entity: caja, action: "charge", label: "Caja" },
    { entity: libreta, action: "notebook", label: "Libreta" },
    { entity: radio, action: "radio", label: "Radio" },
    { entity: gato, action: "cat", label: "Gato" },
    { entity: productEntities.cafe, productId: "cafe", label: "Café" },
    { entity: productEntities["cigarros-ficticios"], productId: "cigarros-ficticios", label: "Cigarros" },
    { entity: productEntities.chicles, productId: "chicles", label: "Chicles" },
    { entity: productEntities.vela, productId: "vela", label: "Vela" },
  ];

  const originalMats = new Map();
  for (const entry of interactives) originalMats.set(entry.entity, entry.entity.render.material);

  // Highlight: cambia material a glow, restaura después
  const highlightTimers = new Map();
  function highlight(entity, duration = 0.4) {
    const orig = originalMats.get(entity);
    highlightTimers.set(entity, { time: duration, total: duration, orig });
    entity.render.material = matProductGlow;
  }

  function handleClick(screenX, screenY) {
    const hit = pickEntity(camera, screenX, screenY, interactives);
    if (!hit) return;
    highlight(hit.entity);
    playClick();

    if (hit.productId) {
      runController.selectProduct(hit.productId);
    } else if (hit.action === "charge") {
      runController.chooseAction("charge");
    } else if (hit.action === "notebook") {
      const snap = runController.getSnapshot();
      const tx = snap.currentTransaction;
      if (tx?.actions.openNotebook) runController.chooseAction("openNotebook");
      else if (tx?.actions.credit) runController.chooseAction("credit");
    } else if (hit.action === "radio") {
      const snap = runController.getSnapshot();
      const line = getRadioLine(snap.state.curse);
      runController.getSnapshot();
      console.log("[RADIO]", line);
    } else if (hit.action === "cat") {
      playCat();
    }
  }

  createFirstPersonCamera(app, camera, {
    bounds: { minX: -W/2 + 0.3, maxX: W/2 - 0.3, minZ: -D/2 + 0.3, maxZ: 0.5 },
    onClick: handleClick,
  });
  // ── Update ──
  app.on("update", (dt) => {
    for (const [entity, h] of highlightTimers) {
      h.time -= dt;
      if (h.time <= 0) {
        highlightTimers.delete(entity);
        if (!runController.getSnapshot().state.selectedProductIds.includes(
          Object.entries(productEntities).find(([, e]) => e === entity)?.[0]
        )) {
          entity.render.material = h.orig;
        }
      }
    }

    for (const drop of rainDrops) {
      const p = drop.getLocalPosition();
      p.y -= 6 * dt;
      if (p.y < 0.05) {
        p.y = 4 + Math.random() * 2;
        p.x = (Math.random() - 0.5) * 7;
        p.z = -D/2 - 1 - Math.random() * 4;
      }
      drop.setLocalPosition(p.x, p.y, p.z);
    }

    const snap = runController.getSnapshot();

    for (const [id, e] of Object.entries(productEntities)) {
      const selected = snap.state.selectedProductIds.includes(id);
      const baseY = productBaseY[id];
      const y = selected ? baseY + 0.08 + Math.sin(app.time * 3) * 0.015 : baseY;
      const p = e.getLocalPosition();
      e.setLocalPosition(p.x, y, p.z);
      if (selected && e.render.material !== matProductGlow) {
        e.render.material = matProductGlow;
      } else if (!selected && e.render.material === matProductGlow && !highlightTimers.has(e)) {
        e.render.material = matProduct;
      }
    }

    const curse = Math.min(snap.state.curse, 8);
    const gatoVis = 0.3 + Math.sin(app.time * 1.5) * 0.1;
    matGato.emissive = new pc.Color(curse > 3 ? gatoVis : 0, 0, 0);
    matGato.emissiveIntensity = curse > 3 ? 0.5 : 0;
    matGato.update();
  });

  // ── State ──
  function customerColor(snapshot) {
    const id = snapshot.currentTransaction?.customerId;
    const hex = CUSTOMERS[id]?.color ?? "#1a1a1a";
    return pc.Color.fromString(hex);
  }

  let lastTicketId = null;
  const unsubscribe = runController.subscribe((snapshot) => {
    const color = customerColor(snapshot);
    matCustomer.diffuse = color;
    matCustomer.update();
    customer.enabled = Boolean(snapshot.currentTransaction);

    if (snapshot.state.lastTicket && snapshot.state.lastTicket.transactionId !== lastTicketId) {
      lastTicketId = snapshot.state.lastTicket.transactionId;
      if (snapshot.phase === "playing") {
        const action = snapshot.state.lastTicket.actionId;
        if (action === "charge") { playTicket(); playCoin(); }
        else if (action === "cancel" || action === "give") playError();
        else playTicket();
      }
    }

    if (snapshot.phase === "playing") {
      startRain();
    } else {
      stopRain();
    }

    const curse = Math.min(snapshot.state.curse, 8);
    const light = interiorLight.light;
    light.color = new pc.Color(
      Math.max(0.3, 1.0 - curse * 0.04),
      Math.max(0.2, 0.78 - curse * 0.06),
      Math.max(0.15, 0.46 - curse * 0.05),
    );
    light.intensity = Math.max(0.5, 2.2 - curse * 0.1);
  });

  window.addEventListener("resize", () => app.resizeCanvas());

  return {
    destroy() {
      unsubscribe();
      app.destroy();
    },
  };
}
