# Asset Pipeline

## Regla de fase

No construir una fabrica de assets antes de validar el loop.

Orden:

1. Prototype V0 con placeholders y 3 personajes semi-manuales.
2. Validar composicion, gramatica de transaccion y estilo.
3. Adaptar `tools/asset-gen` desde `blu-game`.
4. Generar variantes y formalizar QA.

## Reuso desde blu-game

Reusar arquitectura, no estetica.

Mantener:

- CLI `pnpm asset <skill> ...`;
- staging por variante;
- `report.json`;
- promote manual;
- skills auto-descubiertas;
- art direction global inyectada;
- QA antes de promover;
- herramienta fuera del build final.

No copiar:

- prompt bible de Blu;
- paleta de Blu;
- assets de Blu;
- supuestos de pixel-platformer.

## Direccion visual nueva

Crear:

```text
tools/asset-gen/art-direction.md
```

Debe imponer:

- cozy horror uruguayo;
- interior calido, exterior frio;
- materiales pintados;
- geometria simple;
- siluetas legibles;
- suciedad/humedad controlada;
- cero fotorrealismo;
- cero stock horror generico;
- cero marcas reales;
- objetos cotidianos con detalle inquietante;
- UI diegetica legible.

## Skills por fase

### Fase 0: placeholders

Sin asset-gen completo.

- cubos/planos con colores;
- 3 bustos/cutouts manuales o generados puntualmente;
- texturas simples;
- audio placeholder.

### Fase 1: adaptar minimo

Skills:

- `sprite`: simbolos, props planos, expresiones.
- `background`: calle, lluvia, overlays.
- `sfx`: caja, ticket, radio, lluvia, golpes.

### Fase 2: produccion

Skills nuevas:

- `texture`: albedo/normal/orm opcional para materiales tileables.
- `prop`: props simples PlayCanvas, preferentemente GLB o primitivas con textura.
- `character`: personajes 2.5D por capas.
- `ticket`: tickets termicos, sellos, errores, simbolos.
- `signage`: carteles/precios editables.

## Personajes 2.5D

Para demo:

- no humanoides 3D riggeados;
- planos/cutouts con textura;
- capas: cabeza, torso, manos, accesorio;
- estados: idle, hablar, esperar, irse, inquietante;
- swaps de expresion;
- lluvia/sombra/vidrio encima.

Esto aprovecha texture atlas/sprites de PlayCanvas y evita un pipeline de rigging.

## Asset list para Prototype V0

Ambiente:

- local base;
- mostrador;
- ventanilla/reja/vidrio;
- bandeja;
- vereda mojada;
- luz de poste;
- caja registradora;
- libreta;
- radio;
- gato.

Productos:

- cafe;
- cigarros ficticios;
- chicles;
- vela.

Personajes:

- Taxista;
- Julia R.;
- El Yona.

UI diegetica:

- ticket normal;
- ticket raro;
- pagina de libreta;
- linea vieja de 1998;
- simbolos: taxi, humo, lluvia, vela, libreta.

Audio:

- click caja;
- error caja;
- impresora;
- lluvia loop;
- radio static;
- golpe ventanilla;
- lapicera;
- moneda;
- gato.

## QA minimo

Antes de promover un asset:

- se lee en tamano real de juego;
- coincide con art direction;
- no tiene marcas reales;
- no contiene texto roto si el texto importa;
- no caricaturiza personajes sensibles;
- no parece foto ni stock horror;
- no tapa UI;
- tiene pivote/origen util;
- textura tileable no tiene costura evidente.
