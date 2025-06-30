/*Define y exporta los eventos personalizados usando 
EventEmitter. Aquí puedes manejar lo que ocurre cuando se detecta un aniversario */
const EventEmitter = require("events");
const dayjs = require("dayjs");
const path = require("path");
require('dotenv').config();
const mongoService = require('./db.js');

const { connectDB, obtenerTrabajadores } = require('./db');

class AniversarioEmitter extends EventEmitter {}
const aniversarioEmitter = new AniversarioEmitter();

const imagenesAniversario = {
  1: [
    path.join(__dirname, "img", "Crombieversario", "aniversario-1.png"),
    path.join(__dirname, "img", "Crombieversario", "aniversario-1-2.png")
  ],
  2: [
    path.join(__dirname, "img", "Crombieversario", "aniversario-1-2.png")
  ],
  3: [
    path.join(__dirname, "img", "Crombieversario", "aniversario-1.png")
  ],
};


async function inicializarDB() {
  // Conecta al servicio de MongoDB
  await mongoService.connectDB();
}
/*función para buscar por mail:
async function buscarTrabajadorPorMail(mail) {
  await connectDB(); // Solo si no está conectada aún
  const trabajador = await obtenerTrabajadores({ mail: mail });
  return trabajador;
}

// Uso de ejemplo:
(async () => {
  const resultado = await buscarTrabajadorPorMail("juan@gmail.com");
  console.log(resultado);
})();*/ 
async function buscarTrabajadoresdelaAPI(){
 
}

async function buscarAniversarios(trabajadores) {
  return new Promise((resolve) => {
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
      resolve(encontrados);
    }, 2000);
  });
}

function MensajeMail(nombre, imagen) {
  return `¡Hola, ${nombre}!

Se viene una fecha muy especial... ¡tu Crombieversario! 🎂
Queremos agradecerte por ser parte de este camino y por compartir un año más con nosotros. Cada aporte tuyo suma a lo que hacemos día a día y nos hace crecer como equipo 💜
Para celebrarlo, armamos unas placas digitales que podés usar (si queres) para compartir en tus redes. Podés contar alguna reflexión sobre este tiempo en Crombie: aprendizajes, desafíos, alegrías o lo que más te haya marcado 💬 Te dejamos las imágenes abajo en este mail.

Si lo compartís, no te olvides de etiquetarnos para poder celebrarte también desde nuestras redes 🎈
¡Gracias por ser parte de Crombie!

Abrazo,
Equipo de Marketing
${imagen ? imagen : "No disponible"}
`;
}

module.exports = { aniversarioEmitter, buscarAniversarios, MensajeMail, inicializarDB };



/*Lo que tendria que hacer es:
//Extraer informacion desde la API de PeopleForce
// Luego se emiten los eventos y se envian los email
// Antes de enviar los emails, tiene que buscar en la base de datos el mensaje y la imagen correspondiente al trabajador.
// Lo que se envia y se emite se guarda en la base de datos mongoDB compass para guardar un registro de los aniversarios
// Luego se crea un endpoint para consultar los aniversarios pasados y futuros
// También se puede crear un endpoint para consultar los aniversarios de un trabajador específico por su mail*/