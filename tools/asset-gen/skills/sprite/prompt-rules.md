Render this as a 2D **game sprite** that drops straight into the engine. Match
the art style, palette, proportions and resolution feel of the reference image
(if one is attached - it shows the game's existing look: the dog "Blu", cats,
props). Side view unless the request says otherwise. Treat every sprite as if it
may later need animation: clean silhouette, stable contact point, consistent
pixel density, and no baked-in scenery or FX unless explicitly requested.

## Background & cutout (hard requirement)

- Background is **100% solid, flat, uniform green `#00FF00`**. No gradient, no
  pattern, no scenery, no ground line, no drop shadow, no vignette, no glow.
- The subject must **NOT contain that exact green** (it gets chroma-keyed to
  transparency). For green parts of the subject (eyes, slime, glow) use a
  clearly different green — lime/chartreuse/teal — so they survive the cutout.
- **Crisp, hard pixel edges.** No soft anti-aliased halo, no feathering around
  the silhouette — a fuzzy edge breaks the transparency cutout.

## Subject & containment

- ONE subject only, centered, **full body fully inside the frame**.
- No body part, tail, antenna, weapon, wing tip, orb, spark or trail may cross
  a frame edge. Leave a small green margin on all four sides.
- No floating detached effects outside the main silhouette (unless the request
  explicitly asks for FX; then keep them tightly grouped and still inside the
  frame).
- If the sprite is an actor, enemy, creature or interactive prop, keep it ready
  for separate animation states: no background, no floor, no shadow baked into
  the PNG, no projectile glued to the body.

## Don'ts

- No text, no labels, no numbers, no watermark, no signature.
- No border, no frame, no box, no UI, no speech bubble.
- No real photo / 3D render look — flat 2D game art only.

## Animation sheets

When the request is an animation (walk, run, idle, attack, bark-attack, dash,
jump, land, hurt, stun, interact, collect, victory, death) and asks for N frames,
produce **one horizontal sprite sheet** with **exactly N frames in a single row**,
evenly spaced, **identical cell width**, a clear gap between frames and **no
overlap** (the frames are cut on a fixed grid - misaligned or overlapping frames
break the split).

Across every frame keep:

- the **same character identity** (same silhouette family, palette, face/eyes,
  markings, accessories) — only the pose / animation phase changes;
- the **same pixel scale and the same bounding box** — do not zoom or resize the
  subject between frames;
- the **same ground baseline** — feet/bottom anchored at the same height so the
  cycle does not bob in size.
- clear pose changes, not duplicated near-identical frames. Show anticipation,
  contact, impact, recoil, recovery, follow-through and secondary motion when
  the action calls for them.
- no wide detached projectile, shockwave, slash, dust cloud or impact flash in
  the body sheet unless requested. Those should be separate FX sprites.

## Using a reference

When a reference image is attached, treat it as the visual source of truth.
Keep **fixed**: silhouette family, palette, face/eyes, costume or markings,
material language, and art style. Allow to **change** only what the request
asks: pose, animation phase, action energy, or state (e.g. lit/unlit, alive/
defeated). Keep the flat-green background and containment rules even with a
reference.

For Blu-like quadrupeds, keep the mechanics believable: front and rear legs work
as coordinated pairs, the body does not stretch between frames, head/ears/tail
have a small delay, and the loop returns cleanly to the first frame.

## Style (pick from the request / reference)

- **pixel art** (default): classic crisp 2D pixel-art game sprite, hard edges,
  readable silhouette, limited palette — matches this game.
- **clean** : clean hand-painted 2D game art, crisp silhouette, smooth shading,
  no chunky pixels — only if the request asks for it.

Do not say "16-bit", "retro JRPG" or "chunky pixels" unless the request asks.
