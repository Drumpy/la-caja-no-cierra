import * as pc from "playcanvas";
import { CUSTOMERS } from "../content/customers.js";
import { playCat, playClick, playCoin, playError, playTicket, playThunder, playVoice, startRain, stopRain } from "../game/audio.js";
import { getRadioLine } from "../content/radio.js";
import { createTaxistaWalkMaterials } from "./characterMaterials.js";
import { createFirstPersonCamera } from "./firstPersonCamera.js";
import { createKioskMaterials, makeMat } from "./generatedMaterials.js";

// Transacciones con clip de voz en /audio/voices/<id>.mp3.
const VOICED_TX = new Set(["taxista-lluvia-01", "taxista-vuelve-01"]);

function addBox(app, name, pos, scale, material) {
  const entity = new pc.Entity(name);
  entity.addComponent("render", { type: "box", material });
  entity.setLocalPosition(pos.x, pos.y, pos.z);
  entity.setLocalScale(scale.x, scale.y, scale.z);
  app.root.addChild(entity);
  return entity;
}

function addPlane(app, name, pos, scale, material, rot = { x: -90, y: 0, z: 0 }) {
  const entity = new pc.Entity(name);
  entity.addComponent("render", { type: "plane", material });
  entity.setLocalPosition(pos.x, pos.y, pos.z);
  entity.setLocalScale(scale.x, scale.y ?? 1, scale.z ?? 1);
  entity.setLocalEulerAngles(rot.x, rot.y, rot.z);
  app.root.addChild(entity);
  return entity;
}

function moveToward(current, target, maxDelta) {
  const delta = new pc.Vec3().sub2(target, current);
  const dist = delta.length();
  if (dist <= maxDelta || dist === 0) return target.clone();
  return current.clone().add(delta.scale(maxDelta / dist));
}

function addWallWithHole(app, cx, cz, width, height, thickness, holeW, holeH, sillH, material) {
  const sideW = (width - holeW) / 2;
  const holeCY = sillH + holeH / 2;
  const sideH = height - sillH;
  addBox(app, "front-wall-left", { x: cx - holeW / 2 - sideW / 2, y: sillH + sideH / 2, z: cz }, { x: sideW, y: sideH, z: thickness }, material);
  addBox(app, "front-wall-right", { x: cx + holeW / 2 + sideW / 2, y: sillH + sideH / 2, z: cz }, { x: sideW, y: sideH, z: thickness }, material);
  const topH = height - (holeCY + holeH / 2);
  addBox(app, "front-wall-top", { x: cx, y: height - topH / 2, z: cz }, { x: holeW, y: topH, z: thickness }, material);
  addBox(app, "front-wall-sill", { x: cx, y: sillH / 2, z: cz }, { x: width, y: sillH, z: thickness }, material);
}

function rayAABB(origin, dir, center, half) {
  let tmin = -Infinity;
  let tmax = Infinity;
  for (const axis of ["x", "y", "z"]) {
    if (Math.abs(dir[axis]) > 1e-8) {
      const t1 = (center[axis] - half[axis] - origin[axis]) / dir[axis];
      const t2 = (center[axis] + half[axis] - origin[axis]) / dir[axis];
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    } else if (origin[axis] < center[axis] - half[axis] || origin[axis] > center[axis] + half[axis]) {
      return null;
    }
  }
  if (tmax < 0 || tmin > tmax) return null;
  return tmin >= 0 ? tmin : tmax;
}

function pickEntity(cameraEntity, screenX, screenY, interactives) {
  const world = cameraEntity.camera.screenToWorld(screenX, screenY, 1);
  const origin = cameraEntity.getPosition();
  const dir = new pc.Vec3().sub2(world, origin).normalize();
  let closest = null;
  let closestT = Infinity;

  // Hitbox más grande que el arte: tolera el click impreciso (forgiveness).
  const PAD = 0.06;
  for (const entry of interactives) {
    const pos = entry.entity.getPosition();
    const scale = entry.entity.getLocalScale();
    const t = rayAABB(origin, dir, pos, {
      x: scale.x / 2 + PAD,
      y: scale.y / 2 + PAD,
      z: scale.z / 2 + PAD,
    });
    if (t !== null && t < closestT) {
      closest = entry;
      closestT = t;
    }
  }

  return closest;
}

