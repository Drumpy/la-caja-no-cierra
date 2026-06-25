import assert from "node:assert/strict";
import test from "node:test";
import { createRetroVoiceChain } from "../src/game/audio.js";

function fakeNode(kind) {
  return {
    kind,
    connections: [],
    connect(target) {
      this.connections.push(target);
      return target;
    },
  };
}

test("retro voice chain connects bandpass lowpass bitcrush gain", () => {
  const nodes = [];
  const destination = fakeNode("destination");
  const ctx = {
    createGain() {
      const node = fakeNode("gain");
      node.gain = { value: 1 };
      nodes.push(node);
      return node;
    },
    createBiquadFilter() {
      const node = fakeNode("biquad");
      node.frequency = { value: 0 };
      node.Q = { value: 0 };
      nodes.push(node);
      return node;
    },
    createWaveShaper() {
      const node = fakeNode("waveShaper");
      nodes.push(node);
      return node;
    },
  };

  const input = createRetroVoiceChain(ctx, destination);

  assert.equal(input, nodes[0]);
  assert.deepEqual(nodes.map((node) => node.kind), [
    "gain",
    "biquad",
    "biquad",
    "waveShaper",
    "gain",
  ]);
  assert.equal(nodes[1].type, "bandpass");
  assert.equal(nodes[2].type, "lowpass");
  assert.equal(nodes[3].curve.length, 256);
  assert.equal(nodes.at(-1).connections[0], destination);
});
