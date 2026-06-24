# Technical Architecture

## Stack

- PlayCanvas como base del juego.
- Vite o build web simple para desarrollo local.
- Data-first para contenido: clientes, productos, tickets, noches y transacciones en JSON/JS.
- Sin multiplayer.

## PlayCanvas direction

Usar PlayCanvas para:

- escena 3D fija;
- luces interiores/exteriores;
- vidrio, lluvia y reflejos;
- raycast/pointer sobre objetos;
- entidades/componentes para caja, libreta, radio, productos y ventanilla;
- planos/cutouts de personajes 2.5D.

Asset notes:

- Preferir GLB/glTF para props 3D simples cuando haya modelos.
- Usar texture atlas/sprites para personajes 2.5D, expresiones y elementos diegeticos planos.
- Mantener assets por debajo de limites razonables; no usar el limite maximo como presupuesto.

## Sistemas

### RunState

Mantiene:

- tiempo de noche;
- variables activas;
- cliente actual;
- queue de clientes;
- noche/evento activo.

Prototype V0:

- plata;
- maldicion;
- reputacion barrial;
- deuda activa.

### ShopSystem

Mantiene:

- productos disponibles;
- precio;
- seleccion actual;
- si producto esta oculto/detras del mostrador.

### DebtSystem

Mantiene:

- entradas de libreta;
- deuda por cliente;
- deuda vieja;
- perdon/cobro;
- nombres falsos.

### TicketSystem

Calcula:

- simbolos;
- resultado de ticket;
- efectos inmediatos;
- efectos diferidos.

### CustomerSystem

Mantiene:

- estado de cliente;
- pedido;
- dialogo;
- tolerancia;
- reaccion.

### AnomalySystem

Dispara:

- efectos de calle;
- radio;
- luces;
- libreta;
- cliente falso;
- cambios de ticket.

## Gramatica de transaccion

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

Estructura de datos sugerida:

```js
{
  id: "taxista-lluvia-01",
  customerId: "taxista",
  nightState: "lluvia-fina",
  request: {
    kind: "human",
    productIds: ["cafe", "cigarros-ficticios", "chicles"],
    line: "Bo, dame un cafe y unos cigarros..."
  },
  actions: {
    charge: {
      money: 120,
      reputation: 0,
      curse: 1,
      ticketSymbols: ["taxi", "humo", "lluvia"],
      effectId: "radio-repite-pasajero"
    },
    credit: {
      money: 0,
      reputation: 2,
      debt: { customerId: "taxista", amount: 120 },
      deferredEffectId: "direccion-imposible"
    },
    ask: {
      clueId: "pasajero-ya-estaba",
      curse: 1
    },
    cancel: {
      reputation: -1,
      effectId: "ventana-empanada"
    }
  }
}
```

## Interaction model

Prototype:

- click producto -> agrega a bandeja;
- click caja -> cobrar/cancelar;
- click libreta -> abrir decision de deuda;
- click radio -> repetir pista actual;
- click gato -> sin texto, solo reaccion visual/sonora.

No incluir drag complejo hasta validar ritmo.

## Technical non-goals V0

- Editor PlayCanvas remoto obligatorio.
- Rigging humano.
- Animaciones complejas.
- Asset-gen integrado al build.
- Persistencia entre sesiones.
- Steam integration.

## References

- PlayCanvas asset importing, GLB migration and file-size limit: https://developer.playcanvas.com/user-manual/editor/assets/importing/
- PlayCanvas texture atlas and sprites for 2D graphics: https://developer.playcanvas.com/user-manual/editor/assets/inspectors/texture-atlas/
