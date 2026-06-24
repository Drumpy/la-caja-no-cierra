// tools/asset-gen/core/image-ops.mjs
// Toolkit de post-proceso de imágenes (portado de los procesadores de
// agent-sprite-forge a Node + sharp). Buffer-in / buffer-out -> testeable puro.
// Todo PNG con alpha.
import sharp from 'sharp';

// Quita un fondo de color sólido (chroma-key) -> transparente. Pedimos a la IA
// el sujeto sobre un verde plano (ver prompt-rules) y acá lo volamos.
export async function chromaKey(input, { color = [0, 255, 0], tolerance = 96 } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [kr, kg, kb] = color;
  const ch = info.channels; // 4 (RGBA)
  const tol2 = tolerance * tolerance;
  for (let i = 0; i < data.length; i += ch) {
    const dr = data[i] - kr;
    const dg = data[i + 1] - kg;
    const db = data[i + 2] - kb;
    if (dr * dr + dg * dg + db * db <= tol2) data[i + 3] = 0; // -> transparente
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: ch } }).png().toBuffer();
}

// Limpia píxeles de borde contaminados por el fondo chroma. La IA suele dejar
// una línea opaca verde/amarilla pegada al sujeto aunque el prompt pida hard
// pixel edges; chromaKey vuela el fondo, pero esos píxeles sobreviven porque ya
// no son #00FF00 exacto. Sólo se borran si están pegados a transparencia.
export async function removeChromaHalo(input, {
  alphaThreshold = 16,
  minGreen = 44,
  dominance = 28,
} = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const isTransparent = (x, y) => data[(y * W + x) * ch + 3] < alphaThreshold;
  const hasTransparentNeighbor = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || isTransparent(nx, ny)) return true;
    }
    return false;
  };

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * ch;
    if (data[i + 3] < alphaThreshold) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const chromaContaminated = g >= minGreen && g >= r + dominance && g >= b + dominance;
    if (chromaContaminated && hasTransparentNeighbor(x, y)) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: W, height: H, channels: ch } }).png().toBuffer();
}

// Recorte ajustado al contenido (borde transparente fuera).
export async function trim(input) {
  return sharp(input).ensureAlpha().trim().png().toBuffer();
}

