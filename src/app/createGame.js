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
