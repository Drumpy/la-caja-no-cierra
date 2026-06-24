# La Caja No Cierra - design spec

Fecha: 2026-06-24
Estado: draft fuente. La documentacion ejecutable esta dividida en `docs/vision.md`, `docs/prototype-v0.md`, `docs/vertical-slice.md`, `docs/content-bible.md`, `docs/cultural-qa.md`, `docs/technical-architecture.md` y `docs/asset-pipeline.md`.

## Resumen

**La Caja No Cierra** es un cozy horror roguelite de almacen/kiosco uruguayo nocturno. El jugador atiende un local 24h de Montevideo desde adentro, por una ventanilla que da a la calle. Los clientes no entran: aparecen afuera, bajo lluvia, luz de tubo, reja, vereda mojada, taxi, autos prendidos y sombras.

El juego no trata de "monstruos en una tienda". Trata de deudas, barrio y gente que vuelve cuando ya no deberia volver.

Pitch:

> Atendes un almacen uruguayo de madrugada, fias productos a clientes imposibles y sobrevivis a una caja registradora que cobra deudas de vivos y muertos.

Tagline:

> Atende el turno. Cerra la caja. No le fies a lo que aparece despues de las 3.

## Decisiones cerradas

- Motor: PlayCanvas como base.
- Camara: POV desde adentro del local.
- Servicio: atencion por ventanilla; los clientes nunca entran al local.
- Composicion: ventanilla + calle visible, no ranura abstracta.
- Loop: hibrido entre ventas rapidas y decisiones narrativas de libreta/deuda.
- Run: 10 minutos.
- Scope inicial: una pantalla principal, cero multiplayer.
- Demo objetivo: 3 noches, 20 a 30 minutos.
- Asset pipeline: adaptar el `tools/asset-gen` de `blu-game` para generar todos los assets necesarios con una nueva direccion visual.

## Pilares

1. **La deuda es el sistema**
   - Cobrar, fiar, perdonar y manipular la libreta cambian la run.
   - Cada venta deja una consecuencia. Cada deuda vuelve.

2. **Uruguay no es decoracion**
   - Mate, libreta de fiado, feria, rambla, lluvia, carnaval, futbol, radio AM, bondi, taxi y barrio no son props sueltos: son reglas, eventos y pistas.

3. **El umbral da miedo**
   - El jugador esta adentro. Lo imposible queda afuera, en la ventanilla.
   - El horror entra por pedidos, tickets, voces, manos, sombras, lluvia, radio y libreta.

4. **Cozy antes que gore**
   - Luz amarilla, heladera ruidosa, lluvia, radio baja, gato dormido, productos cotidianos.
   - El horror es barrial, social, seco y sobrenatural, no gore.

5. **Personajes con agencia**
   - Los arquetipos barriales son personas, no chistes ni enemigos por defecto.
   - El juego se rie con el barrio, no del barrio.

## Experiencia principal

Pantalla fija en primera persona/diorama desde el interior del almacen:

- abajo: mostrador, caja registradora, libreta, bandeja de intercambio;
- centro: ventanilla con reja/vidrio y cliente afuera;
- fondo visible: vereda, lluvia, taxi, auto, sombra, calle, poste de luz;
- laterales: estantes de productos al alcance, radio, camara CCTV, gato.

El jugador mira y actua sobre objetos fisicos:

- tocar caja;
- elegir productos;
- arrastrar a bandeja;
- cobrar, fiar, perdonar, cancelar;
- abrir libreta;
- leer ticket;
- escuchar radio;
- mirar reaccion del gato;
- observar calle antes de atender.

## Loop de una run

Duracion: 10 minutos.

1. Entra estado de barrio: lluvia, clasico, feria, carnaval, apagon, niebla o noche comun.
2. La radio y la calle anticipan el clima de la noche.
3. Un cliente aparece en ventanilla.
4. El cliente pide productos, trae deuda o plantea una decision.
5. El jugador arma la venta.
6. El jugador decide como cerrar la transaccion:
   - cobrar normal;
   - fiar;
   - perdonar deuda;
   - cobrar deuda vieja;
   - anotar nombre falso;
   - romper/corregir pagina;
   - cancelar.
