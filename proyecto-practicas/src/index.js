// index.js
const path = require("path");
require('dotenv').config(); // Carga las variables de entorno al inicio
const axios = require('axios'); // Para hacer peticiones HTTP a tu API local o a PeopleForce

// Importa las funcionalidades de eventos y la base de datos
const { aniversarioEmitter, buscarAniversarios, MensajeMail } = require("./eventos");
const { connectDB, recordSentEmail, checkIfSentToday } = require("./db"); // Asegúrate de importar checkIfSentToday también
const nodemailer = require("nodemailer");

// --- Configuraciones Iniciales ---

// Crea el transportador de Nodemailer una sola vez, fuera del listener
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Escucha cuando no hay aniversarios próximos
aniversarioEmitter.on("sinAniversarios", () => {
  console.log("No hay trabajadores que cumplan aniversario en 3 días.");
});

// Escucha cuando se detecta un aniversario
aniversarioEmitter.on("aniversario", async (empleado) => {
  console.log(`¡Aniversario detectado! ${empleado.nombre} (${empleado.nroAniversario} años)`);

  // 1. Verificar si el correo ya se envió hoy para este aniversario
  const alreadySent = await checkIfSentToday(empleado.mail, empleado.nroAniversario);
  if (alreadySent) {
    console.log(`Correo para ${empleado.mail} (${empleado.nroAniversario} años) ya fue enviado hoy. Saltando envío.`);
    return; // Sale de la función si ya se envió
  }

  // 2. Generar el mensaje del correo
  const mensaje = MensajeMail(empleado.nombre, empleado.imagen);

  // 3. Preparar los adjuntos de las imágenes
  const attachments = (empleado.imagen || []).map(rutaRelativa => ({
    filename: path.basename(rutaRelativa), // Nombre del archivo para el adjunto
    path: path.join(__dirname, '..', rutaRelativa) // Ruta completa al archivo de imagen
  }));

  // 4. Enviar el correo electrónico
  try {
    const info = await transporter.sendMail({
      from: `"Crombie" <${process.env.GMAIL_USER}>`,
      to: empleado.mail,
      subject: "🎉 ¡Se viene tu Crombieversario!",
      text: mensaje,
      attachments // Adjunta las imágenes
    });
    console.log('Email enviado:', info.messageId);

    // 5. Registrar el envío en la base de datos
    await recordSentEmail(empleado.mail, empleado.nroAniversario);
  } catch (error) {
    console.error(`Error enviando email o registrando log para ${empleado.mail}:`, error);
  }
});

// --- Función Principal de Ejecución ---

(async () => {
  // Conectar a la base de datos
  await connectDB();
  console.log('Base de datos conectada para la ejecución principal.');

  let trabajadores = [];
  try {
    // Obtener trabajadores de la API local (que simula PeopleForce)
    // Asegúrate de que process.env.PORT y process.env.API_KEY estén definidos en tu .env
    const apiUrl = `http://localhost:${process.env.PORT || 3033}/trabajadores`;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error('Error: API_KEY no definida en .env. No se pueden obtener trabajadores.');
      process.exit(1); // Sale si no hay API_KEY para la llamada
    }

    const response = await axios.get(apiUrl, {
      headers: { 'x-api-key': apiKey }
    });
    trabajadores = response.data;
    console.log(`Se obtuvieron ${trabajadores.length} trabajadores de la API local.`);

  } catch (error) {
    console.error('Error al obtener trabajadores de la API local:', error.message);
    // Si falla la obtención de trabajadores, puedes decidir si salir o continuar con una lista vacía
    // En este caso, continuamos con una lista vacía para que no falle completamente
    console.warn('Continuando la ejecución con una lista de trabajadores vacía debido al error anterior.');
  }

  // Buscar y procesar aniversarios con los trabajadores obtenidos
  await buscarAniversarios(trabajadores);

  // Considera cómo terminar el proceso si esto es un script de ejecución única.
  // Si es un servicio cron, puede que quieras que termine automáticamente aquí.
  // Si es parte de una aplicación de más larga duración, esto simplemente termina la tarea.
  console.log('Proceso de detección de aniversarios finalizado.');
  // Si este script es solo para una ejecución única programada, puedes salir:
  // process.exit(0);
})();