import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import voice from "../tools/asset-gen/skills/voice/index.mjs";

test("voice asset skill uses references by default", () => {
  const [request] = voice.plan({ prompt: "taxista" });

  assert.equal(request.variant, 1);
  assert.equal(request.ext, "mp3");
  assert.equal(path.basename(request.source), "taxista.mp3");
  assert.match(request.source, /tools\/asset-gen\/references\/taxista\.mp3$/);
});

test("voice asset validation rejects empty audio", async () => {
  const report = await voice.validate(Buffer.alloc(0), { asset: { ext: "mp3" } });

  assert.equal(report.ok, false);
  assert.deepEqual(report.issues, ["archivo de audio vacío"]);
});
