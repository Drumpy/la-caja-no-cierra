import { createRunController } from "../game/runController.js";
import { createScene } from "../playcanvas/createScene.js";
import { createDomHud } from "../ui/domHud.js";
import { createTicketOverlay } from "../ui/ticketOverlay.js";
import { createNotebookOverlay } from "../ui/notebookOverlay.js";

export function createGame({ canvas, hudRoot }) {
  if (!canvas) throw new Error("createGame requires a canvas");
  if (!hudRoot) throw new Error("createGame requires a HUD root");

  const runController = createRunController();
 const hud = createDomHud(hudRoot, runController);
 const ticket = createTicketOverlay(hudRoot, runController);
 const notebook = createNotebookOverlay(hudRoot, runController);
 const scene = createScene(canvas, runController);

  return {
    destroy() {
 scene.destroy();
 notebook.destroy();
 ticket.destroy();
 hud.destroy();
    },
  };
}
