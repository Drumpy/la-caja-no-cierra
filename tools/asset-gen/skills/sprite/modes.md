# Modes — choosing what to generate

Reference for picking the sheet layout, frame count and processing options when
generating sprites for this side-view platformer. All requests inherit the
shared asset animation bible in `tools/asset-gen/art-direction.md`; use this file
to choose the concrete preset and processing flags.

## Asset kinds

- **actor**: Blu, enemies (cat, roach), bosses — animated, grounded, side view.
- **prop**: lamp, coin, heart, crate, sign — static or a few states.
- **fx**: dust, glow, impact bursts, shockwaves, slash arcs — often floating /
  detached and generated separately from the actor body.
- **background**: scenery/parallax only. No characters, pickups, hazards,
  levers, collision floors or runtime objects baked in.

## Sheet presets (`--frames CxR`)

| Layout | `--frames` | Use for |
|--------|-----------|---------|
| 1 frame | (omit) | single prop / item / static sprite |
| 2 states | `2x1` | two-state prop (lamp off/on, lever, switch) |
| 4-frame micro action | `4x1` | land, collect, very small reactions |
| 5-frame state sheet | `5x1` | jump start/rise/apex/fall or short FX decay |
| 6-frame loop/action | `6x1` | idle, attack, bark-attack, dash, stun |
| 6-frame long idle | `6x1` | sit-look |
| 8-frame premium loop | `8x1` | walk, run, interact, victory |
| compact | `2x2` / `3x2` / `4x2` | when a row is too wide, but prefer one row for auto-splitting |

Frames are cut on a **fixed even grid**, so the prompt must ask for exactly N
evenly-spaced, equal, non-overlapping cells (see `prompt-rules.md`).

## Action frame templates (what to describe per frame)

- **walk** (`8x1`): contact -> down -> passing -> up -> opposite contact ->
  opposite down -> opposite passing -> opposite up. Quadrupeds must coordinate
  front and rear legs, with head/ears/tail delay.
- **run** (`8x1`): gather -> launch -> extension -> contact -> load -> rear
  drive -> suspension -> recovery. Use pose stretch, not pixel-scale zoom.
- **idle** (`6x1`): neutral -> inhale -> held breath -> exhale -> tiny secondary
  motion -> return. Subtle and slow, not dancing.
- **attack** (`6x1`): ready -> anticipation -> tension hold -> impact -> recoil
  -> recovery. Keep projectile/slash/muzzle flash as separate `fx`.
- **bark-attack** (`6x1`): ready -> inhale -> tension -> bark impact -> recoil
  -> recovery. Generate `bark-fx` separately for shockwave.
- **bark-fx** (`5x1`, `--align center --component all`): small ring -> expand ->
  peak -> break apart -> fade.
- **dash** (`6x1`): anticipation -> launch -> smear/extension -> travel ->
  brake -> recovery. Long trails are separate FX.
- **jump** (`5x1`): crouch -> takeoff -> rise -> apex -> fall. Use `land` for
  the landing squash.
- **land** (`4x1`): pre-contact -> impact/squash -> rebound -> settle. Dust is
  separate FX unless explicitly combined.
- **hurt** (`2x1`): impact → recoil.
- **stun** (`6x1`): dazed wobble loop with small delayed secondary motion.
- **sit-look** (`6x1`): seated forward -> head turns back -> hold backward
  look -> returns forward. Keep paws/butt/tail base planted.
- **sleep** (`4x1`): lying asleep -> inhale -> tiny twitch/hold -> exhale.
  No floating stars or text unless requested.
- **interact** (`8x1`): approach -> lead -> anticipation -> contact -> activate
  -> hold -> withdraw -> recovery.
- **collect** (`4x1`): neutral -> happy pickup -> follow-through -> recovery.
- **victory** (`8x1`): anticipation -> launch -> peak -> strongest celebration
  -> follow-through -> settle -> happy hold -> loop-friendly final pose.
- **death** (`1` or `2x1`): stagger -> collapsed / flattened defeat pose.
- **two-state prop** (`2x1`): left = off/inactive, right = on/active (same prop).

## Body vs FX rule

Use a body sprite for identity and gameplay pose. Use an FX sprite for sound
waves, dust, smoke, impact bursts, sparks, slash arcs, glow pulses, coin bursts,
and long dash trails. This keeps animation variants cheap: you can reuse the
same body sheet with different FX.

## Processor options (flags)

- `--align bottom` (default): feet/base on the same line — grounded actors and
  standing props. `center` for floating fx/projectiles, `top` for hanging things.
- `--component despeckle` (default): remove tiny stray bits the chroma-key
  leaves. `largest` keeps only the main body (drop all detached parts — good for
  a clean single creature). `all` keeps everything (use when detached FX are
  intentional).
- `--target <px>`: force a square output (items/icons like coin, heart).
- `--max <px>`: cap the longest side (default 256) — keeps files light.
- `--frames <CxR>`: override the action default only when you need a specific
  sheet shape. If the action has a premium default, prefer `--action` alone.

Multi-frame sheets are auto-normalized to a **shared bounding box + baseline**,
so the animation does not jump in size between frames.

## Useful examples

```bash
pnpm asset sprite "Blu base idle, relaxed but alive" --ref blu --action idle --name bluIdleBase
pnpm asset sprite "Blu quadruped walk, side view" --ref blu --action walk --name bluWalk
pnpm asset sprite "Blu bark body animation, no shockwave" --ref blu --action bark-attack --name bluBarkAttack
pnpm asset sprite bluSitLook
pnpm asset sprite bluSleep
pnpm asset sprite "blue-white bark sound shockwave" --action bark-fx --align center --component all --name barkShockwave
pnpm asset sprite "coin pickup sparkle burst, no coin body" --frames 5x1 --align center --component all --name coinBurst
```

## Render size is set by the atlas, not the PNG

The on-screen size comes from `js/atlas.js` (`w/h` per frame) × the entity's
scale — not from the PNG's pixel size. So generate/keep a comfortable source
resolution and tune the in-game size in the atlas; lowering `--max` only makes
the file lighter, it does not change how big the sprite looks.
