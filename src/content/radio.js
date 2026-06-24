const RADIO_LINES = [
  "La lluvia continua en toda la zona metropolitana.",
  "Tres puntos de accidentes en la rambla, dos sin heridos.",
  "Recordamos: el bondi 174 no circula despues de las dos.",
  "Temperatura: once grados. Sensacion termica: siete.",
  "El clasico se juega sabado a las cuatro en el Parque.",
  "Se perdió un perro en el barrio Sur. Responde al nombre de Esopo.",
  "Carnaval: las murgas ensayan en la zona de Goes y Palermo.",
  "No se estaciona del lado impar a partir de las tres.",
  "Boletín: el puerto cierra por viento fuerte.",
  "Llaman al 0800 si ven actividad rara en la feria.",
];

const INTERFERENCE_LINES = [
  "...zzt... la senal se corta apenas se acerca alguien.",
  "...el locutor se queda callado, como si escuchara algo afuera.",
  "...una interferencia tapa la voz. Vuelve, pero mas baja.",
  "...por la radio entra un ruido que no es de la lluvia.",
];

let lastLine = -1;

export function getInterferenceLine() {
  return INTERFERENCE_LINES[Math.floor(Math.random() * INTERFERENCE_LINES.length)];
}

export function getRadioLine(curse = 0) {
  if (curse >= 3 && Math.random() < 0.4) {
    return "La radio pierde la senal. Por un segundo, una voz que no es la del locutor dice tu nombre.";
  }
  let idx;
  do {
    idx = Math.floor(Math.random() * RADIO_LINES.length);
  } while (idx === lastLine && RADIO_LINES.length > 1);
  lastLine = idx;
  return RADIO_LINES[idx];
}
