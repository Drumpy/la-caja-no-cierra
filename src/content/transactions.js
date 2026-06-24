export const TRANSACTIONS = {
  "taxista-lluvia-01": {
    id: "taxista-lluvia-01",
    customerId: "taxista",
    nightState: "lluvia-fina",
    request: {
      kind: "human",
      productIds: ["cafe", "cigarros-ficticios", "chicles"],
      line:
        "Bo, dame un cafe y unos cigarros. Y chicles, que subi a uno que olia a agua estancada.",
    },
    actions: {
      charge: {
        label: "Cobrar normal",
        money: 190,
        reputation: 0,
        curse: 0,
        ticketSymbols: ["taxi", "humo", "lluvia"],
        effectText: "La radio repite una frase del pasajero.",
      },
      credit: {
        label: "Fiar",
        money: 0,
        reputation: 2,
        curse: 0,
        debt: {
          customerId: "taxista",
          amount: 190,
          note: "Cafe, cigarros y chicles",
        },
        deferredTransactionId: "taxista-vuelve-01",
        effectText: "El taxi queda prendido afuera aunque el chofer se va.",
      },
      ask: {
        label: "Preguntar por el pasajero",
        money: 0,
        reputation: 1,
        curse: 1,
        clueText:
          "Me pidio venir aca, pero cuando llegamos ya estaba parado en tu ventanilla.",
      },
      cancel: {
        label: "Negar cigarros",
        money: 0,
        reputation: -1,
        curse: 0,
        effectText: "La ventanilla se empana desde afuera.",
      },
    },
  },

  "julia-libreta-01": {
    id: "julia-libreta-01",
    customerId: "julia-r",
    nightState: "lluvia-fina",
    request: {
      kind: "tensioned",
      productIds: ["vela"],
      line: "Antes me lo anotaban.",
    },
    actions: {
      openNotebook: {
        label: "Abrir libreta",
        money: 0,
        reputation: 0,
        curse: 2,
        oldDebt: {
          customerId: "julia-r",
          note: "Pan, leche, vela",
          since: "1998",
          amount: 0,
        },
        nextTransactionId: "julia-deuda-1998-01",
        ticketSymbols: ["libreta", "lluvia"],
        effectText: "JULIA R. Pan, leche, vela. Saldo pendiente desde 1998.",
      },
      charge: {
        label: "Cobrar normal",
        money: 55,
        reputation: -1,
        curse: 0,
        ticketSymbols: ["vela", "lluvia"],
        effectText: "Julia cuenta monedas exactas y mira la libreta.",
      },
      credit: {
        label: "Fiar vela",
        money: 0,
        reputation: 2,
        curse: 1,
        debt: {
          customerId: "julia-r",
          amount: 55,
          note: "Vela",
        },
        ticketSymbols: ["vela", "libreta", "lluvia"],
        effectText: "La radio pierde la fecha actual durante diez segundos.",
      },
      cancel: {
        label: "Cerrar ventanilla",
        money: 0,
        reputation: -2,
        curse: 1,
        effectText: "Julia espera bajo la lluvia sin moverse.",
      },
    },
  },

  "julia-deuda-1998-01": {
    id: "julia-deuda-1998-01",
    customerId: "julia-r",
    nightState: "lluvia-fina",
    request: {
      kind: "impossible",
      productIds: ["vela"],
      line:
        "La linea ya estaba escrita: JULIA R. Pan, leche, vela. Saldo pendiente desde 1998.",
    },
    actions: {
      forgiveOldDebt: {
        label: "Perdonar deuda vieja",
        money: -55,
        reputation: 2,
        curse: -1,
        removeOldDebtCustomerId: "julia-r",
        ticketSymbols: ["vela", "libreta", "lluvia"],
        effectText: "La tinta vieja desaparece. La caja igual marca una falta.",
      },
      charge: {
        label: "Cobrar la vela",
        money: 55,
        reputation: -1,
        curse: 1,
        ticketSymbols: ["vela", "libreta"],
        effectText: "La caja cobra hoy, pero deja abierta la fecha de 1998.",
      },
      credit: {
        label: "Fiar otra vez",
        money: 0,
        reputation: 2,
        curse: 1,
        debt: {
          customerId: "julia-r",
          amount: 55,
          note: "Vela",
        },
        ticketSymbols: ["vela", "libreta", "lluvia"],
        effectText: "La libreta acepta la nueva linea debajo de la vieja.",
      },
      cancel: {
        label: "Cerrar libreta",
        money: 0,
        reputation: -1,
        curse: 1,
        effectText: "Cerras la libreta, pero la linea queda marcada en la tapa.",
      },
    },
  },

  "yona-aviso-01": {
    id: "yona-aviso-01",
    customerId: "el-yona",
    nightState: "lluvia-fina",
    request: {
      kind: "tensioned",
      productIds: ["chicles", "vela"],
      line: "Ese del taxi no camino hasta aca. Aparecio.",
    },
    actions: {
      charge: {
        label: "Cobrar normal",
        money: 90,
        reputation: 1,
        curse: 0,
        ticketSymbols: ["taxi", "vela"],
        effectText: "El Yona senala una sombra que no toca el piso.",
      },
      credit: {
        label: "Fiar",
        money: 0,
        reputation: 2,
        curse: 0,
        debt: {
          customerId: "el-yona",
          amount: 90,
          note: "Chicles y vela",
        },
        effectText: "El Yona promete avisar si vuelve el que no pisa sombra.",
      },
      ask: {
        label: "Preguntar que vio",
        money: 0,
        reputation: 1,
        curse: 1,
        clueText: "Si entra con lentes de sol de noche, apaga la heladera.",
      },
      cancel: {
        label: "No atender",
        money: 0,
        reputation: -1,
        curse: 1,
        effectText: "El Yona se va diciendo que no juzga, pero aprende.",
      },
    },
  },

  "taxista-vuelve-01": {
    id: "taxista-vuelve-01",
    customerId: "taxista",
    nightState: "lluvia-fina",
    request: {
      kind: "impossible",
      productIds: ["cafe"],
      line: "Me mandaron a una direccion que no existe. Igual me debe el viaje.",
    },
    actions: {
      charge: {
        label: "Cobrar el cafe",
        money: 45,
        reputation: 0,
        curse: 2,
        ticketSymbols: ["taxi", "libreta"],
        effectText: "El ticket imprime una direccion que no figura en Montevideo.",
      },
      cancel: {
        label: "Cerrar sin vender",
        money: 0,
        reputation: -1,
        curse: 1,
        effectText: "El taxi queda prendido hasta el cierre.",
      },
    },
  },
};
