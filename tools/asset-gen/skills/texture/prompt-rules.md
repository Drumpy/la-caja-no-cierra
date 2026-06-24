# Texture Generation Rules

- Output a single usable game texture, not a scene mockup.
- It must work on a low-poly PlayCanvas mesh with ordinary UVs.
- Prefer orthographic, flat, front-facing composition. Avoid camera perspective.
- No cast shadows, fake ground planes, hands, people, UI mockups, watermarks, or logos unless the prompt explicitly asks.
- For tileable surfaces, make the texture seamless on all edges.
- For product textures, keep the label fictional, centered, legible, and brand-free.
- Use painted/cozy-horror material detail, not photoreal stock texture style.
- Leave enough quiet border/padding so the texture survives mipmaps on small 3D objects.
