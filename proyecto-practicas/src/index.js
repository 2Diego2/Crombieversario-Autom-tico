/*3. index.js
Es el archivo principal. Lee los datos, usa las utilidades y emite eventos según la lógica. */
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const axios = require('axios');
const { aniversarioEmitter, buscarAniversarios, MensajeMail } = require("./eventos");
const { connectDB, guardarAniversario } = require("./db");
const nodemailer = require("nodemailer");

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
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD);

// Escucha el evento y guarda el aniversario en la base de datos
aniversarioEmitter.on("aniversario", async (empleado) => {
  const mensaje = MensajeMail(empleado.nombre, empleado.imagen);
  console.log("Mensaje para enviar por mail:");
  console.log(mensaje);
  console.log("--------------------------------------------------");

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  // Adjunta las imágenes
  const attachments = (empleado.imagen || []).map(rutaRelativa => ({
    filename: path.basename(rutaRelativa),
    path: path.join(__dirname, '..', rutaRelativa)
  }));

  try {
    const info = await transporter.sendMail({
      from: `"CrombieVersario" <${process.env.GMAIL_USER}>`,
      to: empleado.mail,
      subject: "🎉 ¡Se viene tu Crombieversario!",
      text: mensaje,
      attachments
    });
    console.log('Email enviado:', info.messageId);
  } catch (error) {
    console.error('Error enviando email:', error);
  }

  await guardarAniversario(empleado);
});

(async () => {
  await connectDB();
  const trabajadores = await obtenerTrabajadoresDeAPI();
  await buscarAniversarios(trabajadores);
})();

//1.Se usa nodemailer para enviar los correos electrónicos. 2.Se creo un JSON con las 19 imagenes de los aniversarios. 3.Se modifico eventos.js para que lea las imagenes desde el JSON y las envie por mail. 4.Se detecta un aniversario y se envia correctamente el texto y la imagen correspondiente.