function colorFromHex(hex) {
  const raw = hex.replace("#", "");
  const n = Number.parseInt(raw, 16);
  return new pc.Color(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export function createScene(canvas, runController) {
  const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
  });
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();

  app.scene.fog.type = pc.FOG_LINEAR;
  app.scene.fog.color = new pc.Color(0.008, 0.012, 0.022);
  app.scene.fog.start = 2.2;
  app.scene.fog.end = 6;

  // Terror: ambient frío y casi nulo. Solo la lamparita da luz cálida; las sombras
  // caen a un azul casi negro (noche, frío, tensión).
  app.scene.ambientLight = new pc.Color(0.012, 0.016, 0.028);

  const generated = createKioskMaterials(app);
  const taxistaWalk = createTaxistaWalkMaterials(app);
  const matCeiling = generated.ceiling;
  const matProductGlow = makeMat("product-glow", new pc.Color(0.85, 0.75, 0.45), {
    emissive: new pc.Color(0.6, 0.45, 0.2),
    emissiveIntensity: 0.8,
  });
  const matCustomer = makeMat("customer-fallback", new pc.Color(0.08, 0.08, 0.1));
  const matCaja = makeMat("caja", new pc.Color(0.25, 0.22, 0.16), {
    emissive: new pc.Color(0.06, 0.05, 0.02),
    emissiveIntensity: 0.06,
  });
  const matLibreta = makeMat("libreta", new pc.Color(0.12, 0.1, 0.07));
  const matRadio = makeMat("radio", new pc.Color(0.2, 0.18, 0.15));
  const matGato = makeMat("gato", new pc.Color(0.3, 0.26, 0.18));
  // Lluvia auto-iluminada: hilos fríos visibles aunque afuera esté en negro.
  const matRain = makeMat("rain", new pc.Color(0.5, 0.6, 0.8), {
    opacity: 0.55,
    emissive: new pc.Color(0.45, 0.55, 0.78),
    emissiveIntensity: 0.9,
  });
  const matStreet = makeMat("street", new pc.Color(0.015, 0.02, 0.025));

  const W = 3.5;
  const D = 4.5;
  const H = 2.6;
  const HOLE_W = 1.0;
  const HOLE_H = 0.8;
  const SILL_H = 1.1;
  const FRONT_Z = -D / 2;
  const BACK_Z = D / 2;
  const WIN_CY = SILL_H + HOLE_H / 2;

  addBox(app, "floor", { x: 0, y: -0.025, z: 0 }, { x: W, y: 0.05, z: D }, generated.floor);
  addBox(app, "ceiling", { x: 0, y: H - 0.02, z: 0 }, { x: W, y: 0.04, z: D }, matCeiling);
  addWallWithHole(app, 0, FRONT_Z, W, H, 0.1, HOLE_W, HOLE_H, SILL_H, generated.wall);
  addBox(app, "wall-left", { x: -W / 2, y: H / 2, z: 0 }, { x: 0.1, y: H, z: D }, generated.wall);
  addBox(app, "wall-right", { x: W / 2, y: H / 2, z: 0 }, { x: 0.1, y: H, z: D }, generated.wall);
  addBox(app, "wall-back", { x: 0, y: H / 2, z: BACK_Z }, { x: W, y: H, z: 0.1 }, generated.wall);

  const counterZ = FRONT_Z + 0.7;
  const counter = addBox(app, "counter", { x: 0, y: 0.45, z: counterZ }, { x: 2.4, y: 0.4, z: 0.5 }, generated.wood);
  const backShelfZ = BACK_Z - 0.25;
  const shelfY = 1.3;
  addBox(app, "shelf-board", { x: 0, y: shelfY, z: backShelfZ }, { x: 2.4, y: 0.04, z: 0.3 }, generated.wood);
  addBox(app, "shelf-bracket", { x: 0, y: shelfY - 0.3, z: backShelfZ + 0.1 }, { x: 2.4, y: 0.04, z: 0.04 }, generated.wood);

  const shelfTopY = shelfY + 0.11;
  const productEntities = {
    cafe: addBox(app, "product-cafe", { x: -0.75, y: shelfTopY, z: backShelfZ }, { x: 0.2, y: 0.18, z: 0.2 }, generated.products.cafe),
    chicles: addBox(app, "product-chicles", { x: -0.25, y: shelfTopY, z: backShelfZ }, { x: 0.2, y: 0.18, z: 0.2 }, generated.products.chicles),
    vela: addBox(app, "product-vela", { x: 0.25, y: shelfTopY, z: backShelfZ }, { x: 0.2, y: 0.18, z: 0.2 }, generated.products.vela),
    "cigarros-ficticios": addBox(
      app,
      "product-cigarros",
      { x: -0.45, y: 0.72, z: counterZ - 0.16 },
      { x: 0.22, y: 0.08, z: 0.28 },
      generated.products["cigarros-ficticios"],
    ),
  };
  const productBaseY = Object.fromEntries(
    Object.entries(productEntities).map(([id, entity]) => [id, entity.getLocalPosition().y]),
  );

  const counterTopY = 0.65;
  const caja = addBox(app, "caja", { x: -0.85, y: counterTopY + 0.1, z: counterZ }, { x: 0.4, y: 0.2, z: 0.3 }, matCaja);
  const libreta = addBox(app, "libreta", { x: 0.7, y: counterTopY + 0.025, z: counterZ + 0.05 }, { x: 0.45, y: 0.05, z: 0.32 }, matLibreta);
  const radio = addBox(app, "radio", { x: 1.1, y: counterTopY + 0.11, z: counterZ - 0.1 }, { x: 0.28, y: 0.22, z: 0.2 }, matRadio);
  const gato = addBox(app, "gato", { x: -1.15, y: counterTopY + 0.07, z: counterZ - 0.15 }, { x: 0.3, y: 0.14, z: 0.18 }, matGato);

  addPlane(app, "street", { x: 0, y: 0.01, z: FRONT_Z - 2.5 }, { x: 8, y: 6 }, matStreet);
  addBox(app, "taxi-glow", { x: 1.1, y: 0.45, z: FRONT_Z - 2.2 }, { x: 1.2, y: 0.28, z: 0.12 }, makeMat("taxi-glow", new pc.Color(0.72, 0.52, 0.18), { emissive: new pc.Color(0.28, 0.18, 0.05), emissiveIntensity: 0.18 }));
  const CUSTOMER_WINDOW = new pc.Vec3(0, 0.95, FRONT_Z - 0.58);
  const CUSTOMER_ENTRY = new pc.Vec3(-1.15, 0.95, FRONT_Z - 2.65);
  const CUSTOMER_EXIT = new pc.Vec3(1.15, 0.95, FRONT_Z - 2.65);
  const customer = addBox(
    app,
    "customer",
    { x: CUSTOMER_ENTRY.x, y: CUSTOMER_ENTRY.y, z: CUSTOMER_ENTRY.z },
    { x: 0.78, y: 1.55, z: 0.005 }, // ponytail: thin box = billboard; side faces sub-pixel so no edge strip. Use a plane mesh if it ever needs real depth.
    generated.taxista,
  );
  customer.enabled = false;
  customer.render.castShadows = false; // billboard delgado: la sombra daría acne

  const rainDrops = [];
  for (let i = 0; i < 60; i++) {
    rainDrops.push(
      addBox(
        app,
        `rain-${i}`,
        { x: (Math.random() - 0.5) * 7, y: Math.random() * 4 + 2, z: FRONT_Z - 0.5 - Math.random() * 4 },
        { x: 0.01, y: 0.15, z: 0.01 },
        matRain,
      ),
    );
  }
  rainDrops.forEach((d) => (d.render.castShadows = false));

  // --- Lamparita colgante en el centro del kiosco ---
  const bulbY = H - 0.55;
  addBox(
    app,
    "lamp-cord",
    { x: 0, y: (H + bulbY) / 2, z: 0 },
    { x: 0.015, y: H - bulbY, z: 0.015 },
    makeMat("lamp-cord", new pc.Color(0.03, 0.03, 0.03)),
  );

  const lampShade = new pc.Entity("lamp-shade");
  lampShade.addComponent("render", {
    type: "cone",
    material: makeMat("lamp-shade", new pc.Color(0.18, 0.14, 0.09), {
      emissive: new pc.Color(0.5, 0.34, 0.14),
      emissiveIntensity: 0.25,
    }),
  });
  lampShade.setLocalScale(0.42, 0.26, 0.42);
  lampShade.setLocalEulerAngles(180, 0, 0); // boca abajo, cubre el bulbo
  lampShade.setLocalPosition(0, bulbY + 0.12, 0);
  app.root.addChild(lampShade);

  const bulbMat = makeMat("lamp-bulb", new pc.Color(1.0, 0.9, 0.62), {
    emissive: new pc.Color(1.0, 0.82, 0.5),
    emissiveIntensity: 1.0,
  });
  const bulb = new pc.Entity("lamp-bulb");
  bulb.addComponent("render", { type: "sphere", material: bulbMat });
  bulb.setLocalScale(0.13, 0.13, 0.13);
  bulb.setLocalPosition(0, bulbY, 0);
  bulb.render.castShadows = false;
  app.root.addChild(bulb);

  // La luz vive en el bulbo: pozo chico y cálido, sombras reales. Parpadea en el loop.
  const interiorLight = new pc.Entity("interior-light");
  interiorLight.addComponent("light", {
    type: "omni",
    color: new pc.Color(1.0, 0.78, 0.46),
    intensity: 1.2,
    range: 4.2,
    castShadows: true,
    shadowResolution: 512,
    shadowBias: 0.04,
    normalOffsetBias: 0.04,
  });
  interiorLight.setLocalPosition(0, bulbY - 0.04, 0);
  app.root.addChild(interiorLight);

  // Afuera: oscuro. Apenas un farol frío y lejano.
  const streetLight = new pc.Entity("street-light");
  streetLight.addComponent("light", { type: "omni", color: new pc.Color(0.18, 0.26, 0.4), intensity: 0.12, range: 5 });
  streetLight.setLocalPosition(1.5, 2.0, FRONT_Z - 2.5);
  app.root.addChild(streetLight);

  // Relámpago: direccional frío que entra desde el frente-arriba (por la ventana).
  // Intensidad 0 en reposo; el loop la dispara en destellos. Ilumina cielo e interior.
  const lightning = new pc.Entity("lightning");
  lightning.addComponent("light", {
    type: "directional",
    color: new pc.Color(0.75, 0.82, 1.0),
    intensity: 0,
  });
  lightning.setLocalEulerAngles(52, 8, 0);
  app.root.addChild(lightning);

  const camera = new pc.Entity("camera");
  camera.addComponent("camera", {
    clearColor: new pc.Color(0.004, 0.006, 0.011),
    fov: 55,
    farClip: 20,
    toneMapping: pc.TONEMAP_ACES, // rolloff filmico: el bulbo no se quema
    gammaCorrection: pc.GAMMA_SRGB,
  });
  camera.setLocalPosition(0, 1.55, BACK_Z - 0.5);
  app.root.addChild(camera);

  const interactives = [
    { entity: caja, action: "charge" },
    { entity: libreta, action: "notebook" },
    { entity: radio, action: "radio" },
    { entity: gato, action: "cat" },
    ...Object.entries(productEntities).map(([productId, entity]) => ({ entity, productId })),
  ];
  const originalMats = new Map(interactives.map((entry) => [entry.entity, entry.entity.render.material]));
  const highlightTimers = new Map();

  function highlight(entity, duration = 0.35) {
    highlightTimers.set(entity, duration);
    entity.render.material = matProductGlow;
  }

  function handleClick(screenX, screenY) {
    const hit = pickEntity(camera, screenX, screenY, interactives);
    if (!hit) return;
    highlight(hit.entity);
    playClick();

    if (hit.productId) {
      runController.selectProduct(hit.productId);
      return;
    }

    if (hit.action === "charge") {
      runController.chooseAction("charge");
      return;
    }

    if (hit.action === "notebook") {
      const tx = runController.getSnapshot().currentTransaction;
      if (tx?.actions.openNotebook) runController.chooseAction("openNotebook");
      else if (tx?.actions.forgiveOldDebt) runController.chooseAction("forgiveOldDebt");
      else if (tx?.actions.credit) runController.chooseAction("credit");
      return;
    }

    if (hit.action === "radio") {
      console.log("[RADIO]", getRadioLine(runController.getSnapshot().state.curse));
      return;
    }

    if (hit.action === "cat") playCat();
  }

  createFirstPersonCamera(app, camera, {
    bounds: { minX: -W / 2 + 0.3, maxX: W / 2 - 0.3, minZ: FRONT_Z + 0.3, maxZ: 0.5 },
    onClick: handleClick,
  });

  let elapsed = 0;
  let targetCustomerId = null;
  let visibleCustomerId = null;
  let pendingCustomerId = null;
  let customerPhase = "hidden";

  function enterCustomer(customerId) {
    visibleCustomerId = customerId;
    pendingCustomerId = null;
    customerPhase = "entering";
    customer.enabled = Boolean(customerId);
    customer.setLocalPosition(CUSTOMER_ENTRY.x, CUSTOMER_ENTRY.y, CUSTOMER_ENTRY.z);
  }

  function scheduleCustomer(customerId) {
    if (customerId === targetCustomerId) return;
    targetCustomerId = customerId;
    if (visibleCustomerId) {
      pendingCustomerId = customerId;
      customerPhase = "leaving";
    } else if (customerId) {
      enterCustomer(customerId);
    }
  }

  function materialForCustomer(customerId) {
    if (customerId === "taxista") {
      const moving = customerPhase === "entering" || customerPhase === "leaving";
      if (!moving) return taxistaWalk[0] ?? generated.taxista;
      return taxistaWalk[Math.floor(elapsed * 7) % taxistaWalk.length] ?? generated.taxista;
    }

    matCustomer.diffuse = colorFromHex(CUSTOMERS[customerId]?.color ?? "#1a1a1a");
    matCustomer.update();
    return matCustomer;
  }

  function updateCustomer(dt) {
    if (!visibleCustomerId) {
      customer.enabled = false;
      return;
    }

    customer.enabled = true;
    const target = customerPhase === "leaving" ? CUSTOMER_EXIT : CUSTOMER_WINDOW;
    const next = moveToward(customer.getLocalPosition(), target, dt * 1.45);
    customer.setLocalPosition(next.x, next.y, next.z);
    customer.render.material = materialForCustomer(visibleCustomerId);

    if (next.equals(target)) {
      if (customerPhase === "entering") {
        customerPhase = "idle";
        // Voz al llegar a la ventanilla, no mientras camina.
        const txId = runController.getSnapshot().currentTransaction?.id;
        if (txId && VOICED_TX.has(txId)) playVoice(`/audio/voices/${txId}.mp3`);
      }
      if (customerPhase === "leaving") {
        visibleCustomerId = null;
        customerPhase = "hidden";
        customer.enabled = false;
        if (pendingCustomerId) enterCustomer(pendingCustomerId);
      }
    }
  }

  // Estado del relámpago + refs de color que el destello modula en vivo.
  let flash = 0;
  let strikeTimer = 3 + Math.random() * 5;
  let flickerTimer = 4 + Math.random() * 6; // cada tanto
  let flickerBurst = 0; // segundos restantes de temblor

  // Gato = hint system. Reacciona al tipo de cliente y a la maldición.
  const GATO_POSES = {
    dormido: { y: 0, yaw: 0, glow: 0 }, // seguro
    mira: { y: 0.06, yaw: -35, glow: 0.25 }, // atención: gira hacia la ventana
    escondido: { y: -0.32, yaw: 0, glow: 0 }, // peligro: se mete tras el mostrador
  };
  let gatoState = "dormido";
  let gatoLift = 0;
  let gatoYaw = 0;
  const gatoBase = gato.getLocalPosition().clone();
  const camClear = camera.camera.clearColor;
  const skyFog = app.scene.fog.color;

  app.on("update", (dt) => {
    elapsed += dt;
    for (const [entity, time] of Array.from(highlightTimers.entries())) {
      const next = time - dt;
      if (next <= 0) {
        highlightTimers.delete(entity);
        entity.render.material = originalMats.get(entity);
      } else {
        highlightTimers.set(entity, next);
      }
    }

    for (const drop of rainDrops) {
      const p = drop.getLocalPosition();
      p.y -= 6 * dt;
      if (p.y < 0.05) {
        p.y = 4 + Math.random() * 2;
        p.x = (Math.random() - 0.5) * 7;
        p.z = FRONT_Z - 1 - Math.random() * 4;
      }
      drop.setLocalPosition(p.x, p.y, p.z);
    }

    const snap = runController.getSnapshot();
    for (const [id, entity] of Object.entries(productEntities)) {
      const baseY = productBaseY[id];
      const selected = snap.state.selectedProductIds.includes(id);
      const p = entity.getLocalPosition();
      entity.setLocalPosition(p.x, selected ? baseY + 0.08 + Math.sin(elapsed * 3) * 0.015 : baseY, p.z);
    }

    const curse = Math.min(snap.state.curse, 8);

    // Bombilla estable casi siempre; cada tanto una ráfaga de parpadeo (foco que falla).
    // La maldición acorta el intervalo entre ráfagas.
    const lampBase = Math.max(0.4, 1.2 - curse * 0.07);
    flickerTimer -= dt;
    if (flickerTimer <= 0) {
      flickerBurst = 0.25 + Math.random() * 0.5;
      flickerTimer = Math.max(2, 7 - curse * 0.5) + Math.random() * 5;
    }
    let lampK = 1;
    if (flickerBurst > 0) {
      flickerBurst -= dt;
      lampK = Math.random() < 0.5 ? 0.12 + Math.random() * 0.28 : 0.92 + Math.random() * 0.08;
    }
    interiorLight.light.intensity = lampBase * lampK;
    bulbMat.emissiveIntensity = 0.5 + lampK * 0.7;
    bulbMat.update();

    // Relámpago: temporizador -> destello (doble parpadeo) -> trueno con retardo.
    strikeTimer -= dt;
    if (strikeTimer <= 0) {
      flash = 1;
      strikeTimer = 7 + Math.random() * 12;
      setTimeout(() => playThunder(), 120 + Math.random() * 400);
    }
    flash = Math.max(0, flash - dt * 3.2);
    const flashK = flash > 0 ? flash * (0.55 + 0.45 * Math.abs(Math.sin(elapsed * 38))) : 0;
    lightning.light.intensity = flashK * 6;
    // El rayo enciende el cielo (fondo) y el aire; entra al kiosko por la ventana.
    camClear.set(0.004 + flashK * 0.5, 0.006 + flashK * 0.55, 0.011 + flashK * 0.7);
    skyFog.set(0.008 + flashK * 0.45, 0.012 + flashK * 0.5, 0.022 + flashK * 0.65);

    // Gato: lerp suave hacia la pose del estado actual (dormido/mira/escondido).
    const pose = GATO_POSES[gatoState];
    const k = Math.min(1, dt * 4);
    gatoLift += (pose.y - gatoLift) * k;
    gatoYaw += (pose.yaw - gatoYaw) * k;
    gato.setLocalPosition(gatoBase.x, gatoBase.y + gatoLift, gatoBase.z);
    gato.setLocalEulerAngles(0, gatoYaw, 0);
    const glow = pose.glow * (0.7 + 0.3 * Math.sin(elapsed * 3));
    matGato.emissive.set(glow, glow * 0.12, glow * 0.04);
    matGato.emissiveIntensity = pose.glow > 0 ? 0.6 : 0;
    matGato.update();
    updateCustomer(dt);
  });

  let lastTicketKey = null;
  const unsubscribe = runController.subscribe((snapshot) => {
    const customerId = snapshot.currentTransaction?.customerId;
    scheduleCustomer(customerId);

    // Presagio: el gato reacciona al cliente raro / a la maldición alta.
    const kind = snapshot.currentTransaction?.request.kind;
    const curseNow = snapshot.state.curse;
    let nextGato = "dormido";
    if (kind === "impossible" || curseNow >= 5) nextGato = "escondido";
    else if (kind === "tensioned" || curseNow >= 3) nextGato = "mira";
    if (nextGato !== gatoState) {
      gatoState = nextGato;
      if (nextGato !== "dormido" && snapshot.phase === "playing") playCat();
    }

    const ticket = snapshot.state.lastTicket;
    const ticketKey = ticket ? `${ticket.transactionId}:${ticket.actionId}` : null;
    if (ticketKey && ticketKey !== lastTicketKey && snapshot.phase === "playing") {
      lastTicketKey = ticketKey;
      // Cada acción suena distinto: cobro (plata), fiar (anota), negar (rechazo), preguntar.
      if (ticket.actionId === "charge") {
        playTicket();
        playCoin();
      } else if (ticket.actionId === "credit") {
        playTicket();
        playClick(); // raspón de lapicera al anotar
      } else if (ticket.actionId === "cancel") {
        playError();
      } else if (ticket.actionId === "ask") {
        playClick();
      } else {
        playTicket();
      }
    }

    if (snapshot.phase === "playing") startRain();
    else stopRain();

    const curse = Math.min(snapshot.state.curse, 8);
    interiorLight.light.color = new pc.Color(
      Math.max(0.3, 1.0 - curse * 0.04),
      Math.max(0.2, 0.78 - curse * 0.06),
      Math.max(0.15, 0.46 - curse * 0.05),
    );
    // La intensidad la maneja el loop por-frame (parpadeo); acá solo el color cálido.
  });

  const resize = () => app.resizeCanvas();
  window.addEventListener("resize", resize);

  return {
    destroy() {
      unsubscribe();
      window.removeEventListener("resize", resize);
      app.destroy();
    },
  };
}
