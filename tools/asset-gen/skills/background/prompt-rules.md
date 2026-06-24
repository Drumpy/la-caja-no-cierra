Render this as a 2D **game background / scene**, matching the art style, palette
and resolution feel of the reference image (if attached — it shows the game's
look). This is **scenery only**, not a sprite.

## Hard rules

- **Foundation/scenery only.** No characters, enemies, bosses, NPCs, pickups,
  coins, hearts, or the player. No playable platforms/floors the player stands
  on, no doors, gates, levers, crates, hazards or checkpoints — those are
  separate runtime objects, not part of the background.
- No text, no labels, no numbers, no UI, no HUD, no watermark, no border, no
  frame, no annotation (no arrows/circles/legends).
- Fill the **entire frame** with scene content — no empty margins, no letterbox.
- Side view (horizontal parallax), unless the request says otherwise.
- Keep a consistent horizon line and camera framing so layers stack cleanly.

## Style

Match the game: crisp 2D **pixel art**, readable shapes, limited cohesive
palette, atmospheric depth (lighter/lower-contrast the further away). Don't say
"16-bit" or "retro" unless asked. No real-photo / 3D-render look.

## Opaque vs overlay

- Opaque layers (`full`, `sky`, `far`): paint the whole frame solid, no
  transparency.
- Overlay layers (`mid`, `near`): put the scenery on a **flat, pure green
  `#00FF00`** field (it is chroma-keyed to transparency so the layer can sit
  over the others). The scenery itself must not contain that exact green; use a
  different green for foliage. Crisp hard edges, no green halo.