7. La caja imprime ticket con simbolos.
8. La libreta registra o altera una deuda.
9. El barrio responde con un efecto inmediato o diferido.
10. La run escala hasta cierre de caja.

## Sistemas

### Caja registradora

Funciones:

- escanear o seleccionar productos;
- cobrar;
- cancelar venta;
- abrir cajon;
- imprimir ticket;
- detectar simbolos;
- fallar de formas sobrenaturales;
- emitir sonidos que anticipan anomalias.

La caja es el objeto de ritmo. Debe sentirse fisica, vieja y poco confiable.

### Libreta de fiado

La libreta es el objeto maldito principal.

Acciones:

- anotar cliente;
- fiar productos;
- cobrar deuda;
- perdonar deuda;
- revisar historial;
- romper pagina;
- corregir nombre;
- detectar nombres de muertos, futuros o falsos.

Reglas:

- fiar sube reputacion o vinculo, pero deja deuda activa;
- cobrar deuda vieja da plata, pero puede despertar evento;
- perdonar deuda baja maldicion, pero reduce dinero;
- romper una pagina borra un evento, pero altera el barrio;
- anotar nombre falso puede invocar al cliente equivocado.

### Tickets

Cada ticket combina productos, cliente, decision y estado de noche. El ticket imprime simbolos locales.

Simbolos:

- mate: memoria, costumbre, repeticion;
- tambor: proteccion, llamado, ritmo;
- libreta: deuda, promesa, consecuencia futura;
- rambla: frontera, niebla, agua;
- gato: testigo, azar, noche;
- futbol: euforia, supersticion, violencia contenida;
- feria: intercambio, objetos usados;
- lluvia: hambre, frio, tortas fritas, apagon;
- tablado: mascara, verdad cantada;
- taxi: rumor, viaje, destino;
- boleto: transito, desaparicion;
- vela: proteccion barata.

Ejemplos:

- Yerba + Vela + Libreta = "Promesa vieja": la proxima persona que aparece ya estuvo en la tienda hace 20 anos.
- Pilas + Radio + Taxi = "Rumor encendido": durante 60 segundos la radio anticipa frases de clientes antes de que hablen.
- Alfajor + Figuritas + Futbol = "Clasico chico": todos discuten, sube velocidad, la caja imprime tickets duplicados.

### Radio AM

Funciones:

- clima;
- futbol;
- noticias falsas;
- rumores;
- interferencias;
- voces de clientes futuros;
- pistas de eventos.

La radio no debe explicar sistemas como tutorial. Debe parecer mundo vivo.

### Gato

El gato no habla. Lee la noche.

Estados:

- duerme sobre la caja: tickets seguros;
- mira la ventana: no conviene atender todavia;
- se esconde en yerba: viene cliente peligroso;
- pisa la libreta: bloquea una pagina que no deberias leer;
- mira la calle vacia: hay alguien que la camara no muestra.

### Calle visible

La calle es sistema de pistas:

- taxi estacionado;
- auto rojo prendido;
- lluvia que no coincide con clientes;
- sombras sin cuerpo;
- cliente mojado cuando afuera no llueve;
- luces de bondi;
- moto de delivery;
- tambor lejano;
- canticos de futbol;
- niebla de rambla;
- feria que deja objetos en la vereda.

## Variables de run

- Plata: supervivencia economica de la noche.
- Maldicion: presion sobrenatural.
- Reputacion barrial: confianza y ayuda de clientes humanos.
- Calma: margen de error del jugador.
- Stock: productos disponibles.
- Deuda activa: promesas pendientes en libreta.
- Ruido de calle: intensidad de eventos externos.

## Clientes y funciones

Cada personaje debe tener funcion jugable. No son solo skins.

### Taxista

Rol: rumor de ciudad.

- compra cafe, cigarros ficticios, chicles, encendedor, alfajor o bizcochos;
- las pilas quedan como pedido raro, no como rutina: si las pide, el taxi, la radio o algo en la calle esta fallando;
- los cigarros no se muestran en gondola: se piden por ventanilla y salen de cajon/lista textual, sin marcas reales;
- avisa quien puede venir;
- puede mentir por repetir radio o calle;
- si se le fia varias veces, trae informacion;
- si se lo trata mal, trae clientes raros.

### El Yona

