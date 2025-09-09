// index.js
const path = require("path");
const axios = require("axios"); // Para hacer peticiones HTTP a tu API local o a PeopleForce
const mongoose = require("mongoose"); 

// Importa las funcionalidades de eventos y la base de datos
const {
  aniversarioEmitter,
  buscarAniversarios,
  MensajeMail,
} = require("./eventos");
const {
  recordSentEmail,
  recordFailedEmail,
  checkIfSentToday,
} = require("./db");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

// --- Configuraciones Iniciales ---

// Crea el transportador de Nodemailer una sola vez, fuera del listener
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Escucha cuando no hay aniversarios próximos
aniversarioEmitter.on("sinAniversarios", () => {
  console.log("No hay trabajadores que cumplan aniversario en 3 días.");
});

// Escucha cuando se detecta un aniversario (solo una vez, fuera del cron)
aniversarioEmitter.on("aniversario", async (empleado) => {
  console.log(
    `¡Aniversario detectado! ${empleado.nombre} (${empleado.nroAniversario} años)`
  );

  // 1. Verificar si el correo ya se envió hoy para este aniversario
  const alreadySent = await checkIfSentToday(
    empleado.nombre,
    empleado.apellido,
    empleado.email,
    empleado.nroAniversario,
    empleado.enviado
  );
  if (alreadySent) {
    console.log(
      `Correo para ${empleado.email} (${empleado.nroAniversario} años) ya fue enviado hoy. Saltando envío.`
    );
    return; // Sale de la función si ya se envió
  }

  // 2. Generar el mensaje del correo (de la base de datos)
  const mensajeHtml = await MensajeMail(
    empleado.nombre,
    empleado.nroAniversario,
    empleado.email
  ); // Adjust MensajeMail to take nroAniversario

  // 3. Preparar los adjuntos de las imágenes (ahora apuntando a tu API de backend)
  let attachments = [];
  // `empleado.imagen` ya contiene la URL firmada de S3 que se generó en eventos.js
  if (empleado.imagen) { // La validación de la longitud de la cadena no es necesaria aquí
    attachments.push({
      filename: `${empleado.nroAniversario}.png`,
      path: empleado.imagen, // Usa la URL firmada directamente
      cid: "aniversario_image",
    });
  } else {
    console.log(
      `No hay imagen configurada para el aniversario de ${empleado.nombre} (${empleado.nroAniversario} años).`
    );
  }

  // 4. Enviar el correo electrónico
  try {
    const info = await transporter.sendMail({
      from: `"Crombie" <${process.env.GMAIL_USER}>`,
      to: empleado.email,
      subject: "🎉 ¡Se viene tu Crombieversario!",
      html: mensajeHtml,
      attachments: attachments, // Adjunta las imágenes
    });
    console.log("Email enviado:", info.messageId);

    // 5. Registrar el envío en la base de datos
    await recordSentEmail(
      empleado.nombre,
      empleado.apellido,
      empleado.mail,
      empleado.nroAniversario
    );
  } catch (error) {
    console.error(
      `Error enviando email o registrando log para ${empleado.email}:`,
      error
    );

    // 6. Registrar los envios fallidos
    await recordFailedEmail(
      empleado.nombre,
      empleado.apellido,
      empleado.mail,
      empleado.nroAniversario,
      error.message
    );
  }
});

// --- Función Principal de Ejecución ---
cron.schedule(
  "00 08 * * 1-5",
  async () => {
    console.log("Ejecutando cron de aniversarios...");

    let trabajadores = [];
    try {
      // Obtener trabajadores de la API local (que simula PeopleForce)
      // Asegúrate de que process.env.PORT y process.env.API_KEY estén definidos en tu .env
      const apiUrl = `${process.env.SERVER_BASE_URL}/trabajadores`;
      const apiKey = process.env.API_KEY;

      if (!apiKey) {
        console.error("Error: API_KEY no definida en .env.");
        return;
      }

      const response = await axios.get(apiUrl, {
        headers: { "x-api-key": apiKey },
      });
      trabajadores = response.data;
      console.log(
        `Se obtuvieron ${trabajadores.length} trabajadores de la API local.`
      );
    } catch (error) {
      console.error(
        "Error al obtener trabajadores de la API local:",
        error.message
      );
      // Si falla la obtención de trabajadores, puedes decidir si salir o continuar con una lista vacía
      // En este caso, continuamos con una lista vacía para que no falle completamente
      console.warn(
        "Continuando la ejecución con una lista de trabajadores vacía debido al error anterior."
      );
    }

    // Buscar y procesar aniversarios con los trabajadores obtenidos, ahora desde PeopleForce
    await buscarAniversarios();

    // Considera cómo terminar el proceso si esto es un script de ejecución única.
    // Si es un servicio cron, puede que quieras que termine automáticamente aquí.
    // Si es parte de una aplicación de más larga duración, esto simplemente termina la tarea.
    console.log("Proceso de detección de aniversarios finalizado.");
    // Si este script es solo para una ejecución única programada, puedes salir:
    // process.exit(0);
  },
  {
    timezone: "America/Argentina/Buenos_Aires",
  }
);
