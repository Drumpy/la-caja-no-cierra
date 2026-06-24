import * as pc from "playcanvas";

/**
 * Orbit camera: left-drag to rotate, scroll to zoom.
 * Calls onClick(x, y) on mouseup if the mouse didn't drag (threshold 5px).
 */
export function createOrbitCamera(app, cameraEntity, pivot, options = {}) {
  const {
    distance = 4.5,
    minDistance = 2.5,
    maxDistance = 7,
    minPitch = -55,
    maxPitch = 8,
    dragSensitivity = 0.22,
    zoomSensitivity = 0.08,
    onClick = null,
  } = options;

  let yaw = 0;
  let pitch = -10;
  let dist = distance;
  let isDown = false;
  let didDrag = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  const mouse = app.mouse;

  mouse.on(pc.EVENT_MOUSEDOWN, (e) => {
    if (e.button !== pc.MOUSEBUTTON_LEFT) return;
    isDown = true;
    didDrag = false;
    startX = lastX = e.x;
    startY = lastY = e.y;
  });

  mouse.on(pc.EVENT_MOUSEMOVE, (e) => {
    if (!isDown) return;
    if (Math.abs(e.x - startX) > 5 || Math.abs(e.y - startY) > 5) didDrag = true;
    const dx = e.x - lastX;
    const dy = e.y - lastY;
    yaw -= dx * dragSensitivity;
    pitch = Math.max(minPitch, Math.min(maxPitch, pitch - dy * dragSensitivity));
    lastX = e.x;
    lastY = e.y;
  });

  mouse.on(pc.EVENT_MOUSEUP, (e) => {
    if (!isDown) return;
    isDown = false;
    if (!didDrag && onClick) onClick(e.x, e.y);
  });

  mouse.on(pc.EVENT_MOUSEWHEEL, (e) => {
    dist = Math.max(minDistance, Math.min(maxDistance, dist - e.wheel * zoomSensitivity));
  });

  app.on("update", () => {
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;
    const cp = Math.cos(pitchRad);
    cameraEntity.setLocalPosition(
      pivot.x + dist * cp * Math.sin(yawRad),
      pivot.y + dist * Math.sin(pitchRad),
      pivot.z + dist * cp * Math.cos(yawRad),
    );
    cameraEntity.lookAt(pivot.x, pivot.y, pivot.z);
  });

  return {
    reset() {
      yaw = 0;
      pitch = -10;
      dist = distance;
    },
  };
}
