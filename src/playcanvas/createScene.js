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
