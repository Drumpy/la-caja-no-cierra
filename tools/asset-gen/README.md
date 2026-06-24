# asset-gen

Local asset pipeline adapted from `blu-game/tools/asset-gen`.

It uses `ima2` as the image generator, which talks to ChatGPT through OAuth.
Generated variants go to staging first; nothing reaches `public/assets` until
you promote one.

```bash
pnpm asset:setup
pnpm asset list
pnpm asset texture floorTile
pnpm asset:promote texture floor-tile 1
pnpm asset character taxistaWalk
pnpm asset:promote character taxista-walk 1
```

Current V0 texture specs live in `asset-gen.config.mjs`:

- `floorTile`
- `wallPlaster`
- `ceilingSheet`
- `woodCounter`
- `productCafe`
- `productChicles`
- `productVela`
- `productCigarros`
- `taxistaCutout`

Promoted textures are expected at `public/assets/textures/<name>.png` and are
loaded by the PlayCanvas scene when present. Missing files fall back to simple
materials so the game still builds.

Promoted character frames are expected at `public/assets/characters/<name>N.png`.
Taxista currently uses `taxista-walk1.png` through `taxista-walk4.png` for
enter/idle/exit billboard animation.