Rol: codigo de barrio / aliado impredecible.

- detecta clientes falsos;
- pide fiado;
- protege si hay vinculo;
- da pistas de calle;
- no debe ser criminal por defecto.

### Cheto

Rol: dinero alto / distorsion de precios.

- paga de mas;
- pide productos absurdos;
- sube resentimiento barrial;
- altera precios si compra "premium";
- humor de clase, sin convertirlo en villano plano.

### Mabel Medianoche

Rol: oraculo, proteccion, carnaval, memoria.

- vedette del ultimo tablado, personaje trans/travesti con nombre propio, agencia y poder narrativo;
- compra maquillaje, medias, perfume, velas, brillantina;
- lee tickets mal escritos;
- bendice caja;
- desbloquea noche de tablado.

No usarla como gag, jumpscare barato ni chiste corporal.

### Adolescente gamer

Rol: caos digital.

- compra energizante, figuritas, tarjetas prepago, snacks;
- detecta "lag espiritual" de la caja;
- puede desbloquear scanner moddeado;
- puede disparar anomalias de notificaciones/chat.

### El Flaco del Frio

Rol: vulnerabilidad, culpa, humanidad.

- no enemigo, no monstruo, no gag;
- pide pan, leche, cafe, encendedor;
- a veces no puede pagar;
- darle comida puede bajar maldicion;
- echarlo siempre vuelve hostil al barrio;
- ve cosas que otros no porque vive la noche.

### Jubilada de la Libreta

Rol: memoria del barrio.

- compra siempre lo mismo;
- paga con monedas exactas;
- conoce al dueno anterior;
- tiene deuda antigua;
- cobrarle puede activar una noche maldita.

### Delivery

Rol: velocidad y ansiedad.

- necesita cambio;
- deja paquetes equivocados;
- trae productos no pedidos;
- hacerlo esperar sube caos afuera.

### Cuidacoches

Rol: radar de la calle.

- avisa quien estaciono;
- pide monedas, cafe o tabaco ficticio;
- puede bloquear anomalias en ventana;
- si no se lo ayuda nunca, desaparecen clientes humanos.

### Hincha

Rol: futbol como clima social.

- cambia flujo segun partido;
- viene feliz, destruido o supersticioso;
- productos: snacks, bebida ficticia, figuritas;
- producto equivocado antes de penal puede cortar la luz.

### Murguista

Rol: pistas cantadas.

- habla rimando;
- anticipa eventos;
- compra pastillas, agua, maquillaje, cinta;
- si se le fia, vuelve con coro.

### Tamborilero

Rol: ritmo protector / advertencia.

- el ritmo marca peligro;
- protege la tienda con patron de tambor;
- no usar candombe como sonido maligno o monstruoso.

### Feriante

Rol: stock raro.

- aparece domingos o despues de lluvia;
- trae productos baratos/impredecibles;
- algunos objetos vienen "con dueno".

### Inspector municipal

Rol: burocracia absurda / antagonista.

- revisa habilitacion, higiene, precios, carteles;
- puede clausurar;
- algunos inspectores son reales y otros no;
- puede citar infracciones imposibles.

### Turista argentino

Rol: moneda / humor rioplatense.

- paga con mezcla de monedas;
- pregunta por cosas absurdas;
- activa eventos de tipo de cambio maldito.

### Cliente sin sombra

Rol: horror puro.

- no es arquetipo social;
- compra productos rituales;
- no debe aparecer temprano;
- la calle y aliados deben anticiparlo.

## Productos

No usar marcas reales.

Comida:

- bizcochos;
- alfajor triple;
- tortas fritas;
- pan flauta;
- refuerzo olimpico;
- empanada fria;
- faina;
- muzza recalentada;
- dulce de leche;
- yerba;
- azucar;
- cafe instantaneo;
- leche en sachet;
- galletitas de agua;
- arroz;
- polenta.

Kiosco:

- figuritas;
- chicles;
- caramelos de miel;
- encendedor;
- pilas;
- tarjeta de celular;
- auriculares baratos;
- cinta aisladora;
- birome;
- cuaderno;
- naipes;
- vela;
- estampita;
- repelente.

Objetos raros:

