/*Define y exporta los eventos personalizados usando 
EventEmitter. Aquí puedes manejar lo que ocurre cuando se detecta un aniversario */

require('dotenv').config();
const EventEmitter = require("events");
const dayjs = require("dayjs");
const path = require("path");
const fs = require("fs");
const imagenesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/imagenes.json'), 'utf-8'));

class AniversarioEmitter extends EventEmitter {}
const aniversarioEmitter = new AniversarioEmitter();

function obtenerImagenesParaAniversario(nroAniversario) {
  // Si quieres enviar solo una imagen por aniversario:
  const img = imagenesData.find(img => img.nombre === `${nroAniversario}.png`);
  return img ? [img.ruta] : [];
  // Si quieres enviar varias imágenes por aniversario, ajusta aquí
}

async function buscarAniversarios(trabajadores) { 
  const hoy = dayjs();
  const enTresDias = hoy.add(3, "day");
  let encontrados = [];

  for (const trabajador of trabajadores) {
    if (!trabajador.fechaEntrada) continue;
    const fechaIngreso = dayjs(trabajador.fechaEntrada);
    let fechaAniversario = fechaIngreso.year(enTresDias.year());
    const nroAniversario = fechaAniversario.diff(fechaIngreso, 'year');
    if (fechaAniversario.isSame(enTresDias, 'day')) {
      const imagen = obtenerImagenesParaAniversario(nroAniversario);
      const info = {
        ...trabajador,
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
  return encontrados;
}

function MensajeMail(nombre, imagen) {
  
  let imagenesTexto = "No disponible";
  if (Array.isArray(imagen) && imagen.length > 0) {
    imagenesTexto = imagen.join("\n");
  } else if (typeof imagen === "string") {
    imagenesTexto = imagen;
  }
  return `¡Hola, ${nombre}!

Se viene una fecha muy especial... ¡tu Crombieversario! 🎂
Queremos agradecerte por ser parte de este camino y por compartir un año más con nosotros. Cada aporte tuyo suma a lo que hacemos día a día y nos hace crecer como equipo 💜
Para celebrarlo, armamos unas placas digitales que podés usar (si queres) para compartir en tus redes. Podés contar alguna reflexión sobre este tiempo en Crombie: aprendizajes, desafíos, alegrías o lo que más te haya marcado 💬 Te dejamos las imágenes abajo en este mail.

Si lo compartís, no te olvides de etiquetarnos para poder celebrarte también desde nuestras redes 🎈
¡Gracias por ser parte de Crombie!

Abrazo,
Equipo de Marketing
${imagenesTexto}
`;
}

module.exports = { aniversarioEmitter, buscarAniversarios, MensajeMail };


/*Lo que tendria que hacer es:
//Extraer informacion desde la API de PeopleForce
// Luego se emiten los eventos y se envian los email
// Antes de enviar los emails, tiene que buscar en la base de datos el mensaje y la imagen correspondiente al trabajador.
// Lo que se envia y se emite se guarda en la base de datos mongoDB compass para guardar un registro de los aniversarios
// Luego se crea un endpoint para consultar los aniversarios pasados y futuros
// También se puede crear un endpoint para consultar los aniversarios de un trabajador específico por su mail*/