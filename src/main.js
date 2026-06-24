import "./styles.css";
import { createGame } from "./app/createGame.js";

const canvas = document.querySelector("#game-canvas");
const hudRoot = document.querySelector("#hud-root");

createGame({ canvas, hudRoot });