- radio AM rota;
- termo sin dueno;
- mate partido;
- llave sin numero;
- boleto viejo;
- tambor chico;
- mascara de carnaval;
- libreta de fiado negra;
- VHS sin etiqueta;
- camiseta destenida;
- paraguas mojado;
- foto carnet quemada.

## Eventos por noche

### Noche de lluvia

- mas tortas fritas;
- menos clientes;
- mas fallas electricas;
- anomalia: entra gente mojada, pero afuera no llueve.

### Noche de clasico

- radio prendida;
- clientes alterados;
- canticos lejanos;
- anomalia: el resultado cambia cada vez que imprimis ticket.

### Noche de feria

- stock usado;
- objetos con pasado;
- anomalia: un objeto vendido vuelve al estante con otro precio.

### Noche de carnaval

- murga, tambores, maquillaje, mascaras;
- clientes hablan raro o rimado;
- anomalia: algunos tienen cara pintada, pero no tienen cara debajo.

### Noche de apagon

- solo funcionan caja, radio y ojos del gato;
- anomalia: la caja sigue cobrando sin luz.

### Noche de niebla en la rambla

- pocos clientes;
- silencio;
- anomalia: la camara muestra agua entrando bajo la puerta.

## Estetica visual

Direccion: **diorama 3D cozy horror uruguayo**, con recursos 2.5D para personajes.

Rasgos:

- PlayCanvas 3D con camara fija desde adentro;
- geometria simple y expresiva;
- materiales pintados, no fotorrealistas;
- bajo detalle, siluetas fuertes;
- luz amarilla/verde de almacen;
- exterior azul frio;
- lluvia y reflejos en vereda;
- carteles escritos a mano;
- precios con marcador;
- gondolas apretadas;
- UI diegetica en ticket, libreta, caja y radio;
- camara CCTV granulada como vista auxiliar;
- personajes como cutouts/capas animadas en ventanilla, no humanos 3D riggeados en la demo.

Paleta:

- amarillo tubo viejo;
- verde almacen;
- rojo cartel;
- azul rambla/noche;
- gris humedad;
- violeta carnaval;
- blanco termico de ticket;
- marron papel/libreta.

Regla visual:

El local debe sentirse seguro, chico y calido. La calle debe sentirse fria, abierta y hostil. La ventanilla une ambos mundos.

## Audio

Sonidos clave:

- scanner;
- impresora termica;
- campanilla o golpe de ventanilla;
- heladera;
- tubo fluorescente;
- radio AM;
- lluvia;
- bondi frenando;
- moto de delivery;
- murga lejana;
- tambor de candombe lejano;
- relator de futbol;
- monedas;
- termo apoyandose;
- lapicera sobre libreta;
- caja abriendo;
- gato moviendose.

Regla cultural:

El candombe no se usa como "sonido maligno". Puede ser proteccion, memoria o advertencia.

## Asset generation pipeline

El proyecto debe adaptar la tool `tools/asset-gen` usada en `blu-game`.

Objetivo:

Generar todos los assets necesarios para la demo sin depender de un artista externo:

- personajes;
- variaciones de cliente;
- animaciones 2.5D;
- props de almacen;
- productos;
- texturas del local;
- carteles;
- tickets;
- libreta;
- UI diegetica;
- fondos/calle;
- overlays de lluvia/niebla;
- SFX;
- ambient loops.

### Reuso desde blu-game

Mantener el enfoque del asset-gen existente:

- CLI `pnpm asset <skill> ...`;
- staging por variante;
- `report.json`;
- promocion manual `pnpm asset:promote`;
- skills auto-descubiertas;
- bible global de arte inyectada a prompts;
- QA antes de promover;
- no incluir la herramienta en el build final.

No reutilizar la direccion visual de Blu. Solo reutilizar la arquitectura.

### Nueva direccion global

Crear `tools/asset-gen/art-direction.md` especifico de La Caja No Cierra.

Debe imponer:

- cozy horror uruguayo;
- materiales pintados a mano;
- geometria simple;
- silueta legible;
- suciedad y humedad controladas;
- cero fotorrealismo;
- cero stock generic horror;
- cero marcas reales;
- objetos cotidianos con un detalle inquietante;
- misma luz base: interior calido, exterior frio;
- paleta limitada por familia de escena;
- UI diegetica legible a baja resolucion.

