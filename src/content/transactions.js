export const TRANSACTIONS = {
  // ═══ Noche 1: Turno nuevo ═══
  "taxista-lluvia-01": {
    id: "taxista-lluvia-01",
    customerId: "taxista",
    nightState: "lluvia-fina",
    request: { kind: "human", productIds: ["cafe", "cigarros-ficticios", "chicles"], line: "Bo, dame un cafe y unos cigarros. Y chicles, que subi a uno que olia a agua estancada." },
    actions: {
      charge: { label: "Cobrar normal", money: 190, reputation: 0, curse: 1, ticketSymbols: ["taxi", "humo", "lluvia"], effectText: "La radio repite una frase del pasajero." },
      credit: { label: "Fiar", money: 0, reputation: 2, curse: 0, debt: { customerId: "taxista", amount: 190, note: "Cafe, cigarros y chicles" }, deferredTransactionId: "taxista-vuelve-01", effectText: "El taxi queda prendido afuera aunque el chofer se va." },
      ask: { label: "Preguntar por el pasajero", money: 0, reputation: 1, curse: 1, clueText: "Me pidio venir aca, pero cuando llegamos ya estaba parado en tu ventanilla." },
      cancel: { label: "Negar cigarros", money: 0, reputation: -1, curse: 0, effectText: "La ventanilla se empana desde afuera." },
    },
  },
  "julia-libreta-01": {
    id: "julia-libreta-01",
    customerId: "julia-r",
    nightState: "lluvia-fina",
    request: { kind: "tensioned", productIds: ["vela"], line: "Antes me lo anotaban." },
    actions: {
      charge: { label: "Cobrar normal", money: 55, reputation: -1, curse: 1, ticketSymbols: ["vela", "lluvia"], effectText: "Julia cuenta monedas exactas y mira la libreta." },
      credit: { label: "Fiar vela", money: 0, reputation: 2, curse: 1, debt: { customerId: "julia-r", amount: 55, note: "Vela" }, ticketSymbols: ["vela", "libreta", "lluvia"], effectText: "La radio pierde la fecha actual durante diez segundos." },
      openNotebook: { label: "Abrir libreta", money: 0, reputation: 0, curse: 2, oldDebt: { customerId: "julia-r", note: "Pan, leche, vela", since: "1998", amount: 0 }, effectText: "JULIA R. Pan, leche, vela. Saldo pendiente desde 1998." },
      cancel: { label: "Cerrar ventanilla", money: 0, reputation: -2, curse: 1, effectText: "Julia espera bajo la lluvia sin moverse." },
    },
  },
  "yona-aviso-01": {
    id: "yona-aviso-01",
    customerId: "el-yona",
    nightState: "lluvia-fina",
    request: { kind: "tensioned", productIds: ["chicles", "vela"], line: "Ese del taxi no camino hasta aca. Aparecio." },
    actions: {
      charge: { label: "Cobrar normal", money: 90, reputation: 1, curse: 0, ticketSymbols: ["taxi", "vela"], effectText: "El Yona senala una sombra que no toca el piso." },
      credit: { label: "Fiar", money: 0, reputation: 2, curse: 0, debt: { customerId: "el-yona", amount: 90, note: "Chicles y vela" }, effectText: "El Yona promete avisar si vuelve el que no pisa sombra." },
      ask: { label: "Preguntar que vio", money: 0, reputation: 1, curse: 1, clueText: "Si entra con lentes de sol de noche, apaga la heladera." },
      cancel: { label: "No atender", money: 0, reputation: -1, curse: 1, effectText: "El Yona se va diciendo que no juzga, pero aprende." },
    },
  },
  "taxista-vuelve-01": {
    id: "taxista-vuelve-01",
    customerId: "taxista",
    nightState: "lluvia-fina",
    request: { kind: "impossible", productIds: ["cafe"], line: "Me mandaron a una direccion que no existe. Igual me debe el viaje." },
    actions: {
      charge: { label: "Cobrar el cafe", money: 45, reputation: 0, curse: 2, ticketSymbols: ["taxi", "libreta"], effectText: "El ticket imprime una direccion que no figura en Montevideo." },
      cancel: { label: "Cerrar sin vender", money: 0, reputation: -1, curse: 1, effectText: "El taxi queda prendido hasta el cierre." },
    },
  },

  // ═══ Noche 2: Fiado ═══
  "delivery-apurado-01": {
    id: "delivery-apurado-01",
    customerId: "delivery",
    nightState: "lluvia-fina",
    request: { kind: "human", productIds: ["alfajor", "chicles"], line: "Rapido que tengo el moto prendida y me roban el celular ahi." },
    actions: {
      charge: { label: "Cobrar normal", money: 75, reputation: 1, curse: 0, ticketSymbols: ["taxi", "humo"], effectText: "El delivery se va y la moto toca bocina dos veces sin razon." },
      credit: { label: "Fiar", money: 0, reputation: 2, curse: 1, debt: { customerId: "delivery", amount: 75, note: "Alfajor y chicles" }, effectText: "Deja el casco apoyado en la bandeja. Cuando se va, el casco sigue ahi." },
      ask: { label: "Preguntar por el paquete", money: 0, reputation: 0, curse: 1, clueText: "El paquete que llevo atras no tiene direccion. Solo un nombre que no pude leer." },
      cancel: { label: "No atender", money: 0, reputation: -1, curse: 0, effectText: "Acelera y se va. La moto suena mas fuerte de lo que deberia." },
    },
  },
  "cuidacoches-radar-01": {
    id: "cuidacoches-radar-01",
    customerId: "cuidacoches",
    nightState: "lluvia-fina",
    request: { kind: "human", productIds: ["cafe", "encendedor"], line: "Che, bo, te aviso: hay un auto que da vueltas hace media hora y no baja nadie." },
    actions: {
      charge: { label: "Cobrar normal", money: 105, reputation: 1, curse: 0, ticketSymbols: ["taxi", "humo"], effectText: "El cuidacoches te ve bien. Se queda mirando la calle por vos." },
      credit: { label: "Fiar", money: 0, reputation: 3, curse: 0, debt: { customerId: "cuidacoches", amount: 105, note: "Cafe y encendedor" }, effectText: "Te debe favor, no plata. Eso vale mas en este barrio." },
      ask: { label: "Preguntar del auto", money: 0, reputation: 1, curse: 0, clueText: "El auto es rojo y no tiene patente. El que maneja usa lentes de sol. Son las tres de la manana." },
      cancel: { label: "Despacharlo", money: 0, reputation: -2, curse: 1, effectText: "Se va silbando. Cuando se va, el auto rojo se acerca mas." },
    },
  },
  "cheto-premium-01": {
    id: "cheto-premium-01",
    customerId: "cheto",
    nightState: "lluvia-fina",
    request: { kind: "human", productIds: ["yerba", "vela"], line: "Esto es yerba organica? No? Igual, la vela. Y me cambias los precios del cartel." },
    actions: {
      charge: { label: "Cobrar normal", money: 175, reputation: -1, curse: 1, ticketSymbols: ["mate", "vela"], effectText: "Paga con un billete que no circula mas. La caja lo acepta." },
      credit: { label: "Fiar", money: 0, reputation: -2, curse: 2, debt: { customerId: "cheto", amount: 175, note: "Yerba y vela" }, effectText: "Te dice que despues te pasa la plata. Nunca especifica cuando es despues." },
      ask: { label: "Preguntar por el billete", money: 0, reputation: 0, curse: 2, clueText: "Es un billete de 1998. La misma fecha que la deuda de Julia." },
      cancel: { label: "Rechazar venta", money: 0, reputation: 1, curse: 0, effectText: "Se va ofendido. El barrio respira un poco." },
    },
  },
  "flaco-frio-01": {
    id: "flaco-frio-01",
    customerId: "el-flaco",
    nightState: "lluvia-fina",
    request: { kind: "human", productIds: ["pan", "cafe"], line: "Bo, si me fias el pan y el cafe te juro que manana traigo la plata. Manana si o si." },
    actions: {
      charge: { label: "Cobrar normal", money: 75, reputation: -3, curse: 2, ticketSymbols: ["mate", "lluvia"], effectText: "Cuenta monedas que le alcanzan justo. Se va sin decir gracias." },
      credit: { label: "Fiar", money: 0, reputation: 3, curse: -1, debt: { customerId: "el-flaco", amount: 75, note: "Pan y cafe" }, effectText: "Se va con el pan y el cafe. Por primera vez en la noche, la lluvia baja un poco." },
      give: { label: "Regalar", money: -75, reputation: 5, curse: -2, effectText: "No le cobras. El Flaco te mira y dice algo que no alcanzas a escuchar. La maldicion baja." },
      cancel: { label: "Rechazar", money: 0, reputation: -4, curse: 3, effectText: "Se va. La heladera empieza a sonar mas fuerte. El barrio se pone hostil." },
    },
  },

  // ═══ Noche 3: Tablado ═══
  "mabel-entrada-01": {
    id: "mabel-entrada-01",
    customerId: "mabel",
    nightState: "tablado",
    request: { kind: "tensioned", productIds: ["vela", "dulce-de-leche"], line: "Bo, dame una vela y dulce de leche. Y decime: la libreta tuya o te la dejaron?" },
    actions: {
      charge: { label: "Cobrar normal", money: 145, reputation: 1, curse: 0, ticketSymbols: ["vela", "tablado"], effectText: "Mabel lee el ticket antes de irse. Sonrie. 'Esto no es un ticket, es un poema.'" },
      credit: { label: "Fiar", money: 0, reputation: 2, curse: 0, debt: { customerId: "mabel", amount: 145, note: "Vela y dulce de leche" }, effectText: "Mabel dice que las vedettes no fiamos, pero las que sabemos pagamos con favores." },
      ask: { label: "Preguntar por la libreta", money: 0, reputation: 2, curse: -1, clueText: "La libreta no es tuya. Pero tampoco es mia. Es del que tenia el local antes de vos. Y antes del anterior. La libreta es mas vieja que el barrio." },
      openNotebook: { label: "Mostrarle la libreta", money: 0, reputation: 0, curse: -3, effectText: "Mabel la mira. Pasa la mano por las paginas. Tres deudas se borran solas. 'Estas estaban pagadas hace tiempo. La libreta no se habia enterado.'" },
    },
  },
  "mabel-oraculo-01": {
    id: "mabel-oraculo-01",
    customerId: "mabel",
    nightState: "tablado",
    request: { kind: "impossible", productIds: ["vela", "figuritas", "boleto-viejo"], line: "El proximo que viene no deberias atenderlo. Pero lo vas a atender igual. Todos lo hacen." },
    actions: {
      charge: { label: "Cobrar", money: 85, reputation: 1, curse: 0, ticketSymbols: ["vela", "boleto"], effectText: "Mabel te da las cosas. El ticket imprime un nombre que no reconoces. Es el tuyo." },
      ask: { label: "Preguntar quien viene", money: 0, reputation: 0, curse: 1, clueText: "Viene uno que no pisa sombra. No es el primero. Pero es el que te va a encontrar a vos." },
      cancel: { label: "Rechazar", money: 0, reputation: -1, curse: 2, effectText: "Mabel se va. 'Igual va a venir. Yo solo te avisaba por educacion.'" },
    },
  },
};
