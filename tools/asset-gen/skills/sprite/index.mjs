// tools/asset-gen/skills/sprite/index.mjs
// Skill v1: sprite pixel-art transparente para el juego.
// Contrato de skill (ver README): { name, description, outputDir, defaults,
// plan(input), process(buffer, ctx), validate(buffer, ctx) }.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(path.join(HERE, 'prompt-rules.md'), 'utf8');
const ASSET_DIRECTION = readFileSync(path.join(HERE, '..', '..', 'art-direction.md'), 'utf8');
const KEY_COLOR = [0, 255, 0]; // verde chroma del fondo (ver prompt-rules)

// Plantillas de acción: describen el sheet FRAME POR FRAME para que la animación
// realmente cambie de pose (el modelo, sin esto, dibuja N cuadros casi idénticos).
// Cada una sugiere su layout de frames. Idea tomada de sprite-sheet-creator.
const ACTIONS = {
  walk: { frames: '8x1', text:
`This is a premium WALK cycle: exactly 8 frames in one row, the SAME character facing right, built from key poses:
- Frame 1: CONTACT - near/front foot reaches forward and touches down; opposite rear foot back.
- Frame 2: DOWN - weight drops onto the planted foot; body compresses slightly.
- Frame 3: PASSING - legs pass under the body; rear/front pair begins to trade roles.
- Frame 4: UP - body rises before the next contact; head/ears/tail lag one phase.
- Frame 5: CONTACT OPPOSITE - mirrored stride, same stride distance and baseline.
- Frame 6: DOWN OPPOSITE - weight lands; shoulders and hips offset naturally.
- Frame 7: PASSING OPPOSITE - legs cross under the body, no floating feet.
- Frame 8: UP OPPOSITE - settles into frame 1 cleanly for a seamless loop.
For quadrupeds, coordinate front and rear legs as paired mechanics, not random leg swaps.` },
  run: { frames: '8x1', text:
`This is a premium RUN/GALLOP cycle: exactly 8 frames in one row, the SAME character facing right, with clear speed and weight:
- Frame 1: GATHER - legs tucked under body, torso compressed, head slightly forward.
- Frame 2: LAUNCH - rear legs drive, front legs begin reaching, body stretches.
- Frame 3: FULL EXTENSION - airborne stretch, front legs forward, rear legs back.
- Frame 4: FRONT CONTACT - front feet plant, shoulders absorb weight.
- Frame 5: DOWN/LOAD - body low, rear legs swing forward under hips.
- Frame 6: REAR DRIVE - rear legs plant and push hard, tail/ears trail.
- Frame 7: SUSPENSION - body clears the ground, legs changing phase.
- Frame 8: RECOVERY/GATHER - returns to frame 1 with no size pop.
Use controlled squash/stretch in the pose silhouette only; keep pixel scale and baseline consistent.` },
  idle: { frames: '6x1', text:
`This is a subtle IDLE/breathing loop: exactly 6 frames in one row, SAME character facing right, alive but not distracting:
- Frame 1: neutral relaxed stance.
- Frame 2: slight inhale; chest or body rises one small step.
- Frame 3: top of breath; ears/tail/collar lag slightly.
- Frame 4: slow exhale; body settles.
- Frame 5: tiny secondary motion - blink, ear twitch, tail tip, cloth or antenna delay.
- Frame 6: return toward neutral, ready to loop into frame 1.
Keep the idle restrained; it should not look like dancing.` },
  attack: { frames: '6x1', text:
`This is a premium ATTACK animation: exactly 6 frames in one row, SAME character facing right:
- Frame 1: READY - readable base pose, weight grounded.
- Frame 2: ANTICIPATION - body pulls back or crouches, clear wind-up.
- Frame 3: HOLD/TENSION - one strong pre-impact pose, compressed and focused.
- Frame 4: IMPACT - fastest, clearest silhouette, full extension.
- Frame 5: RECOIL - body reacts backward from the force.
- Frame 6: RECOVERY - returns toward idle/run stance.
Keep the body sheet clean; separate FX such as projectiles, shockwaves, slash arcs, flashes, and particles belong in a separate FX asset.` },
  'bark-attack': { frames: '6x1', text:
`This is a premium bark attack animation: exactly 6 frames in one row, SAME character facing right:
- Frame 1: READY - grounded stance, mouth closed.
- Frame 2: INHALE/ANTICIPATION - head lowers slightly, chest expands, ears pull back.
- Frame 3: TENSION HOLD - body compressed, muzzle forward, moment before sound.
- Frame 4: BARK IMPACT - mouth wide open, body extended, strongest silhouette.
- Frame 5: RECOIL - head and chest snap back, ears/tail lag.
- Frame 6: RECOVERY - returns toward idle/run.
Do not include the shockwave in this body sheet; generate the bark shockwave as separate FX.` },
  'bark-fx': { frames: '5x1', text:
`This is a separate bark shockwave FX sheet: exactly 5 frames in one row, no character body:
- Frame 1: small tight sound ring at muzzle origin.
- Frame 2: ring expands, bright leading edge.
- Frame 3: widest readable shockwave, strongest impact shape.
- Frame 4: breaking/dispersing wave with small particles.
- Frame 5: faded remnants, mostly transparent.
Keep it compact, transparent-ready, and aligned center for overlay use.` },
  hurt: { frames: '2x1', text:
`This is a HURT reaction: exactly 2 frames in one row, SAME character facing right:
- Frame 1: IMPACT - flinch, head/body snaps back, ears or loose parts trail.
- Frame 2: RECOIL - staggered, off-balance recovery, ready to blend to stun or idle.` },
  stun: { frames: '6x1', text:
`This is a STUN loop: exactly 6 frames in one row, SAME character facing right:
- Frame 1: dazed crouch or wobble left.
- Frame 2: over-correct wobble right, head delayed.
- Frame 3: low heavy blink or dizzy expression.
- Frame 4: wobble left again, smaller amplitude.
- Frame 5: settling but still unstable, secondary parts lag.
- Frame 6: loops back to frame 1 without a pop.
Small stars or dizzy marks are allowed only if they stay close; otherwise make them separate FX.` },
  jump: { frames: '5x1', text:
`This is a JUMP state sheet: exactly 5 frames in one row, SAME character facing right:
- Frame 1: JUMP START/CROUCH - anticipation, body low, weight loaded.
- Frame 2: TAKEOFF - legs extend, body launches upward.
- Frame 3: RISE - body stretched, ears/tail pulled by motion.
- Frame 4: APEX - held readable pose, legs tucked.
- Frame 5: FALL - gravity pulls ears/tail upward, body prepares to land.
The landing squash belongs in the separate land action if requested.` },
  land: { frames: '4x1', text:
`This is a land animation: exactly 4 frames in one row, SAME character facing right:
- Frame 1: PRE-CONTACT - falling pose, feet close to ground.
- Frame 2: IMPACT/SQUASH - body compressed, feet planted, dust origin clear.
- Frame 3: RECOVERY - body rebounds upward, ears/tail still delayed.
- Frame 4: SETTLE - returns toward idle/run baseline.
Dust should be separate FX unless the request asks for a combined landing effect.` },
  dash: { frames: '6x1', text:
`This is a dash animation: exactly 6 frames in one row, SAME character facing right:
- Frame 1: ANTICIPATION - crouch or lean opposite the dash.
- Frame 2: LAUNCH - strong forward lean, body compressed.
- Frame 3: SMEAR/EXTENSION - fastest frame, readable stretched silhouette.
- Frame 4: TRAVEL - low streamlined body, secondary parts trailing.
- Frame 5: BRAKE/RECOIL - body catches up, feet or base scrape.
- Frame 6: RECOVERY - stable pose ready for run/idle.
Generate long trails, smoke, and burst particles as separate FX assets.` },
  interact: { frames: '8x1', text:
`This is an interact animation: exactly 8 frames in one row, SAME character facing right:
- Frame 1: approach/ready pose.
- Frame 2: head or hand/paw/tool leads toward the object.
- Frame 3: anticipation pause, body weight shifts.
- Frame 4: contact with lever/button/item, clear readable touch.
- Frame 5: push/pull/activate, strongest action pose.
- Frame 6: hold/result pose, secondary parts lag.
- Frame 7: recoil/withdraw.
- Frame 8: recovery to neutral.
Do not include the target object unless the request explicitly asks for a combined prop interaction sheet.` },
  collect: { frames: '4x1', text:
`This is a collect reaction animation: exactly 4 frames in one row, SAME character facing right:
- Frame 1: neutral or moving base.
- Frame 2: quick happy pickup reaction, eyes/head/pose brighten.
- Frame 3: tiny celebratory lift or tail/cloth follow-through.
- Frame 4: recovery back to gameplay pose.
Keep it short and readable; sparkle or coin burst should be separate FX.` },
  victory: { frames: '8x1', text:
`This is a victory animation: exactly 8 frames in one row, SAME character facing right:
- Frame 1: anticipation crouch or happy wind-up.
- Frame 2: launch into celebration.
- Frame 3: peak jump or proud pose.
- Frame 4: joyful bark/gesture, strongest silhouette.
- Frame 5: follow-through, ears/tail/accessories delayed.
- Frame 6: landing or settle.
- Frame 7: happy idle pose.
- Frame 8: loop/hold-friendly final pose.
Make it expressive but still usable in-game; avoid huge detached FX in the body sheet.` },
  'sit-look': { frames: '6x1', text:
`This is a long-idle SIT LOOK animation: exactly 6 frames in one row, the SAME character sitting in place:
- Frame 1: seated relaxed, looking forward/right, calm posture.
- Frame 2: subtle breath and head starts turning back over shoulder, ears lag.
- Frame 3: seated looking back/left over shoulder, body remains planted.
- Frame 4: hold the backward look, tail/ears/collar delayed slightly.
- Frame 5: head turns forward again, small follow-through.
- Frame 6: seated relaxed looking forward/right, loops cleanly to frame 1.
Keep the butt, paws, tail base, scale, and ground contact fixed. Only head/neck/ears/tail/collar should carry most of the motion.` },
  sleep: { frames: '4x1', text:
`This is a sleep loop: exactly 4 frames in one row, SAME character lying down:
- Frame 1: curled or lying down asleep, eyes closed, calm silhouette.
- Frame 2: tiny inhale, ribcage/body rises slightly, ear/tail/collar lag.
- Frame 3: top of breath or tiny sleep twitch, still asleep.
- Frame 4: exhale, settles back into frame 1.
Keep it subtle and loopable. Do not add floating stars, Z letters, text, bubbles, bed, blanket, or floor unless explicitly requested.` },
  // palm-sway NO se le pide al modelo como sheet (dibuja N palmeras distintas que
  // saltan). Se genera UNA palmera estática limpia y el sway se anima por código
  // (ops.swayFrames) -> consistencia perfecta. Por eso: sin `frames`, programmatic.
  'palm-sway': { programmatic: 'sway', swayFrames: 6, text:
`Draw ONE single static palm tree - one frame only, NOT a sprite sheet, NOT a strip, only ONE palm:
- Trunk vertical with a slight natural curve, solid and continuous from base to crown, consistent width.
- Crown of long palm fronds radiating from the top, relaxed neutral spread.
- Centered, the whole palm fully inside the frame, clean readable silhouette.
The swaying animation is generated programmatically from this single image, so draw ONE crisp well-formed palm only - no multiple palms, no motion lines, no frame divisions. No fruit, no characters, no ground, no shadow, no text.` },
  death: { frames: '2x1', text:
`This is a DEATH/defeat: exactly 2 frames in one row, SAME character facing right:
- Frame 1: STAGGER - losing balance, collapsing, clear readable failure pose.
- Frame 2: DEFEATED - collapsed/flattened on the ground, lifeless but still matching the character.` },
  'two-state': { frames: '2x1', text:
`This is a two-STATE prop: exactly 2 frames in one row, the SAME object in both:
- Frame 1 (left): OFF / inactive - dark, cold, unlit.
- Frame 2 (right): ON / active - lit, glowing, energized.
Keep the prop in the same position, size, baseline, and silhouette family; change only the state cues.` },
};

