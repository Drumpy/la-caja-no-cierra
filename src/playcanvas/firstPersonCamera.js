import * as pc from "playcanvas";

/**
 * First-person camera: drag to look, WASD to move within bounds.
 * onClick fires on mouseup if no drag happened.
 */
export function createFirstPersonCamera(app, cameraEntity, options = {}) {
  const {
    moveSpeed = 2.5,
    lookSensitivity = 0.2,
    bounds = { minX: -2, maxX: 2, minZ: -1.8, maxZ: 0.5 },
    onClick = null,
  } = options;

  let yaw = 0;
  let pitch = 0;
  let isDown = false;
  let didDrag = false;
  let lastX = 0;
  let lastY = 0;
  const keys = {};

  const mouse = app.mouse;

  mouse.on(pc.EVENT_MOUSEDOWN, (e) => {
    if (e.button !== pc.MOUSEBUTTON_LEFT) return;
    isDown = true;
    didDrag = false;
    lastX = e.x;
    lastY = e.y;
  });

  mouse.on(pc.EVENT_MOUSEMOVE, (e) => {
    if (!isDown) return;
    if (Math.abs(e.x - lastX) > 5 || Math.abs(e.y - lastY) > 5) didDrag = true;
    const dx = e.x - lastX;
    const dy = e.y - lastY;
    yaw -= dx * lookSensitivity;
    pitch = Math.max(-60, Math.min(25, pitch - dy * lookSensitivity));
    lastX = e.x;
    lastY = e.y;
  });

  mouse.on(pc.EVENT_MOUSEUP, (e) => {
    if (!isDown) return;
    isDown = false;
    if (!didDrag && onClick) onClick(e.x, e.y);
  });

  window.addEventListener("keydown", (e) => { keys[e.code] = true; });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; });

  const forward = new pc.Vec3();
  const right = new pc.Vec3();
  const pos = new pc.Vec3();

  app.on("update", (dt) => {
    // Look
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;
    forward.set(
      -Math.sin(yawRad) * Math.cos(pitchRad),
      Math.sin(pitchRad),
      -Math.cos(yawRad) * Math.cos(pitchRad),
    );
    right.set(Math.cos(yawRad), 0, -Math.sin(yawRad));

    // Move
    cameraEntity.getLocalPosition(pos);
    if (keys["KeyW"] || keys["ArrowUp"]) pos.addScaled(forward, moveSpeed * dt);
    if (keys["KeyS"] || keys["ArrowDown"]) pos.addScaled(forward, -moveSpeed * dt);
    if (keys["KeyA"] || keys["ArrowLeft"]) pos.addScaled(right, -moveSpeed * dt);
    if (keys["KeyD"] || keys["ArrowRight"]) pos.addScaled(right, moveSpeed * dt);

    pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x));
    pos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pos.z));
    pos.y = 1.55;
    cameraEntity.setLocalPosition(pos);

    // Apply look
    cameraEntity.setLocalEulerAngles(pitch, yaw, 0);
  });

  return { reset() { yaw = 0; pitch = 0; } };
}