// Encaja dentro de size×size manteniendo proporción, con padding transparente.
export async function fit(input, { size, exact = false } = {}) {
  if (!size) return sharp(input).png().toBuffer();
  return sharp(input)
    .ensureAlpha()
    .resize(size, size, {
      fit: exact ? 'fill' : 'contain',
      kernel: 'nearest', // pixel-art: sin blur al redimensionar
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

// Parte un sheet en frames individuales (fila-mayor). cols×rows.
export async function splitFrames(input, { cols, rows = 1 } = {}) {
  if (!cols || cols < 1) throw new Error('splitFrames: cols requerido (>=1)');
  const meta = await sharp(input).metadata();
  const fw = Math.floor(meta.width / cols);
  const fh = Math.floor(meta.height / rows);
  const frames = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // sharp consume el input por operación -> re-crear desde el buffer cada vez
      const frame = await sharp(input)
        .extract({ left: c * fw, top: r * fh, width: fw, height: fh })
        .png()
        .toBuffer();
      frames.push(frame);
    }
  }
  return frames;
}

// Optimiza el PNG final para que pese poco y no se vaya de tamaño:
//  1) si el lado mayor supera maxSize, baja la resolución (kernel nearest, sin
//     agrandar) — un sprite que se dibuja a ~90px no necesita 1400px de fuente;
//  2) re-encodea como PNG de paleta (cuantización a `colours`) con compresión
//     máxima. Para arte de pocos colores esto recorta el archivo ~70-85% sin
//     cambio visible. Conserva el alpha (transparencia).
export async function optimize(input, { maxSize = null, colours = 256, palette = true, keepAlpha = true } = {}) {
  let img = sharp(input);
  if (keepAlpha) img = img.ensureAlpha();
  if (maxSize) {
    const { width, height } = await sharp(input).metadata();
    if (Math.max(width, height) > maxSize) {
      img = img.resize(maxSize, maxSize, { fit: 'inside', kernel: 'nearest', withoutEnlargement: true });
    }
  }
  // palette=true: PNG de paleta (ideal arte de pocos colores). palette=false: PNG
  // full-color sólo comprimido (evita banding en cielos/gradientes de fondos).
  const opts = palette ? { palette: true, colours, compressionLevel: 9, effort: 10 }
    : { compressionLevel: 9, effort: 10 };
  return img.png(opts).toBuffer();
}

// Limpia regiones de alpha sueltas (specks que deja el chroma-key, o partes
// flotantes). Etiqueta componentes conexos (4-conn) sobre el alpha y:
//   - mode 'despeckle' (default): borra sólo los componentes chicos (< minAreaFrac
//     del total) -> saca el ruido pero conserva partes grandes intencionales
//     (luna del farol, FX, etc.);
//   - mode 'largest': deja sólo el componente más grande (cuerpo) -> útil para
//     actores sin FX desprendido. Ojo: correr POR FRAME, no sobre el sheet entero
//     (los frames son componentes separados entre sí).
export async function cleanAlpha(input, { mode = 'despeckle', minAreaFrac = 0.0015, alphaThreshold = 8 } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const N = W * H;
  const label = new Int32Array(N);
  const sizes = [0]; // labels 1-indexados
  const stack = [];
  let cur = 0;
  for (let p = 0; p < N; p++) {
    if (label[p] || data[p * ch + 3] < alphaThreshold) continue;
    cur++; sizes.push(0); label[p] = cur; stack.push(p);
    while (stack.length) {
      const q = stack.pop(); sizes[cur]++;
      const x = q % W, y = (q / W) | 0;
      const nb = [];
      if (x > 0) nb.push(q - 1);
      if (x < W - 1) nb.push(q + 1);
      if (y > 0) nb.push(q - W);
      if (y < H - 1) nb.push(q + W);
      for (const r of nb) if (!label[r] && data[r * ch + 3] >= alphaThreshold) { label[r] = cur; stack.push(r); }
    }
  }
  if (cur <= 1) return sharp(input).png().toBuffer(); // nada que limpiar
  const keep = new Uint8Array(cur + 1);
  if (mode === 'largest') {
    let best = 1; for (let i = 2; i <= cur; i++) if (sizes[i] > sizes[best]) best = i;
    keep[best] = 1;
  } else {
    const minArea = Math.max(1, Math.floor(N * minAreaFrac));
    for (let i = 1; i <= cur; i++) if (sizes[i] >= minArea) keep[i] = 1;
  }
  for (let p = 0; p < N; p++) if (label[p] && !keep[label[p]]) data[p * ch + 3] = 0;
  return sharp(data, { raw: { width: W, height: H, channels: ch } }).png().toBuffer();
}

// Rellena "huecos" de transparencia interiores: zonas transparentes que NO están
// conectadas al borde de la imagen (= no son el fondo real, sino partes del sujeto
// que un recorte agresivo dejó transparentes, p.ej. un collar oscuro). Reinunda el
// fondo desde los bordes (8-conn, conservador: no rellena gaps abiertos al fondo) y
// restaura alpha=255 en lo que quede encerrado. El RGB ya está debajo, así que es
// sin pérdida. Devuelve { buffer, filled } (px restaurados).
export async function fillHoles(input, { alphaThreshold = 16 } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const N = W * H;
  const outside = new Uint8Array(N);
  const stack = [];
  const isTransp = (p) => data[p * ch + 3] < alphaThreshold;
  const seed = (p) => { if (isTransp(p) && !outside[p]) { outside[p] = 1; stack.push(p); } };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  while (stack.length) {
    const q = stack.pop(); const x = q % W, y = (q / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const r = ny * W + nx;
      if (!outside[r] && isTransp(r)) { outside[r] = 1; stack.push(r); }
    }
  }
  let filled = 0;
  for (let p = 0; p < N; p++) if (isTransp(p) && !outside[p]) { data[p * ch + 3] = 255; filled++; }
  const buffer = await sharp(data, { raw: { width: W, height: H, channels: ch } }).png().toBuffer();
  return { buffer, filled };
}

// Coloca la imagen (ya recortada) sobre un lienzo transparente width×height,
// centrada horizontal y alineada vertical según `align` (bottom = pies al piso).
// Sirve para dar a todos los frames la MISMA caja -> escala/baseline compartidos.
export async function padTo(input, { width, height, align = 'bottom' } = {}) {
  const { width: w, height: h } = await sharp(input).metadata();
  const cw = Math.max(width, w), cwh = Math.max(height, h); // nunca recortar
  const left = Math.round((cw - w) / 2);
  const top = align === 'top' ? 0
    : align === 'center' ? Math.round((cwh - h) / 2)
    : cwh - h; // bottom
  return sharp({ create: { width: cw, height: cwh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input, left, top }]).png().toBuffer();
}

// Corte de sheet por CONTENIDO en vez de grilla fija: la IA casi nunca espacia
// los frames parejo, así que un corte uniforme parte el sujeto y arrastra un
// pedazo del vecino. Acá buscamos las columnas vacías (transparentes) entre los
// dibujos y cortamos por los `cols-1` huecos más anchos (los de entre-frames son
// más anchos que los internos de la pose). Si no hay suficientes huecos, cae al
// corte uniforme. Sólo filas=1 (sheets horizontales). El input debe venir ya
// chroma-keyeado (fondo transparente).
export async function splitFramesAuto(input, { cols, rows = 1, alphaThreshold = 16 } = {}) {
  if (rows !== 1 || !cols || cols < 2) return splitFrames(input, { cols, rows });
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const cov = new Int32Array(W); // px opacos por columna
  for (let x = 0; x < W; x++) { let c = 0; for (let y = 0; y < H; y++) if (data[(y * W + x) * ch + 3] >= alphaThreshold) c++; cov[x] = c; }
  let L = 0; while (L < W && cov[L] === 0) L++;
  let R = W - 1; while (R >= 0 && cov[R] === 0) R--;
  if (R <= L) return splitFrames(input, { cols, rows });
  const gaps = []; let g = -1;
  for (let x = L; x <= R; x++) {
    if (cov[x] === 0) { if (g < 0) g = x; }
    else if (g >= 0) { gaps.push({ start: g, end: x - 1, len: x - g }); g = -1; }
  }
  if (gaps.length < cols - 1) return splitFrames(input, { cols, rows }); // no hay separaciones claras
  const cuts = gaps.sort((a, b) => b.len - a.len).slice(0, cols - 1)
    .map((gp) => Math.round((gp.start + gp.end) / 2)).sort((a, b) => a - b);
  const frames = [];
  for (let i = 0; i < cols; i++) {
    const s = i === 0 ? L : cuts[i - 1] + 1;
    const e = i === cols - 1 ? R : cuts[i];
    frames.push(await sharp(input).extract({ left: s, top: 0, width: e - s + 1, height: H }).png().toBuffer());
  }
  return frames;
}

// Anima por código un sprite ESTÁTICO meciéndose (sway), en vez de pedirle al
// modelo N cuadros (que dibuja como N objetos distintos -> animación que salta).
// Toma UN frame ya recortado sobre fondo transparente y genera `frames` cuadros
// haciendo un shear horizontal por fila: la base (abajo) queda fija y la copa
// (arriba) se desplaza más, con peso ((altura)^ease). El desplazamiento sigue un
// seno -> loop perfecto (vuelve a 0). Shift entero (pixel-art, sin blur). Ideal
// para decor de fondo: palmeras, pasto, banderas. Salida: N PNG del MISMO tamaño
// (canvas ensanchado por el margen del sway), listos para el shared-box del skill.
// ponytail: shear rígido por fila (la copa entera se inclina pareja). Suficiente
// para decor; si se quiere secundario por hoja, enmascarar la región de copa.
export async function swayFrames(input, { frames = 6, amplitudePx = null, ease = 2 } = {}) {
  if (!frames || frames < 2) return [await sharp(input).png().toBuffer()];
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const amp = amplitudePx ?? Math.max(2, Math.round(W * 0.06)); // ~6% del ancho
  const pad = amp + 1;
  const OW = W + pad * 2;
  const denom = H > 1 ? H - 1 : 1;
  const out = [];
  for (let f = 0; f < frames; f++) {
    const phase = Math.sin((2 * Math.PI * f) / frames); // 0 -> +amp -> 0 -> -amp -> 0
    const buf = new Uint8Array(OW * H * ch); // todo transparente
    for (let y = 0; y < H; y++) {
      const t = (denom - y) / denom;          // 0 en la base, 1 en la copa
      const shift = Math.round(amp * phase * Math.pow(t, ease));
      for (let x = 0; x < W; x++) {
        const si = (y * W + x) * ch;
        if (data[si + 3] === 0) continue;      // píxel transparente: nada que mover
        const dx = x + pad + shift;
        if (dx < 0 || dx >= OW) continue;
        const di = (y * OW + dx) * ch;
        buf[di] = data[si]; buf[di + 1] = data[si + 1]; buf[di + 2] = data[si + 2]; buf[di + 3] = data[si + 3];
      }
    }
    out.push(await sharp(Buffer.from(buf), { raw: { width: OW, height: H, channels: ch } }).png().toBuffer());
  }
  return out;
}

// Fija UNA sola paleta compartida entre todos los frames de una animación. El
// `optimize` por-frame cuantiza cada PNG por separado -> la paleta deriva cuadro a
// cuadro (colores que titilan). Acá apilo los N frames en una sola imagen,
// cuantizo UNA vez a `colours` (median-cut de sharp, sin dither para mantener
// bordes duros) y los vuelvo a partir -> todos comparten exactamente los mismos
// colores. Requiere frames del MISMO tamaño (correr DESPUÉS del shared-box padTo).
export async function lockPalette(frames, { colours = 48 } = {}) {
  if (!Array.isArray(frames) || frames.length < 2) return frames;
  let W = 0, H = 0;
  for (const f of frames) { const m = await sharp(f).metadata(); W = Math.max(W, m.width); H = Math.max(H, m.height); }
  const composites = frames.map((input, i) => ({ input, left: 0, top: i * H }));
  const stacked = await sharp({ create: { width: W, height: H * frames.length, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites).png().toBuffer();
  const quant = await sharp(stacked).png({ palette: true, colours, dither: 0 }).toBuffer();
  return splitFrames(quant, { cols: 1, rows: frames.length });
}

export async function dimensions(input) {
  const { width, height } = await sharp(input).metadata();
  return { width, height };
}
