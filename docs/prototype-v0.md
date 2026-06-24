# Prototype V0

## Pregunta

El primer prototipo responde solo esto:

> Es divertido y tenso atender por ventanilla usando caja + libreta?

Si la respuesta no es clara, no avanzar a demo de 3 noches.

## Duracion

- 1 noche.
- 6 a 8 minutos.
- 1 cierre de caja.

## Contenido maximo

- 1 escena.
- 1 ventanilla.
- 1 caja.
- 1 libreta.
- 1 radio.
- 1 gato como indicador simple.
- 4 productos interactivos:
  - cafe;
  - cigarros ficticios;
  - chicles;
  - vela.
- 3 clientes:
  - Taxista;
  - Julia R.;
  - El Yona.
- 1 cliente recurrente: Taxista vuelve si queda deuda.
- 1 decision de fiado.
- 1 ticket raro.
- 1 evento de calle.
- 1 cierre de caja.

## Variables

Solo cuatro:

- Plata.
- Maldicion.
- Reputacion barrial.
- Deuda activa.

No incluir todavia:

- calma;
- ruido de calle;
- stock complejo;
- economia persistente;
- eventos de carnaval/feria/tablado.

## Noche: Turno nuevo

Clima: lluvia fina.

Clientes:

1. Taxista: compra cafe + cigarros ficticios + chicles.
2. Julia R.: compra vela.
3. El Yona: pide chicles + vela, y advierte que alguien no pisa sombra.

Momento iconico antes del minuto 3:

Julia R. pide fiado. Al abrir la libreta, ya aparece una deuda vieja:

```text
JULIA R.
Pan, leche, vela.
Saldo pendiente desde 1998.
```

El prototipo no necesita vender pan ni leche. La linea vieja existe para demostrar que la libreta registra mas que la venta actual.

## Gramatica de transaccion

Cada venta sigue esta estructura:

```text
Aparece cliente
-> pide / reclama / trae deuda
-> jugador elige productos
-> jugador elige accion economica
-> caja imprime ticket
-> libreta registra consecuencia
-> cliente reacciona
-> calle/barrio responde
```

Cada transaccion guarda:

```text
cliente
productos
estado de noche
accion economica
resultado economico
resultado social
resultado sobrenatural
pista o anomalia
```

Acciones economicas V0:

- cobrar normal;
- fiar;
- cancelar;
- preguntar por deuda vieja.

## Ejemplo completo: Taxista

Estado: lluvia fina.

Pedido:

```text
cafe + cigarros ficticios + chicles
```

Dialogo:

```text
Bo, dame un cafe y unos cigarros. Y chicles, que subi a uno que olia a agua estancada.
```

Opciones:

- cobrar normal;
- fiar;
- preguntarle por el pasajero;
- negar cigarros.

Resultado cobrar normal:

- `+ plata`;
- ticket: `TAXI + HUMO + LLUVIA`;
- efecto: la radio repite una frase del pasajero.

Resultado fiar:

- `+ reputacion con Taxista`;
- `+ deuda activa`;
- efecto diferido: vuelve mas tarde con una direccion imposible.

Resultado preguntar:

- `+ pista`;
- `+ maldicion leve`;
- dialogo: `Me pidio venir aca, pero cuando llegamos ya estaba parado en tu ventanilla.`

Resultado negar cigarros:

- `- reputacion`;
- no activa deuda;
- el taxista se va, pero deja la ventanilla empañada desde afuera.

## Ejemplo completo: Julia R.

Estado: lluvia fina.

Pedido:

```text
vela
```

Dialogo:

```text
Antes me lo anotaban.
```

Opciones:

- cobrar normal;
- fiar;
- preguntar nombre;
- abrir libreta.

Resultado abrir libreta:

- aparece la linea vieja de 1998;
- `+ maldicion`;
- desbloquea decision: perdonar deuda vieja o cerrar libreta.

Resultado fiar:

- `+ reputacion`;
- `+ deuda activa`;
- ticket: `VELA + LIBRETA + LLUVIA`;
- la radio pierde la fecha actual durante 10 segundos.

## Ejemplo completo: El Yona

Pedido normal:

```text
chicles
```

Pedido tensionado:

```text
chicles + vela
```

Dialogo:

```text
Ese del taxi no camino hasta aca. Aparecio.
```

Funcion:

- tutorializa pistas de calle;
- detecta si un cliente no es humano;
- sube reputacion si no se lo prejuzga.

## Exit criteria

El prototipo sirve si:

- el jugador entiende caja/libreta sin tutorial largo;
- la ventanilla produce tension;
- fiar/cobrar/perdonar genera duda real;
- lo cotidiano hace creible lo raro;
- la libreta imposible se entiende antes del minuto 3;
- el cierre de caja deja ganas de una noche mas.

## No construir aun

- asset-gen completo;
- 3 noches;
- Mabel Medianoche;
- Cliente sin sombra;
- feria;
- tablado;
- inspector;
- texture/prop/character skills formales;
- Steam page;
- trailer.
