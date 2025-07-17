// index.js
require("dotenv").config(); // Carga las variables de entorno al inicio
const path = require("path");
const fs = require("fs");
const axios = require("axios"); // Para hacer peticiones HTTP a tu API local o a PeopleForce

// Importa las funcionalidades de eventos y la base de datos
const {
  aniversarioEmitter,
  buscarAniversarios,
  MensajeMail,
} = require("./eventos");
const { connectDB, recordSentEmail, checkIfSentToday } = require("./db"); // Asegúrate de importar checkIfSentToday también
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
    empleado.mail,
    empleado.nroAniversario,
    empleado.enviado
  );
  if (alreadySent) {
    console.log(
      `Correo para ${empleado.mail} (${empleado.nroAniversario} años) ya fue enviado hoy. Saltando envío.`
    );
    return; // Sale de la función si ya se envió
  }

  // 2. Generar el mensaje del correo (de la base de datos)
  const mensajeHtml = await MensajeMail(empleado.nombre, empleado.nroAniversario); // Adjust MensajeMail to take nroAniversario

  // 3. Preparar los adjuntos de las imágenes (de la base de datos)
  let attachments = [];
  if (empleado.imagen && empleado.imagen.length > 0) {
    const UPLOADS_PHYSICAL_DIR = path.resolve(
      __dirname,
      "..",
      "public",
      "uploads"
    );

    const imageRelativeUrl = empleado.imagen[0];
    const imageFileName = path.basename(imageRelativeUrl);
    const physicalImagePath = path.join(UPLOADS_PHYSICAL_DIR, imageFileName);

console.log(`[DEBUG PATH] Intentando leer imagen desde esta ruta: "${physicalImagePath}"`);

    if (fs.existsSync(physicalImagePath)) {
      attachments.push({
        filename: imageFileName,
        path: physicalImagePath,
        cid: "aniversario_image",
      });
    } else {
      console.warn(
        `[ERROR] Imagen física no encontrada en: ${physicalImagePath}. No se adjuntará la imagen al correo.`
      );
    }
  } else {
    console.log(
      `No hay imagen configurada para el aniversario de ${empleado.nombre} (${empleado.nroAniversario} años).`
    );
  }

  // 4. Enviar el correo electrónico
  try {
    const info = await transporter.sendMail({
      from: `"Crombie" <${process.env.GMAIL_USER}>`,
      to: empleado.mail,
      subject: "🎉 ¡Se viene tu Crombieversario!",
      html: mensajeHtml,
      attachments: attachments // Adjunta las imágenes
    });
    console.log("Email enviado:", info.messageId);
    // 5. Registrar el envío en la base de datos
    await recordSentEmail(empleado.nombre,empleado.apellido,empleado.mail, empleado.nroAniversario);
  } catch (error) {
    console.error(
      `Error enviando email o registrando log para ${empleado.mail}:`,
      error
    );
  }

});

// --- Función Principal de Ejecución ---
cron.schedule(  "33 10 * * 1-5", async () => {
    // Conectar a la base de datos
    await connectDB();
    console.log("Base de datos conectada para la ejecución principal.");

    let trabajadores = [];
    try {
      // Obtener trabajadores de la API local (que simula PeopleForce)
      // Asegúrate de que process.env.PORT y process.env.API_KEY estén definidos en tu .env
      const apiUrl = `http://localhost:${process.env.PORT || 3033
        }/trabajadores`;
      const apiKey = process.env.API_KEY;

      if (!apiKey) {
        console.error(
          "Error: API_KEY no definida en .env. No se pueden obtener trabajadores."
        );
        process.exit(1); // Sale si no hay API_KEY para la llamada
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

    // Buscar y procesar aniversarios con los trabajadores obtenidos
    await buscarAniversarios(trabajadores);

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
