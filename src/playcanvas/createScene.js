import * as pc from "playcanvas";
import { CUSTOMERS } from "../content/customers.js";
import { createOrbitCamera } from "./orbitCamera.js";

// ── helpers ──────────────────────────────────────────────

function makeMaterial(name, color, opts = {}) {
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

function addBox(app, name, pos, scale, material) {
  const e = new pc.Entity(name);
  e.addComponent("render", { type: "box", material });
  e.setLocalPosition(pos.x, pos.y, pos.z);
  e.setLocalScale(scale.x, scale.y, scale.z);
  app.root.addChild(e);
  return e;
}

function addPlane(app, name, pos, scale, material, rotation = { x: -90, y: 0, z: 0 }) {
  const e = new pc.Entity(name);
  e.addComponent("render", { type: "plane", material });
  e.setLocalPosition(pos.x, pos.y, pos.z);
  e.setLocalScale(scale.x, scale.y, scale.z);
  e.setLocalEulerAngles(rotation.x, rotation.y, rotation.z);
  app.root.addChild(e);
  return e;
}

// ── raycast (sin physics) ────────────────────────────────

function rayAABB(ox, oy, oz, dx, dy, dz, cx, cy, cz, hx, hy, hz) {
  const minX = cx - hx, maxX = cx + hx;
  const minY = cy - hy, maxY = cy + hy;
  const minZ = cz - hz, maxZ = cz + hz;
  let tmin = -Infinity, tmax = Infinity;

  for (const [o, d, mn, mx] of [
    [ox, dx, minX, maxX],
    [oy, dy, minY, maxY],
    [oz, dz, minZ, maxZ],
  ]) {
    if (Math.abs(d) > 1e-8) {
      const t1 = (mn - o) / d;
      const t2 = (mx - o) / d;
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

  let closest = null;
  let closestT = Infinity;
  for (const entry of interactives) {
    const pos = entry.entity.getPosition();
    const scl = entry.entity.getLocalScale();
    const t = rayAABB(
      origin.x, origin.y, origin.z,
      dir.x, dir.y, dir.z,
      pos.x, pos.y, pos.z,
      scl.x / 2, scl.y / 2, scl.z / 2,
    );
    if (t !== null && t < closestT) {
      closestT = t;
      closest = entry;
    }
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

  // Atmósfera: niebla + cielo oscuro
  app.scene.fog.type = pc.FOG_LINEAR;
  app.scene.fog.color = new pc.Color(0.02, 0.025, 0.04);
  app.scene.fog.start = 3.5;
  app.scene.fog.end = 11;
  app.scene.ambientLight = new pc.Color(0.08, 0.07, 0.06);

  // Materiales
  const matWarm = makeMaterial("warm", new pc.Color(0.66, 0.52, 0.31));
  const matCounter = makeMaterial("counter", new pc.Color(0.32, 0.22, 0.15));
  const matFloor = makeMaterial("floor", new pc.Color(0.14, 0.12, 0.09));
  const matStreet = makeMaterial("street", new pc.Color(0.06, 0.1, 0.16));
  const matGlass = makeMaterial("glass", new pc.Color(0.35, 0.55, 0.68), { opacity: 0.25 });
  const matProduct = makeMaterial("product", new pc.Color(0.72, 0.62, 0.38), {
    emissive: new pc.Color(0.15, 0.12, 0.06),
    emissiveIntensity: 0.2,
  });
  const matProductGlow = makeMaterial("productGlow", new pc.Color(0.85, 0.75, 0.45), {
    emissive: new pc.Color(0.5, 0.4, 0.18),
    emissiveIntensity: 0.7,
  });
  const matCustomer = makeMaterial("customer", new pc.Color(0.08, 0.08, 0.1));
  const matObject = makeMaterial("object", new pc.Color(0.2, 0.18, 0.14));
  const matCaja = makeMaterial("caja", new pc.Color(0.28, 0.24, 0.16), {
    emissive: new pc.Color(0.08, 0.06, 0.02),
    emissiveIntensity: 0.3,
  });
  const matLibreta = makeMaterial("libreta", new pc.Color(0.12, 0.1, 0.07));
  const matRadio = makeMaterial("radio", new pc.Color(0.25, 0.22, 0.18));
  const matGato = makeMaterial("gato", new pc.Color(0.35, 0.3, 0.22));

  // Geometría
  addBox(app, "back wall", { x: 0, y: 1.4, z: -2.15 }, { x: 4.8, y: 2.8, z: 0.1 }, matWarm);
  addBox(app, "side wall L", { x: -2.35, y: 1.4, z: -1 }, { x: 0.1, y: 2.8, z: 2.4 }, matWarm);
  addBox(app, "side wall R", { x: 2.35, y: 1.4, z: -1 }, { x: 0.1, y: 2.8, z: 2.4 }, matWarm);
  addPlane(app, "floor", { x: 0, y: 0, z: -0.5 }, { x: 4.8, y: 3.2 }, matFloor);
  addBox(app, "street", { x: 0, y: 0.2, z: -3.1 }, { x: 5.8, y: 0.08, z: 1.9 }, matStreet);
  addBox(app, "service window", { x: 0, y: 1.55, z: -2.05 }, { x: 2.2, y: 1.15, z: 0.06 }, matGlass);
  addBox(app, "counter", { x: 0, y: 0.35, z: -0.65 }, { x: 4.6, y: 0.35, z: 1.0 }, matCounter);
  addBox(app, "shelf back", { x: 0, y: 1.1, z: -2.05 }, { x: 3.8, y: 0.5, z: 0.08 }, matCounter);

  const caja = addBox(app, "cash register", { x: -1.25, y: 0.78, z: -0.7 }, { x: 0.55, y: 0.25, z: 0.42 }, matCaja);
  const libreta = addBox(app, "notebook", { x: 1.2, y: 0.72, z: -0.5 }, { x: 0.58, y: 0.06, z: 0.42 }, matLibreta);
  const radio = addBox(app, "radio", { x: 1.9, y: 0.82, z: -1.25 }, { x: 0.34, y: 0.3, z: 0.25 }, matRadio);
  const gato = addBox(app, "cat", { x: -1.95, y: 0.76, z: -1.0 }, { x: 0.38, y: 0.16, z: 0.22 }, matGato);

  const customer = addBox(
    app, "customer silhouette",
    { x: 0, y: 1.12, z: -2.42 },
    { x: 0.55, y: 1.25, z: 0.08 },
    matCustomer,
  );

  // Productos (guardamos referencia para highlight)
  const productEntities = {
    cafe: addBox(app, "product-cafe", { x: -1.7, y: 0.85, z: -1.3 }, { x: 0.28, y: 0.22, z: 0.28 }, matProduct),
    "cigarros-ficticios": addBox(app, "product-cigarros", { x: -1.15, y: 0.85, z: -1.3 }, { x: 0.28, y: 0.22, z: 0.28 }, matProduct),
    chicles: addBox(app, "product-chicles", { x: -0.6, y: 0.85, z: -1.3 }, { x: 0.28, y: 0.22, z: 0.28 }, matProduct),
    vela: addBox(app, "product-vela", { x: -0.05, y: 0.85, z: -1.3 }, { x: 0.28, y: 0.22, z: 0.28 }, matProduct),
  };
  const productOriginalY = {};
  for (const [id, e] of Object.entries(productEntities)) {
    productOriginalY[id] = e.getLocalPosition().y;
  }

  // Cámara + orbit
  const camera = new pc.Entity("camera");
  camera.addComponent("camera", {
    clearColor: new pc.Color(0.02, 0.025, 0.04),
    fov: 50,
    farClip: 20,
  });
  app.root.addChild(camera);

  // Luz interior (cambia con maldición)
  const interiorLight = new pc.Entity("interior light");
  interiorLight.addComponent("light", {
    type: "omni",
    color: new pc.Color(1.0, 0.78, 0.46),
    intensity: 1.8,
    range: 6,
  });
  interiorLight.setLocalPosition(-1.3, 2.2, 0.4);
  app.root.addChild(interiorLight);

  // Luz calle (fría)
  const streetLight = new pc.Entity("street light");
  streetLight.addComponent("light", {
    type: "omni",
    color: new pc.Color(0.28, 0.42, 0.65),
    intensity: 1.2,
    range: 5,
  });
  streetLight.setLocalPosition(1.4, 2.1, -2.8);
  app.root.addChild(streetLight);

  // Luz del mostrador (spot cálida)
  const counterLight = new pc.Entity("counter light");
  counterLight.addComponent("light", {
    type: "spot",
    color: new pc.Color(0.9, 0.7, 0.4),
    intensity: 1.0,
    range: 4,
    innerConeAngle: 35,
    outerConeAngle: 50,
  });
  counterLight.setLocalPosition(0, 2.4, 0.8);
  counterLight.setLocalEulerAngles(65, 0, 0);
  app.root.addChild(counterLight);

  // ── interacción 3D ────────────────────────────────────

  const interactives = [
    { entity: caja, productId: null, action: "charge", label: "Caja" },
    { entity: libreta, productId: null, action: "notebook", label: "Libreta" },
    { entity: radio, productId: null, action: "radio", label: "Radio" },
    { entity: gato, productId: null, action: "cat", label: "Gato" },
    { entity: productEntities.cafe, productId: "cafe", action: null, label: "Café" },
    { entity: productEntities["cigarros-ficticios"], productId: "cigarros-ficticios", action: null, label: "Cigarros" },
    { entity: productEntities.chicles, productId: "chicles", action: null, label: "Chicles" },
    { entity: productEntities.vela, productId: "vela", action: null, label: "Vela" },
  ];

  function handleClick(screenX, screenY) {
    const hit = pickEntity(camera, screenX, screenY, interactives);
    if (!hit) return;

    flashEntity(hit.entity);

    if (hit.productId) {
      runController.selectProduct(hit.productId);
    } else if (hit.action === "charge") {
      runController.chooseAction("charge");
    } else if (hit.action === "notebook") {
      const snap = runController.getSnapshot();
      const tx = snap.currentTransaction;
      if (tx?.actions.openNotebook) {
        runController.chooseAction("openNotebook");
      } else if (tx?.actions.credit) {
        runController.chooseAction("credit");
      }
    } else if (hit.action === "radio") {
      flashEntity(radio, 0.5);
    } else if (hit.action === "cat") {
      flashEntity(gato, 0.4);
    }
  }

  const orbit = createOrbitCamera(app, camera, { x: 0, y: 1.1, z: -1.2 }, {
    distance: 4.5,
    onClick: handleClick,
  });

  // ── feedback visual ───────────────────────────────────

  const flashTimers = new Map();
  function flashEntity(entity, duration = 0.25) {
    flashTimers.set(entity, { time: duration, total: duration });
  }

  app.on("update", (dt) => {
    // Flash decay
    for (const [entity, f] of flashTimers) {
      f.time -= dt;
      if (f.time <= 0) {
        flashTimers.delete(entity);
        entity.setLocalScale(1, 1, 1);
      } else {
        const t = f.time / f.total;
        const s = 1 + 0.25 * t;
        entity.setLocalScale(s, s, s);
      }
    }

    // Productos seleccionados: flotan + glow
    const snap = runController.getSnapshot();
    for (const [id, e] of Object.entries(productEntities)) {
      const selected = snap.state.selectedProductIds.includes(id);
      const baseY = productOriginalY[id];
      const y = selected ? baseY + 0.12 + Math.sin(app.time * 3) * 0.02 : baseY;
      const p = e.getLocalPosition();
      e.setLocalPosition(p.x, y, p.z);
      e.render.material = selected ? matProductGlow : matProduct;
    }
  });

  // ── state subscription ────────────────────────────────

  function customerColor(snapshot) {
    const id = snapshot.currentTransaction?.customerId;
    const hex = CUSTOMERS[id]?.color ?? "#1a1a1a";
    return pc.Color.fromString(hex);
  }

  const unsubscribe = runController.subscribe((snapshot) => {
    const color = customerColor(snapshot);
    matCustomer.diffuse = color;
    matCustomer.update();
    customer.enabled = Boolean(snapshot.currentTransaction);

    // Maldición → luz interior más roja y débil
    const curse = Math.min(snapshot.state.curse, 8);
    const r = 1.0 - curse * 0.04;
    const g = 0.78 - curse * 0.06;
    const b = 0.46 - curse * 0.05;
    const intensity = 1.8 - curse * 0.08;
    const light = interiorLight.light;
    light.color = new pc.Color(Math.max(0.3, r), Math.max(0.2, g), Math.max(0.15, b));
    light.intensity = Math.max(0.4, intensity);
  });

  window.addEventListener("resize", () => app.resizeCanvas());

  return {
    destroy() {
      unsubscribe();
      app.destroy();
    },
  };
}