### Skills necesarias

#### `sprite`

Adaptada para:

- iconos de productos;
- stickers/figuritas;
- pequenos props transparentes;
- simbolos de ticket;
- FX de caja, luz, interferencia, gato, lluvia.

#### `background`

Adaptada para:

- capas opacas de calle visible;
- overlays transparentes de lluvia, niebla, reflejos;
- vistas CCTV;
- fondos de eventos especiales.

#### `sfx`

Adaptada para:

- caja;
- ticket;
- radio;
- heladera;
- lluvia;
- monedas;
- golpes en ventanilla;
- UI diegetica;
- gato;
- interferencias.

Debe mantener variantes reproducibles por seed cuando sea posible.

#### `texture`

Nueva skill para texturas 3D estilizadas:

- albedo cuadrado;
- roughness/metalness opcional si conviene;
- normal map solo si aporta y no ensucia;
- materiales tileables para pared, piso, mostrador, vidrio, metal, papel, plastico, goma, vereda mojada.

Salida:

```text
public/assets/textures/<name>/
  albedo.png
  normal.png (opcional)
  orm.png (opcional)
  report.json
```

#### `prop`

Nueva skill para props de PlayCanvas basados en malla simple + textura:

- caja registradora;
- libreta;
- radio;
- productos;
- heladera;
- estantes;
- reja;
- bandeja de ventanilla;
- termo/mate;
- gato en poses estaticas.

Para la demo, la malla puede ser:

- primitiva procedural;
- modelo simple creado por script;
- plano/caja con textura;
- glTF bajo en poligonos si el pipeline puede generarlo de forma confiable.

La prioridad es consistencia visual, no complejidad 3D.

#### `character`

Nueva skill para personajes 2.5D de ventanilla.

Salida esperada:

- busto/cuerpo frontal o tres-cuartos;
- capas separadas: cabeza, torso, manos, accesorio si aplica;
- estados: idle, hablar, esperar, irse, inquietante;
- variantes de expresion;
- silueta reconocible por arquetipo;
- sin caricatura ofensiva.

Implementacion en juego:

- planos/cutouts con textura;
- animacion por interpolacion de transform;
- swaps de expresion;
- manos separadas para pagar, pedir, entregar objeto;
- lluvia/sombra/vidrio encima.

No exigir humanoides 3D riggeados para la demo.

#### `ticket`

Nueva skill para graficas diegeticas:

- tickets termicos;
- simbolos;
- sellos;
- errores de impresion;
- manchas;
- layouts legibles.

#### `signage`

Nueva skill para carteles y precios:

- "ABIERTO";
- ofertas;
- carteles a marcador;
- etiquetas de gondola;
- advertencias;
- horarios;
- precios alterados por anomalias.

Texto debe poder editarse o regenerarse por plantilla. Evitar horrores de texto IA en assets finales cuando el texto sea importante.

### QA de assets

Cada asset promovido debe pasar criterios minimos:

- legible al tamano real en juego;
- estilo consistente;
- sin marcas reales;
- sin texto roto si el texto es critico;
- sin estereotipos ofensivos en personajes;
- sin fotorrealismo accidental;
- sin ruido visual que tape la UI;
- texturas tileables sin costuras obvias;
- props con pivote/origen usable en PlayCanvas;
- animaciones sin salto de escala o baseline.

### Asset list inicial para demo

Ambiente:

- local base;
- mostrador;
- ventanilla/reja/vidrio;
- vereda mojada;
- calle nocturna;
- poste de luz;
- cartel abierto;
- heladera;
- estantes;
- caja registradora;
- libreta negra;
- radio AM;
- bandeja de intercambio;
- gato.

Productos:

- yerba;
- vela;
- pan;
- leche;
- pilas;
- cafe;
- alfajor;
- figuritas;
- torta frita;
- encendedor;
- comida de gato;
- paraguas mojado.

Clientes demo:

- taxista;
- jubilada;
- El Yona;
- cheto;
- delivery;
- cuidacoches;
- Mabel Medianoche;
- cliente sin sombra.

Eventos demo:

- lluvia fina;
- fiado;
- tablado;
- apagon corto;
- rumor encendido.

UI diegetica:

