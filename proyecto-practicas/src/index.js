/*3. index.js
Es el archivo principal. Lee los datos, usa las utilidades y emite eventos según la lógica. */
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const axios = require('axios');
const { aniversarioEmitter, buscarAniversarios, MensajeMail } = require("./eventos");
const { connectDB, guardarAniversario } = require("./db");

// Función para obtener trabajadores desde la API
async function obtenerTrabajadoresDeAPI() {
  try {
    const response = await axios.get('http://localhost:3033/trabajadores', {
      headers: {
        'x-api-key': process.env.API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al consumir la API:', error.message);
    return [];
  }
}

aniversarioEmitter.on("sinAniversarios", () => {
  console.log("No hay trabajadores que cumplan aniversario en 3 días.");
});

// Escucha el evento y guarda el aniversario en la base de datos
aniversarioEmitter.on("aniversario", async (empleado) => {
  console.log(`El trabajador ${empleado.nombre} (${empleado.mail}) cumplirá su aniversario número ${empleado.nroAniversario}° en 3 días.`);
  const mensaje = MensajeMail(empleado.nombre, empleado.imagen);
  console.log("Mensaje para enviar por mail:");
  console.log(mensaje);
  console.log("--------------------------------------------------");
  await guardarAniversario(empleado); // <-- Guarda el evento en MongoDB
});

(async () => {
  await connectDB();
  const trabajadores = await obtenerTrabajadoresDeAPI();
  await buscarAniversarios(trabajadores);
})();