export default {
  name: 'sprite',
  description: 'Sprite pixel-art transparente (image-to-image con ref de estilo). frames: "CxR" para sheets.',
  outputDir: 'public/assets/sprites',
  // maxSize = tope del lado mayor del PNG final (se dibujan chicos en el juego;
  // 256px da margen 2-3x sobre el tamaño de render y mantiene los archivos livianos).
  // align = anclaje al armar la caja compartida de un sheet (bottom = pies al piso).
  // component = limpieza de alpha suelto: 'despeckle' (saca ruido), 'largest' (sólo cuerpo), 'all' (no toca).
  defaults: { size: '1024x1024', n: 4, maxSize: 256, align: 'bottom', component: 'despeckle' },

  actions: ACTIONS, // expuesto para que el CLI sepa el layout de frames por acción

  // input del usuario/config -> requests de generación
  plan({ prompt, ref, refs, n, size, action, config = {} } = {}) {
    const refList = refs ? [...refs] : (ref ? [ref] : []);
    if (!refList.length && config.styleRef) refList.push(config.styleRef);
    const actionText = action && ACTIONS[action] ? `\n\n${ACTIONS[action].text}` : '';
    return [{
      id: 'sprite',
      prompt: `${prompt}${actionText}\n\n${ASSET_DIRECTION}\n\n${RULES}`,
      refs: refList,
      size: size || this.defaults.size,
      n: n || this.defaults.n,
    }];
  },

  // un buffer generado -> variante(s) finales.
  // Pipeline: chroma-key -> (split en frames) -> por frame: limpiar alpha suelto +
  // recortar al contenido -> caja COMPARTIDA (mismo tamaño + baseline, sin jitter de
  // animación) -> tamaño final + compresión.
  async process(buffer, { ops, spec = {} } = {}) {
    let keyed = await ops.chromaKey(buffer, { color: spec.keyColor || KEY_COLOR });
    keyed = await ops.removeChromaHalo(keyed);
    // opcional: recupera partes interiores que el chroma haya volado por error
    // (p.ej. un detalle oscuro/verdoso encerrado en el sujeto)
    if (spec.fillHoles) keyed = (await ops.fillHoles(keyed)).buffer;
    const maxSize = spec.maxSize ?? this.defaults.maxSize;
    const align = spec.align || this.defaults.align;
    const component = spec.component || this.defaults.component;

    // ¿de dónde salen los frames?
    let trimmed;
    let isSheet;
    if (spec.programmatic === 'sway') {
      // UN sprite estático -> el sway se anima por código (consistencia perfecta).
      // OJO: no se recorta por-frame (el trim cancelaría el offset del sway).
      let base = component === 'all' ? keyed : await ops.cleanAlpha(keyed, { mode: component });
      base = await ops.trim(base);
      trimmed = await ops.swayFrames(base, { frames: spec.swayFrames || 6 });
      isSheet = true;
    } else {
      // corte por contenido (no grilla fija) -> no parte el sujeto ni arrastra al vecino
      const cells = spec.frames ? await ops.splitFramesAuto(keyed, spec.frames) : [keyed];
      // por celda: sacar specks/partes sueltas (salvo 'all') + recortar al contenido
      trimmed = [];
      for (const cell of cells) {
        const cleaned = component === 'all' ? cell : await ops.cleanAlpha(cell, { mode: component });
        trimmed.push(await ops.trim(cleaned));
      }
      isSheet = !!spec.frames;
    }

    // sheet multi-frame -> misma caja para todos (escala/baseline compartidos)
    let framed = trimmed;
    if (trimmed.length > 1) {
      let W = 0, H = 0;
      for (const t of trimmed) { const d = await ops.dimensions(t); W = Math.max(W, d.width); H = Math.max(H, d.height); }
      framed = [];
      for (const t of trimmed) framed.push(await ops.padTo(t, { width: W, height: H, align }));
      // paleta ÚNICA compartida entre frames -> sin titileo de color cuadro a cuadro
      if (spec.lockPalette !== false) framed = await ops.lockPalette(framed, { colours: spec.paletteColours || 48 });
    }

    // tamaño final (fit cuadrado si hay targetSize) + compresión
    const out = [];
    for (let i = 0; i < framed.length; i++) {
      const sized = spec.targetSize ? await ops.fit(framed[i], { size: spec.targetSize }) : framed[i];
      const buf = await ops.optimize(sized, { maxSize });
      out.push({ name: isSheet ? `${spec.name}${i + 1}` : spec.name, buffer: buf });
    }
    return out;
  },

  async validate(buffer, { qa, spec = {} } = {}) {
    return qa.validate(buffer, { size: spec.targetSize || null, expectAlpha: true });
  },
};
