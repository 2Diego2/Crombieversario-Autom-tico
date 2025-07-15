// eventos.js
/*Define y exporta los eventos personalizados usando 
EventEmitter. Aquí puedes manejar lo que ocurre cuando se detecta un aniversario */

<<<<<<< HEAD
require("dotenv").config();
const mongoService = require("./db.js");

/*import { Injectable, Logger } from '@nestjs/common';
import { Cron } from 'nestjs/schedule';*/

// const { connectDB, obtenerTrabajadores } = require('./db');
=======
require('dotenv').config();
const mongoService = require('./db.js');

const { connectDB, obtenerTrabajadores } = require('./db');
>>>>>>> 58d5dbf9e0949c2f51a0099778e72f08de2249b0

const EventEmitter = require("events");
const dayjs = require("dayjs");
const path = require("path");
<<<<<<< HEAD
const nodemailer = require("nodemailer");
const fs = require("fs");
// const imagenesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/imagenes.json'), 'utf-8'));
=======
>>>>>>> 58d5dbf9e0949c2f51a0099778e72f08de2249b0

class AniversarioEmitter extends EventEmitter {}
const aniversarioEmitter = new AniversarioEmitter();

<<<<<<< HEAD
// Elimina la dependencia de imagenes.json para la gestión diaria
// (Solo se usa para precarga inicial si se desea)
// El resto de la lógica de imágenes se gestiona desde la base de datos y la interfaz
=======
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
>>>>>>> 58d5dbf9e0949c2f51a0099778e72f08de2249b0

async function buscarAniversarios(trabajadores) {
  const hoy = dayjs();
  const enTresDias = hoy.add(3, "day");
  let encontrados = [];

  for (const trabajador of trabajadores) {
    if (!trabajador.fechaEntrada) continue;
    const fechaIngreso = dayjs(trabajador.fechaEntrada);
    let fechaAniversario = fechaIngreso.year(enTresDias.year());
<<<<<<< HEAD
    const nroAniversario = fechaAniversario.diff(fechaIngreso, "year");
    if (fechaAniversario.isSame(enTresDias, "day")) {
      const imagen = await obtenerImagenesParaAniversario(nroAniversario);
      const info = {
        ...trabajador,
        nroAniversario,
        imagen,
=======
    const nroAniversario = fechaAniversario.diff(fechaIngreso, 'year');
    if (fechaAniversario.isSame(enTresDias, 'day')) {
      const imagen = imagenesAniversario[nroAniversario] || [];
      const info = {
        ...trabajador,
        nroAniversario,
        imagen
>>>>>>> 58d5dbf9e0949c2f51a0099778e72f08de2249b0
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

<<<<<<< HEAD
// MensajeMail ahora obtiene el mensaje editable desde la base de datos
async function MensajeMail(nombre, nroAniversario) {
  const { getConfig } = require("./db.js");
  let messageTemplate = "";
  let imageUrlFromDb = "";
=======
function MensajeMail(nombre, imagen) {
  let imagenesTexto = "No disponible";
  if (Array.isArray(imagen) && imagen.length > 0) {
    imagenesTexto = imagen.join("\n");
  } else if (typeof imagen === "string") {
    imagenesTexto = imagen;
  }
  return `¡Hola, ${nombre}!
>>>>>>> 58d5dbf9e0949c2f51a0099778e72f08de2249b0

  try {
    const config = await getConfig();
    messageTemplate = config.messageTemplate || "";

    const nombreArchivoEsperado = `${nroAniversario}.png`;
    // Asegúrate de que config.imagePaths contiene la URL relativa de la imagen como '/uploads/16.png'
    imageUrlFromDb = (config.imagePaths || []).find(
      (ruta) => path.basename(ruta) === nombreArchivoEsperado
    );
    if (!imageUrlFromDb) {
      console.warn(
        `No se encontró URL de imagen para ${nroAniversario} años en la DB.`
      );
    }
  } catch (e) {
    console.error("Error al obtener configuración de DB para mensaje:", e);
    // Fallback message if DB config fails
    messageTemplate = `¡Hola, {{nombre}}!\n\nSe viene una fecha muy especial... ¡tu Crombieversario! 🎂\nQueremos agradecerte por ser parte de este camino y por compartir un año más con nosotros. Cada aporte tuyo suma a lo que hacemos día a día y nos hace crecer como equipo 💜\nPara celebrarlo, armamos unas placas digitales que podés usar (si queres) para compartir en tus redes. Podés contar alguna reflexión sobre este tiempo en Crombie: aprendizajes, desafíos, alegrías o lo que más te haya marcado 💬 Te dejamos las imágenes abajo en este mail.\n\nSi lo compartís, no te olvides de etiquetarnos para poder celebrarte también desde nuestras redes 🎈\n¡Gracias por ser parte de Crombie!\n\nAbrazo,\nEquipo de Marketing`;
  }

<<<<<<< HEAD
  // Reemplaza {{nombre}} en la plantilla completa que viene de la DB
  const mensajeFinalHTML = messageTemplate
    .replace(/{{nombre}}/gi, nombre)
    .replace(/\n/g, "<br>");

  let htmlContent = `
        <html>
        <body>
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                ${mensajeFinalHTML} 
    `; // Inserta todo el mensaje final aquí

  // Aquí insertamos la imagen, después de todo el contenido de la plantilla
  if (imageUrlFromDb) {
    // Asegúrate que 'aniversario_image' sea el mismo CID que usas en index.js en los attachments.
    htmlContent += `<p><img src="cid:aniversario_image" alt="Aniversario Crombie" style="max-width: 100%; height: auto; display: block; margin: 20px auto;"></p>`;
  }

  htmlContent += `
            </div>
        </body>
        </html>
    `;
  return htmlContent;
}

// Ahora, para los aniversarios, busca la imagen en la base de datos (config.imagePaths)
async function obtenerImagenesParaAniversario(nroAniversario) {
  const { getConfig } = require("./db.js");
  try {
    const config = await getConfig();
    // Busca la imagen correspondiente por nombre
    const nombreArchivo = `${nroAniversario}.png`;
    const ruta = (config.imagePaths || []).find((ruta) =>
      ruta.includes(nombreArchivo)
    );
    return ruta ? [ruta] : [];
  } catch (e) {
    return [];
  }
}
=======
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






>>>>>>> 58d5dbf9e0949c2f51a0099778e72f08de2249b0

module.exports = { aniversarioEmitter, buscarAniversarios, MensajeMail };