- ticket normal;
- ticket maldito;
- pagina de libreta;
- deuda tachada;
- nombre falso;
- simbolos locales;
- radio subtitulo;
- aviso caja no cierra.

Audio:

- caja tecla;
- caja error;
- impresora;
- radio static;
- lluvia loop;
- heladera loop;
- golpe ventanilla;
- moneda;
- lapicera;
- gato;
- murga lejana;
- tambor lejano;
- taxi idle.

## Arquitectura tecnica

Proyecto nuevo recomendado:

```text
la-caja-no-cierra/
  package.json
  src/
    main.js
    game/
      state/
      systems/
      content/
      ui/
      playcanvas/
  public/
    assets/
      models/
      textures/
      characters/
      props/
      sounds/
      tickets/
  tools/
    asset-gen/
  docs/
    superpowers/
```

PlayCanvas:

- escena unica principal;
- camara fija;
- luces interiores/exteriores separadas;
- objetos interactivos con componentes;
- raycast/pointer para caja, libreta, productos, radio;
- sistema de eventos independiente del motor;
- content data en JSON/JS para clientes, productos, tickets y noches.

Separacion recomendada:

- `RunState`: tiempo, variables, noche activa, queue de clientes.
- `ShopSystem`: stock, productos, precios.
- `DebtSystem`: libreta, deudas, perdones, cobros.
- `TicketSystem`: simbolos, combinaciones, efectos.
- `CustomerSystem`: pedidos, dialogo, reacciones.
- `AnomalySystem`: eventos, escalada, efectos visuales/audio.
- `AssetManifest`: referencias generadas y promovidas.

## Demo de 3 noches

### Noche 1: Turno nuevo

- tutorial diegetico;
- taxista, Julia R., El Yona;
- primera anomalia leve;
- se aprende cobrar y leer ticket.

### Noche 2: Fiado

- desbloquea libreta;
- cheto, delivery, cuidacoches;
- primera deuda vieja;
- primer cliente imposible.

### Noche 3: Tablado

- aparece Mabel Medianoche;
- murga y tambor lejanos;
- ticket viejo con nombre del jugador;
- final: la libreta suma sola "Saldo pendiente: una noche mas."

## Tratamiento de personajes sensibles

Reglas de escritura y arte:

- personajes con nombre propio cuando sean recurrentes;
- humor desde situacion y voz, no desde identidad vulnerable;
- no reducir personajes a pobreza, consumo, identidad de genero o jerga;
- no usar persona con consumo problematico como monstruo;
- no usar personaje trans/travesti como gag o jumpscare;
- no hacer que "nery" signifique ladron por defecto;
- cada personaje debe poder ayudar, mentir, equivocarse o tener dignidad.

## Fuera de alcance inicial

- multiplayer;
- mundo explorable fuera del local;
- clientes caminando dentro del local;
- humanos 3D riggeados completos;
- inventario complejo de deposito;
- marcas reales;
- combate directo;
- gore explicito;
- economia persistente grande;
- roguelite con meta progresion pesada.

## Riesgos

- PlayCanvas + asset-gen 3D puede crecer demasiado si se exige rigging completo.
- Texto generado en carteles/tickets puede salir roto; usar plantillas editables.
- La identidad uruguaya puede volverse lista de referencias si no cada elemento afecta sistemas.
- Personajes sensibles pueden caer en caricatura si no tienen funcion, agencia y escritura cuidada.
- Demasiados productos pueden volver ilegible el loop de 10 minutos.

Mitigaciones:

- personajes 2.5D por capas para demo;
- props simples con texturas fuertes;
- productos limitados por noche;
- ticket/libreta como nucleo de reglas;
- QA cultural y visual antes de promover assets;
- vertical slice con 3 noches antes de ampliar.

## Criterios de exito

- El jugador entiende que la deuda importa antes del minuto 3.
- El local se siente cozy y seguro; la calle se siente fria y rara.
- La ventanilla produce tension sin jumpscares baratos.
- Cada cliente recurrente tiene funcion jugable clara.
- Los tickets sorprenden y dan ganas de probar combinaciones.
- La libreta da culpa, poder y miedo.
- Los assets generados se sienten de un mismo juego, no de prompts sueltos.
- La demo termina con una promesa clara de "una noche mas".
