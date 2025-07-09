// eventos.js
/*Define y exporta los eventos personalizados usando 
EventEmitter. Aquí puedes manejar lo que ocurre cuando se detecta un aniversario */

require('dotenv').config();
const mongoService = require('./db.js');

/*import { Injectable, Logger } from '@nestjs/common';
import { Cron } from 'nestjs/schedule';*/

// const { connectDB, obtenerTrabajadores } = require('./db');

const EventEmitter = require("events");
const dayjs = require("dayjs");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");
// const imagenesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/imagenes.json'), 'utf-8'));

class AniversarioEmitter extends EventEmitter {}
const aniversarioEmitter = new AniversarioEmitter();

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
    const nroAniversario = fechaAniversario.diff(fechaIngreso, 'year');
    if (fechaAniversario.isSame(enTresDias, 'day')) {
      const imagen = await obtenerImagenesParaAniversario(nroAniversario);
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

// MensajeMail ahora obtiene el mensaje editable desde la base de datos
async function MensajeMail(nombre, imagen) {
  const { getConfig } = require('./db.js');
  let imagenesTexto = "No disponible";
  if (Array.isArray(imagen) && imagen.length > 0) {
    imagenesTexto = imagen.join("\n");
  } else if (typeof imagen === "string") {
    imagenesTexto = imagen;
  }
  // Obtiene el mensaje editable de la base de datos
  let messageTemplate = '';
  try {
    const config = await getConfig();
    messageTemplate = config.messageTemplate || '';
  } catch (e) {
    messageTemplate = `¡Hola, ${nombre}!\n\n(No se pudo obtener el mensaje editable de la base de datos)\n`;
  }
  // Reemplaza {{nombre}} por el nombre real
  const mensajeFinal = messageTemplate.replace(/{{nombre}}/gi, nombre) + "\n" + (imagenesTexto || "No disponible");
  return mensajeFinal;
}

// Ahora, para los aniversarios, busca la imagen en la base de datos (config.imagePaths)
async function obtenerImagenesParaAniversario(nroAniversario) {
  const { getConfig } = require('./db.js');
  try {
    const config = await getConfig();
    // Busca la imagen correspondiente por nombre
    const nombreArchivo = `${nroAniversario}.png`;
    const ruta = (config.imagePaths || []).find(ruta => ruta.includes(nombreArchivo));
    return ruta ? [ruta] : [];
  } catch (e) {
    return [];
  }
}

module.exports = { aniversarioEmitter, buscarAniversarios, MensajeMail };

