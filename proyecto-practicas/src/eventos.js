// eventos.js
/*Define y exporta los eventos personalizados usando 
EventEmitter. Aquí puedes manejar lo que ocurre cuando se detecta un aniversario */
<<<<<<< HEAD

require("dotenv").config();
const mongoService = require("./db.js");

/*import { Injectable, Logger } from '@nestjs/common';
import { Cron } from 'nestjs/schedule';*/

// const { connectDB, obtenerTrabajadores } = require('./db');

const EventEmitter = require("events");
const dayjs = require("dayjs");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");
// const imagenesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/imagenes.json'), 'utf-8'));
=======
const EventEmitter = require("events");
const dayjs = require("dayjs");
const path = require("path");
require('dotenv').config();

const mongoService = require('./db.js');
>>>>>>> origin/diegorama

class AniversarioEmitter extends EventEmitter {}
const aniversarioEmitter = new AniversarioEmitter();

<<<<<<< HEAD
// Elimina la dependencia de imagenes.json para la gestión diaria
// (Solo se usa para precarga inicial si se desea)
// El resto de la lógica de imágenes se gestiona desde la base de datos y la interfaz

async function buscarAniversarios(trabajadores) {
  const hoy = dayjs();
  const enTresDias = hoy.add(3, "day");
  let encontrados = [];

  for (const trabajador of trabajadores) {
    if (!trabajador.fechaEntrada) continue;
    const fechaIngreso = dayjs(trabajador.fechaEntrada);
    let fechaAniversario = fechaIngreso.year(enTresDias.year());
    const nroAniversario = fechaAniversario.diff(fechaIngreso, "year");
    if (fechaAniversario.isSame(enTresDias, "day")) {
      const imagen = await obtenerImagenesParaAniversario(nroAniversario);
      const info = {
        ...trabajador,
        nroAniversario,
        imagen,
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

// MensajeMail ahora obtiene el mensaje editable desde la base de datos
async function MensajeMail(nombre, nroAniversario) {
  const { getConfig } = require("./db.js");
  let messageTemplate = "";
  let imageUrlFromDb = "";
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

async function inicializarDB() {
  await mongoService.connectDB();
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
>>>>>>> origin/diegorama

Se viene una fecha muy especial... ¡tu Crombieversario! 🎂
Queremos agradecerte por ser parte de este camino y por compartir un año más con nosotros. Cada aporte tuyo suma a lo que hacemos día a día y nos hace crecer como equipo 💜
Para celebrarlo, armamos unas placas digitales que podés usar (si queres) para compartir en tus redes. Podés contar alguna reflexión sobre este tiempo en Crombie: aprendizajes, desafíos, alegrías o lo que más te haya marcado 💬 Te dejamos las imágenes abajo en este mail.

Si lo compartís, no te olvides de etiquetarnos para poder celebrarte también desde nuestras redes 🎈
¡Gracias por ser parte de Crombie!

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

module.exports = { aniversarioEmitter, buscarAniversarios, MensajeMail };
=======
Abrazo,
Equipo de Marketing
${imagen ? imagen : "No disponible"}
`;
}

module.exports = { aniversarioEmitter, buscarAniversarios, MensajeMail, inicializarDB };

>>>>>>> origin/diegorama
