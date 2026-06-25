import * as pc from "playcanvas";

/**
 * First-person camera: hover to look, WASD to move within bounds.
 * onClick fires on left mouseup for object interaction.
 */
export function applyLookDelta(look, { dx, dy, sensitivity, minPitch = -60, maxPitch = 25 }) {
  return {
    yaw: look.yaw - dx * sensitivity,
    pitch: Math.max(minPitch, Math.min(maxPitch, look.pitch - dy * sensitivity)),
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function insideRect(pos, rect) {
  return pos.x > rect.minX && pos.x < rect.maxX && pos.z > rect.minZ && pos.z < rect.maxZ;
}

export function applyMovementConstraints(next, previous, { bounds, obstacles = [], radius = 0 }) {
  const pos = {
    x: clamp(next.x, bounds.minX, bounds.maxX),
    y: next.y,
    z: clamp(next.z, bounds.minZ, bounds.maxZ),
  };

  for (const obstacle of obstacles) {
    const rect = {
      minX: obstacle.minX - radius,
      maxX: obstacle.maxX + radius,
      minZ: obstacle.minZ - radius,
      maxZ: obstacle.maxZ + radius,
    };
    if (!insideRect(pos, rect)) continue;

    if (previous.z >= rect.maxZ) pos.z = rect.maxZ;
    else if (previous.z <= rect.minZ) pos.z = rect.minZ;
    else if (previous.x <= rect.minX) pos.x = rect.minX;
    else if (previous.x >= rect.maxX) pos.x = rect.maxX;
    else {
      const exits = [
        { axis: "x", value: rect.minX, dist: Math.abs(pos.x - rect.minX) },
        { axis: "x", value: rect.maxX, dist: Math.abs(rect.maxX - pos.x) },
        { axis: "z", value: rect.minZ, dist: Math.abs(pos.z - rect.minZ) },
        { axis: "z", value: rect.maxZ, dist: Math.abs(rect.maxZ - pos.z) },
      ].sort((a, b) => a.dist - b.dist);
      pos[exits[0].axis] = exits[0].value;
    }
  }

  // Re-clamp: un obstáculo que sobresale de los límites (rect más ancho que bounds)
  // no puede empujar al jugador fuera de la sala. La contención manda.
  pos.x = clamp(pos.x, bounds.minX, bounds.maxX);
  pos.z = clamp(pos.z, bounds.minZ, bounds.maxZ);
  return pos;
}

export function createFirstPersonCamera(app, cameraEntity, options = {}) {
  const {
    moveSpeed = 2.5,
    lookSensitivity = 0.14,
    bounds = { minX: -2, maxX: 2, minZ: -1.8, maxZ: 0.5 },
    obstacles = [],
    radius = 0.22,
    onClick = null,
  } = options;

  let yaw = 0;
  let pitch = 0;
  const keys = {};

  const canvas = app.graphicsDevice.canvas;
  const isLocked = () => document.pointerLockElement === canvas;

  // Mira fija en el centro: el jugador apunta moviendo la cámara, no el cursor.
  let crosshair = document.getElementById("fp-crosshair");
  if (!crosshair) {
    crosshair = document.createElement("div");
    crosshair.id = "fp-crosshair";
    crosshair.style.cssText =
      "position:fixed;top:50%;left:50%;width:6px;height:6px;margin:-3px 0 0 -3px;" +
      "border-radius:50%;background:rgba(255,255,255,0.85);box-shadow:0 0 2px #000;" +
      "pointer-events:none;z-index:10;display:none;";
    document.body.appendChild(crosshair);
  }

  // Pointer Lock: el cursor desaparece y movementX/Y giran sin tope en los bordes del navegador.
  canvas.addEventListener("mousedown", () => {
    if (!isLocked()) canvas.requestPointerLock();
  });
  document.addEventListener("mousemove", (e) => {
    if (!isLocked()) return;
    // Pointer Lock entrega picos espurios (bug Chrome/accel): movementX/Y enormes que dan saltos.
    // ponytail: descartar el evento entero si excede el umbral; subir MAX si come flicks reales.
    const MAX = 120;
    if (Math.abs(e.movementX) > MAX || Math.abs(e.movementY) > MAX) return;
    ({ yaw, pitch } = applyLookDelta({ yaw, pitch }, { dx: e.movementX, dy: e.movementY, sensitivity: lookSensitivity }));
  });
  // Mientras está bloqueado, el click interactúa con lo que apunta la mira (centro de pantalla).
  // El click que adquiere el lock no interactúa: pointerLockElement aún no está activo en ese mouseup.
  document.addEventListener("mouseup", (e) => {
    if (e.button === 0 && isLocked() && onClick) onClick(canvas.clientWidth / 2, canvas.clientHeight / 2);
  });
  document.addEventListener("pointerlockchange", () => {
    crosshair.style.display = isLocked() ? "block" : "none";
  });

  window.addEventListener("keydown", (e) => { keys[e.code] = true; });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; });

  const forward = new pc.Vec3();
  const right = new pc.Vec3();
  const pos = new pc.Vec3();
  const prev = new pc.Vec3();

  app.on("update", (dt) => {
    // Move relative to yaw only; pitch should not move the player vertically.
    const yawRad = yaw * pc.math.DEG_TO_RAD;
    forward.set(-Math.sin(yawRad), 0, -Math.cos(yawRad));
    right.set(Math.cos(yawRad), 0, -Math.sin(yawRad));

    cameraEntity.getLocalPosition(pos);
    prev.copy(pos);
    if (keys.KeyW || keys.ArrowUp) pos.addScaled(forward, moveSpeed * dt);
    if (keys.KeyS || keys.ArrowDown) pos.addScaled(forward, -moveSpeed * dt);
    if (keys.KeyA || keys.ArrowLeft) pos.addScaled(right, -moveSpeed * dt);
    if (keys.KeyD || keys.ArrowRight) pos.addScaled(right, moveSpeed * dt);

    const constrained = applyMovementConstraints(pos, prev, { bounds, obstacles, radius });
    cameraEntity.setLocalPosition(constrained.x, 1.55, constrained.z);
    cameraEntity.setLocalEulerAngles(pitch, yaw, 0);
  });

  return { reset() { yaw = 0; pitch = 0; } };
}
