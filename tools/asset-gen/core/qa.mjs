// tools/asset-gen/core/qa.mjs
// Validación de un asset procesado. Puro (buffer-in -> reporte). Sin promover
// nada: solo dice si la variante está lista. El usuario decide.
import sharp from 'sharp';

export async function validate(input, { size = null, expectAlpha = true } = {}) {
  const issues = [];
  const meta = await sharp(input).metadata();

  if (expectAlpha) {
    if (!meta.hasAlpha) {
      issues.push('sin canal alpha (PNG opaco)');
    } else {
      const stats = await sharp(input).stats();
      const alpha = stats.channels[meta.channels - 1];
      // si el alpha mínimo es 255, no hay ningún pixel transparente -> el fondo
      // no se removió (o el sujeto llena todo el frame).
      if (alpha && alpha.min === 255) issues.push('sin píxeles transparentes (¿fondo no removido?)');
    }
  }

  if (size && (meta.width !== size || meta.height !== size)) {
    issues.push(`dimensiones ${meta.width}x${meta.height} != ${size}x${size}`);
  }

  return { ok: issues.length === 0, issues, width: meta.width, height: meta.height };
}
