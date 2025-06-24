/*Define y exporta los eventos personalizados usando 
EventEmitter. Aquí puedes manejar lo que ocurre cuando se detecta un aniversario */
const EventEmitter = require("events");
const dayjs = require("dayjs");
const path = require("path");

class AniversarioEmitter extends EventEmitter {}
const aniversarioEmitter = new AniversarioEmitter();

const imagenesAniversario = { //Busca las imagenes en la direccion
  1: path.join(__dirname, "img", "aniversario-1.png"),
  2: path.join(__dirname, "img", "aniversario-2.png"),
  3: path.join(__dirname, "img", "aniversario-3.png"),
  // … añadir todas las necesarias
};

async function buscarAniversarios(trabajadores) {
  console.log ( new Promise((resolve) => { //Hacemos una promesa
    console.log("Buscando proximos aniversarios de trabajadores..");
    setTimeout(() => { 
      const hoy = dayjs();
      const enTresDias = hoy.add(3, "day");
      let encontrados = [];
      for (const trabajador of trabajadores) {
        if (!trabajador.fechaEntrada) continue;
        const fechaIngreso = dayjs(trabajador.fechaEntrada);
        let fechaAniversario = fechaIngreso.year(enTresDias.year());
        const nroAniversario = fechaAniversario.diff(fechaIngreso, 'year');
        if (fechaAniversario.isSame(enTresDias, 'day')) {
          const imagen = imagenesAniversario[nroAniversario];
          const info = {
            nombre: trabajador.nombre,
            mail: trabajador.mail,
            fechaEntrada: trabajador.fechaEntrada,
            nroAniversario,
            imagen
          };
          aniversarioEmitter.emit("aniversario", info);
          encontrados.push(info);
        }
      }
      if (encontrados.length === 0) {
  aniversarioEmitter.emit("sinAniversarios");
}
      resolve(encontrados); // <-- ahora la promesa se resuelve
    }, 2000);
  }));
}


 function MensajeMail(nombre,imagen) {
  return `¡Hola, ${nombre}!

Se viene una fecha muy especial... ¡tu Crombieversario! 🎂
Queremos agradecerte por ser parte de este camino y por compartir un año más con nosotros. Cada aporte tuyo suma a lo que hacemos día a día y nos hace crecer como equipo 💜
Para celebrarlo, armamos unas placas digitales que podés usar (si queres) para compartir en tus redes. Podés contar alguna reflexión sobre este tiempo en Crombie: aprendizajes, desafíos, alegrías o lo que más te haya marcado 💬 Te dejamos las imágenes abajo en este mail.

Si lo compartís, no te olvides de etiquetarnos para poder celebrarte también desde nuestras redes 🎈
¡Gracias por ser parte de Crombie!

Abrazo,
Equipo de Marketing
 ${imagen ? imagen : "No disponible"} `;
}

module.exports = { aniversarioEmitter, buscarAniversarios, MensajeMail };


