export default {
  defaults: {
    n: 2,
    size: "1024x1024",
  },

  refs: {},

  assets: {
    character: {
      taxistaWalk: {
        name: "taxista-walk",
        frames: "4x1",
        maxSize: 512,
        component: "despeckle",
        objectDimensionsMeters: { x: 0.75, y: 1.55 },
        windowPositionMeters: { x: 0, y: 0.92, z: -2.86 },
        approachPathMeters: {
          from: { x: -1.15, y: 0.92, z: -4.7 },
          to: { x: 0, y: 0.92, z: -2.86 },
        },
        prompt:
          "Full-body human Taxista character walking animation for a 2.5D PlayCanvas billboard outside a rainy Montevideo kiosk service window. Dignified tired taxi driver, middle-aged, human proportions, visible legs and torso, dark jacket with muted taxi-yellow accents, wet night mood, no caricature, no gore, no real taxi company logos. Exactly 4 frames in one horizontal row, same character identity and scale, same foot baseline, walking toward camera/front-left, clear contact poses, full body fully inside every frame.",
      },
    },
    texture: {
      floorTile: {
        name: "floor-tile",
        maxSize: 1024,
        objectDimensionsMeters: { x: 3.5, z: 4.5 },
        uvRepeat: { u: 3.5, v: 4.5 },
        prompt:
          "Seamless square PBR-style albedo texture for the floor of a small Uruguayan night kiosk, warm worn ceramic tiles, damp tracked-in rain, subtle grime, no strong shadows. Designed for a PlayCanvas floor plane 3.5m wide by 4.5m deep, repeated about 3.5 by 4.5 times.",
      },
      wallPlaster: {
        name: "wall-plaster",
        maxSize: 1024,
        objectDimensionsMeters: { x: 3.5, y: 2.6 },
        uvRepeat: { u: 2.5, v: 1.8 },
        prompt:
          "Seamless square PBR-style albedo texture for interior kiosk walls, old yellowed plaster, humidity stains, repaired patches, warm fluorescent light, cozy horror mood, no text, no posters. Designed for PlayCanvas wall boxes around 3.5m wide by 2.6m high.",
      },
      ceilingSheet: {
        name: "ceiling-sheet",
        maxSize: 1024,
        objectDimensionsMeters: { x: 3.5, z: 4.5 },
        uvRepeat: { u: 2.5, v: 3 },
        prompt:
          "Seamless square PBR-style albedo texture for an old corrugated sheet-metal kiosk ceiling, deteriorated but cozy, rusty brown and dark green oxidation, water stains, old screws and seams, warm fluorescent light, no holes through the roof, no sky, no perspective. Designed for a PlayCanvas ceiling mesh about 3.5m wide by 4.5m deep.",
      },
      woodCounter: {
        name: "wood-counter",
        maxSize: 1024,
        objectDimensionsMeters: { x: 2.4, y: 0.4, z: 0.5 },
        uvRepeat: { u: 2.4, v: 1 },
        prompt:
          "Seamless horizontal wood counter texture for a low-poly 3D kiosk counter and shelves, dark worn varnished wood, scratches, cup rings, old shop grime, warm light, no labels, no perspective. Designed for a 2.4m wide counter mesh and shelf boards.",
      },
      productCafe: {
        name: "product-cafe",
        maxSize: 512,
        objectDimensionsMeters: { x: 0.2, y: 0.18, z: 0.2 },
        uvRepeat: { u: 1, v: 1 },
        prompt:
          "Front-facing square texture for a small low-poly 3D coffee product box or tin in a Uruguayan kiosk. Fictional non-branded design, readable label CAFE, warm browns, simple graphic mark, flat orthographic package art, no real logos. Target object about 20cm x 18cm x 20cm.",
      },
      productChicles: {
        name: "product-chicles",
        maxSize: 512,
        objectDimensionsMeters: { x: 0.2, y: 0.18, z: 0.2 },
        uvRepeat: { u: 1, v: 1 },
        prompt:
          "Front-facing square texture for a small low-poly 3D chewing gum packet in a Uruguayan kiosk. Fictional non-branded design, readable label CHICLES, muted green wrapper, flat orthographic package art, no real logos. Target object about 20cm x 18cm x 20cm.",
      },
      productVela: {
        name: "product-vela",
        maxSize: 512,
        objectDimensionsMeters: { x: 0.2, y: 0.18, z: 0.2 },
        uvRepeat: { u: 1, v: 1 },
        prompt:
          "Front-facing square texture for a small low-poly 3D candle box in a Uruguayan kiosk. Fictional non-branded design, readable label VELA, cream and amber colors, slightly unsettling simple candle icon, flat orthographic package art. Target object about 20cm x 18cm x 20cm.",
      },
      productCigarros: {
        name: "product-cigarros",
        maxSize: 512,
        objectDimensionsMeters: { x: 0.22, y: 0.08, z: 0.28 },
        uvRepeat: { u: 1, v: 1 },
        prompt:
          "Front-facing square texture for a small low-poly 3D drawer-side fictional cigarette pack kept behind a kiosk counter, no real brand, no health-warning realism, readable label FICTICIO, muted brown paper, flat orthographic package art. Target mesh about 22cm x 8cm x 28cm.",
      },
      taxistaCutout: {
        name: "taxista-cutout",
        maxSize: 1024,
        objectDimensionsMeters: { x: 0.75, y: 1.35 },
        uvRepeat: { u: 1, v: 1 },
        prompt:
          "Texture for a vertical 2.5D PlayCanvas billboard plane showing the Taxista outside the kiosk service window at rainy night. Bust/upper body, dignified tired Montevideo taxi driver, warm taxi-yellow accents, wet glass/rain mood, cozy horror but human, no caricature, no gore, no real taxi company logos. Framed for a 0.75m wide by 1.35m high vertical plane.",
      },
    },
  },
};
