import * as pc from "playcanvas";
import { CUSTOMERS } from "../content/customers.js";
import { playCat, playClick, playCoin, playError, playTicket, playThunder, playVoice, startRain, stopRain, isVoicePlaying } from "../game/audio.js";
import { getRadioLine } from "../content/radio.js";
import { createTaxistaWalkMaterials } from "./characterMaterials.js";
import { createFirstPersonCamera } from "./firstPersonCamera.js";
import { applyRetroFilter } from "./retroFilter.js";
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

function addChildBox(parent, name, pos, scale, material) {
  const entity = new pc.Entity(name);
  entity.addComponent("render", { type: "box", material });
  entity.setLocalPosition(pos.x, pos.y, pos.z);
  entity.setLocalScale(scale.x, scale.y, scale.z);
  parent.addChild(entity);
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

export function serviceWindowLayout(frontZ, {
  cx = 0,
  holeW = 1.28,
  holeH = 0.95,
  sillH = 0.95,
  hatchOffsetX = -0.36,
  hatchOffsetY = 0.34,
  hatchW = 0.38,
  hatchH = 0.3,
  openAngle = -68,
} = {}) {
  const hatch = {
    cx: cx + hatchOffsetX,
    cy: sillH + hatchOffsetY,
    w: hatchW,
    h: hatchH,
    openAngle,
  };
  return {
    hole: { cx, cy: sillH + holeH / 2, w: holeW, h: holeH, sillH },
    hatch,
    customerTarget: { x: hatch.cx, y: 0.95, z: frontZ - 0.58 },
  };
}

export function counterLayout({ width, frontZ, sillH, depth = 0.62 }) {
  const height = sillH;
  return {
    pos: { x: 0, y: height / 2, z: frontZ + depth / 2 },
    scale: { x: width, y: height, z: depth },
  };
}

export function bookshelfLayout({ width, backZ }) {
  const shelfWidth = width - 0.25;
  const z = backZ - 0.25;
  const shelves = [0.75, 1.25, 1.75];
  return {
    width: shelfWidth,
    z,
    shelves,
    products: {
      cafe: { x: -1.05, shelfY: shelves[1], z },
      chicles: { x: -0.35, shelfY: shelves[1], z },
      vela: { x: 0.35, shelfY: shelves[1], z },
      "cigarros-ficticios": { x: 1.05, shelfY: shelves[1], z },
    },
  };
}

export function frontWallPanels(cx, width, height, holeW, holeH, sillH) {
  const left = cx - width / 2;
  const right = cx + width / 2;
  const holeLeft = cx - holeW / 2;
  const holeRight = cx + holeW / 2;
  const holeTop = sillH + holeH;
  return [
    { name: "sill", x0: left, x1: right, y0: 0, y1: sillH },
    { name: "left", x0: left, x1: holeLeft, y0: sillH, y1: height },
    { name: "right", x0: holeRight, x1: right, y0: sillH, y1: height },
    { name: "top", x0: holeLeft, x1: holeRight, y0: holeTop, y1: height },
  ].filter((p) => p.x1 > p.x0 && p.y1 > p.y0);
}

function addFrontWallSurface(app, cx, cz, width, height, thickness, holeW, holeH, sillH, material) {
  const wallLeft = cx - width / 2;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (const p of frontWallPanels(cx, width, height, holeW, holeH, sillH)) {
    const base = positions.length / 3;
    const corners = [
      [p.x0, p.y0],
      [p.x1, p.y0],
      [p.x1, p.y1],
      [p.x0, p.y1],
    ];
    for (const [x, y] of corners) {
      positions.push(x, y, 0);
      normals.push(0, 0, 1);
      uvs.push((x - wallLeft) / width, y / height);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  const geometry = new pc.Geometry();
  geometry.positions = positions;
  geometry.normals = normals;
  geometry.uvs = uvs;
  geometry.indices = indices;
  const mesh = pc.Mesh.fromGeometry(app.graphicsDevice, geometry);
  const entity = new pc.Entity("front-wall-surface");
  entity.addComponent("render", { type: "asset" });
  entity.render.meshInstances = [new pc.MeshInstance(mesh, material, entity)];
  entity.setLocalPosition(0, 0, cz + thickness / 2 + 0.002);
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
  addFrontWallSurface(app, cx, cz, width, height, thickness, holeW, holeH, sillH, material);
}

function addServiceWindow(app, layout, z, material) {
  const { hole, hatch } = layout;
  const bar = 0.035;
  const grateZ = z + 0.075;
  const hatchLeft = hatch.cx - hatch.w / 2;
  const hatchRight = hatch.cx + hatch.w / 2;
  const hatchBottom = hatch.cy - hatch.h / 2;
  const hatchTop = hatch.cy + hatch.h / 2;

  addBox(app, "window-frame-top", { x: hole.cx, y: hole.cy + hole.h / 2, z: grateZ }, { x: hole.w + bar, y: bar, z: 0.035 }, material);
  addBox(app, "window-frame-bottom", { x: hole.cx, y: hole.cy - hole.h / 2, z: grateZ }, { x: hole.w + bar, y: bar, z: 0.035 }, material);
  addBox(app, "window-frame-left", { x: hole.cx - hole.w / 2, y: hole.cy, z: grateZ }, { x: bar, y: hole.h + bar, z: 0.035 }, material);
  addBox(app, "window-frame-right", { x: hole.cx + hole.w / 2, y: hole.cy, z: grateZ }, { x: bar, y: hole.h + bar, z: 0.035 }, material);

  for (let i = 1; i <= 4; i++) {
    const x = hole.cx - hole.w / 2 + (hole.w * i) / 5;
    if (x > hatchLeft && x < hatchRight) continue;
    addBox(app, `window-grate-v-${i}`, { x, y: hole.cy, z: grateZ + 0.005 }, { x: 0.018, y: hole.h, z: 0.02 }, material);
  }
  for (let i = 1; i <= 2; i++) {
    // +0.16: sube los barrotes para que el de arriba no cruce la cara del cliente.
    const y = hole.cy - hole.h / 2 + (hole.h * i) / 3 + 0.16;
    if (y > hatchBottom && y < hatchTop) continue;
    addBox(app, `window-grate-h-${i}`, { x: hole.cx, y, z: grateZ + 0.006 }, { x: hole.w, y: 0.018, z: 0.02 }, material);
  }

  const door = new pc.Entity("service-hatch-door");
  door.setLocalPosition(hatch.cx - hatch.w / 2, hatch.cy, grateZ + 0.03);
  app.root.addChild(door);
  addChildBox(door, "service-hatch-top", { x: hatch.w / 2, y: hatch.h / 2, z: 0 }, { x: hatch.w, y: 0.024, z: 0.024 }, material);
  addChildBox(door, "service-hatch-bottom", { x: hatch.w / 2, y: -hatch.h / 2, z: 0 }, { x: hatch.w, y: 0.024, z: 0.024 }, material);
  addChildBox(door, "service-hatch-right", { x: hatch.w, y: 0, z: 0 }, { x: 0.024, y: hatch.h, z: 0.024 }, material);
  addChildBox(door, "service-hatch-left", { x: 0, y: 0, z: 0 }, { x: 0.024, y: hatch.h, z: 0.024 }, material);
  addChildBox(door, "service-hatch-grate-v", { x: hatch.w / 2, y: 0, z: 0.004 }, { x: 0.014, y: hatch.h, z: 0.018 }, material);
  addChildBox(door, "service-hatch-grate-h", { x: hatch.w / 2, y: 0, z: 0.005 }, { x: hatch.w, y: 0.014, z: 0.018 }, material);
  return door;
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
    const pos = entry.pickPosition ?? entry.entity.getPosition();
    const scale = entry.pickScale ?? entry.entity.getLocalScale();
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
  const matWindowMetal = generated.windowMetal;
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
  const FRONT_Z = -D / 2;
  const BACK_Z = D / 2;
  const WINDOW = serviceWindowLayout(FRONT_Z);
  const HOLE_W = WINDOW.hole.w;
  const HOLE_H = WINDOW.hole.h;
  const SILL_H = WINDOW.hole.sillH;
  const WIN_CY = WINDOW.hole.cy;

  addBox(app, "floor", { x: 0, y: -0.025, z: 0 }, { x: W, y: 0.05, z: D }, generated.floor);
  addBox(app, "ceiling", { x: 0, y: H - 0.02, z: 0 }, { x: W, y: 0.04, z: D }, matCeiling);
  addWallWithHole(app, 0, FRONT_Z, W, H, 0.1, HOLE_W, HOLE_H, SILL_H, generated.wall);
  const serviceHatchDoor = addServiceWindow(app, WINDOW, FRONT_Z, matWindowMetal);
  addBox(app, "wall-left", { x: -W / 2, y: H / 2, z: 0 }, { x: 0.1, y: H, z: D }, generated.wall);
  addBox(app, "wall-right", { x: W / 2, y: H / 2, z: 0 }, { x: 0.1, y: H, z: D }, generated.wall);
  addBox(app, "wall-back", { x: 0, y: H / 2, z: BACK_Z }, { x: W, y: H, z: 0.1 }, generated.wall);

  const counterSpec = counterLayout({ width: W, frontZ: FRONT_Z, sillH: SILL_H });
  const counterZ = counterSpec.pos.z;
  const counter = addBox(app, "counter", counterSpec.pos, counterSpec.scale, generated.wood);
 const shelf = bookshelfLayout({ width: W, backZ: BACK_Z });
 const shelfSideH = shelf.shelves.at(-1) - shelf.shelves[0] + 0.55;
 const shelfCenterY = (shelf.shelves[0] + shelf.shelves.at(-1)) / 2;
 addBox(app, "bookshelf-left", { x: -shelf.width / 2, y: shelfCenterY, z: shelf.z }, { x: 0.06, y: shelfSideH, z: 0.32 }, generated.wood);
 addBox(app, "bookshelf-right", { x: shelf.width / 2, y: shelfCenterY, z: shelf.z }, { x: 0.06, y: shelfSideH, z: 0.32 }, generated.wood);
 for (const [i, y] of shelf.shelves.entries()) {
 addBox(app, `bookshelf-board-${i}`, { x: 0, y, z: shelf.z }, { x: shelf.width, y: 0.05, z: 0.32 }, generated.wood);
 }

 const productEntities = {
 cafe: addBox(app, "product-cafe", { x: shelf.products.cafe.x, y: shelf.products.cafe.shelfY + 0.12, z: shelf.products.cafe.z }, { x: 0.2, y: 0.18, z: 0.2 }, generated.products.cafe),
 chicles: addBox(app, "product-chicles", { x: shelf.products.chicles.x, y: shelf.products.chicles.shelfY + 0.12, z: shelf.products.chicles.z }, { x: 0.2, y: 0.18, z: 0.2 }, generated.products.chicles),
 vela: addBox(app, "product-vela", { x: shelf.products.vela.x, y: shelf.products.vela.shelfY + 0.12, z: shelf.products.vela.z }, { x: 0.2, y: 0.18, z: 0.2 }, generated.products.vela),
 "cigarros-ficticios": addBox(
 app,
 "product-cigarros",
 { x: shelf.products["cigarros-ficticios"].x, y: shelf.products["cigarros-ficticios"].shelfY + 0.07, z: shelf.products["cigarros-ficticios"].z },
 { x: 0.22, y: 0.08, z: 0.28 },
 generated.products["cigarros-ficticios"],
 ),
 };
  const productBaseY = Object.fromEntries(
    Object.entries(productEntities).map(([id, entity]) => [id, entity.getLocalPosition().y]),
  );

  const counterTopY = counterSpec.pos.y + counterSpec.scale.y / 2;
  const caja = addBox(app, "caja", { x: -0.85, y: counterTopY + 0.1, z: counterZ }, { x: 0.4, y: 0.2, z: 0.3 }, matCaja);
  const libreta = addBox(app, "libreta", { x: 0.7, y: counterTopY + 0.025, z: counterZ + 0.05 }, { x: 0.45, y: 0.05, z: 0.32 }, matLibreta);
  const radio = addBox(app, "radio", { x: 1.1, y: counterTopY + 0.11, z: counterZ - 0.1 }, { x: 0.28, y: 0.22, z: 0.2 }, matRadio);
  const gato = addBox(app, "gato", { x: -1.15, y: counterTopY + 0.07, z: counterZ - 0.15 }, { x: 0.3, y: 0.14, z: 0.18 }, matGato);

  addPlane(app, "street", { x: 0, y: 0.01, z: FRONT_Z - 2.5 }, { x: 8, y: 6 }, matStreet);
  addBox(app, "taxi-glow", { x: 1.1, y: 0.45, z: FRONT_Z - 2.2 }, { x: 1.2, y: 0.28, z: 0.12 }, makeMat("taxi-glow", new pc.Color(0.72, 0.52, 0.18), { emissive: new pc.Color(0.28, 0.18, 0.05), emissiveIntensity: 0.18 }));
  const CUSTOMER_WINDOW = new pc.Vec3(WINDOW.customerTarget.x, WINDOW.customerTarget.y, WINDOW.customerTarget.z);
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
    nearClip: 0.05, // chico: evita que el plano cercano atraviese muebles/pared al pegarse
    farClip: 20,
    toneMapping: pc.TONEMAP_ACES, // rolloff filmico: el bulbo no se quema
    gammaCorrection: pc.GAMMA_SRGB,
  });
  camera.setLocalPosition(0, 1.55, BACK_Z - 0.75); // delante de la estantería (su rect llega a ~1.62)
  app.root.addChild(camera);
  applyRetroFilter(app, camera); // filtro VHS / PS1 / analog-horror

  const interactives = [
    { entity: caja, action: "charge" },
    { entity: libreta, action: "notebook" },
    { entity: radio, action: "radio" },
    { entity: gato, action: "cat" },
    {
      entity: serviceHatchDoor,
      action: "hatch",
      pickPosition: new pc.Vec3(WINDOW.hatch.cx, WINDOW.hatch.cy, FRONT_Z + 0.1),
      pickScale: new pc.Vec3(WINDOW.hatch.w, WINDOW.hatch.h, 0.12),
    },
    ...Object.entries(productEntities).map(([productId, entity]) => ({ entity, productId })),
  ];
  let hatchOpen = false;
  const originalMats = new Map(interactives.filter((entry) => entry.entity.render).map((entry) => [entry.entity, entry.entity.render.material]));
  const highlightTimers = new Map();

  function highlight(entity, duration = 0.35) {
    highlightTimers.set(entity, duration);
    entity.render.material = matProductGlow;
  }

  function handleClick(screenX, screenY) {
    const hit = pickEntity(camera, screenX, screenY, interactives);
    if (!hit) return;
  if (hit.action !== "hatch") highlight(hit.entity);
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

  if (hit.action === "hatch") {
    hatchOpen = !hatchOpen;
    serviceHatchDoor.setLocalEulerAngles(0, hatchOpen ? WINDOW.hatch.openAngle : 0, 0);
    return;
  }

  if (hit.action === "cat") playCat();
}

  // Mostrador y estantería ocupan todo el ancho jugable: son paredes, no obstáculos sueltos.
  // Los límites Z frenan al jugador delante de cada uno (standoff PLAYER_R), así nunca se mete
  // dentro del mueble ni mira "adentro".
  const PLAYER_R = 0.3;
  createFirstPersonCamera(app, camera, {
    bounds: {
      minX: -W / 2 + 0.3,
      maxX: W / 2 - 0.3,
      minZ: counterSpec.pos.z + counterSpec.scale.z / 2 + PLAYER_R, // delante del mostrador
      maxZ: shelf.z - 0.16 - PLAYER_R, // delante de la estantería
    },
    radius: PLAYER_R,
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
      // Parpadeo = la lamparita baja y tiembla en lo bajo, nunca sube de su brillo normal.
      lampK = 0.15 + Math.random() * 0.4;
    }
    interiorLight.light.intensity = lampBase * lampK;
    bulbMat.emissiveIntensity = 0.5 + lampK * 0.7;
    bulbMat.update();

    // Relámpago: temporizador -> destello (doble parpadeo) -> trueno con retardo.
    strikeTimer -= dt;
    if (strikeTimer <= 0) {
      if (isVoicePlaying()) {
        strikeTimer = 0.6 + Math.random() * 0.8; // voz del cliente: reintentar pronto, no pisarla
      } else {
        flash = 1;
        strikeTimer = 7 + Math.random() * 12;
        setTimeout(() => playThunder(), 120 + Math.random() * 400);
      }
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
