<<<<<<< HEAD
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
=======
/*3. index.js
Es el archivo principal. Lee los datos, usa las utilidades y emite eventos según la lógica. */
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const axios = require('axios');
const { aniversarioEmitter, buscarAniversarios, MensajeMail } = require("./eventos");
const { connectDB, guardarAniversario } = require("./db");
>>>>>>> origin/diegorama
const nodemailer = require("nodemailer");
const cron = require("node-cron");

// --- Configuraciones Iniciales ---

<<<<<<< HEAD
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
=======
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
>>>>>>> origin/diegorama

// Escucha cuando no hay aniversarios próximos
aniversarioEmitter.on("sinAniversarios", () => {
  console.log("No hay trabajadores que cumplan aniversario en 3 días.");
});

<<<<<<< HEAD
// Escucha cuando se detecta un aniversario (solo una vez, fuera del cron)
aniversarioEmitter.on("aniversario", async (empleado) => {
  console.log(
    `¡Aniversario detectado! ${empleado.nombre} (${empleado.nroAniversario} años)`
  );

  // 1. Verificar si el correo ya se envió hoy para este aniversario
  const alreadySent = await checkIfSentToday(
    empleado.mail,
    empleado.nroAniversario
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
=======

// Escucha el evento y guarda el aniversario en la base de datos

cron.schedule('06 12 * * 1-5', () => {
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
>>>>>>> origin/diegorama
    }
  });
   
// Adjunta el logo y las imágenes del aniversario
const attachments = [
  ...(empleado.imagen || []).map(rutaRelativa => ({
    filename: path.basename(rutaRelativa),
    path: path.join(__dirname, '..', rutaRelativa)
  }))
];

 try {
      const info = await transporter.sendMail({
        from: `"CrombieVersario" <${process.env.GMAIL_USER}>`,
        to: empleado.mail,
        subject: "🎉 ¡Se viene tu Crombieversario!",
        html:<img src="http://localhost:3000/track?email=destinatario@example.com" alt="" style="display:none;" />,
        attachments
      });

      console.log('Email enviado:', info.messageId);
      
    } catch (error) {
      console.error('Error enviando email:', error);
    }
  });

  (async () => {
    await connectDB();
    const trabajadores = await obtenerTrabajadoresDeAPI();
    await buscarAniversarios(trabajadores);
  })();
}, {
  timezone: "America/Argentina/Buenos_Aires",
});

<<<<<<< HEAD
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
=======
/*¿Cómo vas según los requerimientos del PDF?
Lo que ya tienes:
✔️ Obtención de trabajadores desde una API local (falta PeopleForce real).
✔️ Detección automática de aniversarios próximos (3 días antes).
✔️ Emisión de eventos y generación de mensajes personalizados.
✔️ Envío de emails con imágenes adjuntas según el aniversario (funciona si la red lo permite).
✔️ Guardado de cada aniversario detectado en MongoDB.
✔️ Uso de variables de entorno y configuración segura.
✔️ Automatización diaria con cron (lunes a viernes, 10:05 AM).
Flujo de trabajo: próximos pasos
Integrar la API real de PeopleForce

<input disabled="" type="checkbox"> Reemplaza el array fijo de trabajadores por una consulta real a la API de PeopleForce.
<input disabled="" type="checkbox"> Guarda los datos en tu base o expónlos en el endpoint /trabajadores.
Mejorar el envío de emails

<input disabled="" type="checkbox"> Asegúrate de que el envío de emails funcione en cualquier red (coordina con IT si tu red bloquea puertos SMTP).
<input disabled="" type="checkbox"> Maneja errores de envío y registra los mails fallidos en la base de datos.
Guardar estado de los emails

<input disabled="" type="checkbox"> Guarda en MongoDB si el email fue enviado correctamente o si falló (enviado: true/false, error: mensaje).
Tracking de apertura de emails

<input disabled="" type="checkbox"> Agrega una imagen de tracking (1x1 px) en el cuerpo del email.
<input disabled="" type="checkbox"> Crea un endpoint en tu servidor que reciba la carga de esa imagen y marque el email como leído (leido: true).
Endpoints REST para marketing

<input disabled="" type="checkbox"> /aniversarios → Lista todos los aniversarios registrados.
<input disabled="" type="checkbox"> /aniversarios/futuros → Lista próximos aniversarios.
<input disabled="" type="checkbox"> /aniversarios/:mail → Lista aniversarios de un trabajador específico.
<input disabled="" type="checkbox"> /estadisticas-emails → Devuelve cantidad de emails enviados y abiertos/leídos.
Dashboard de control

<input disabled="" type="checkbox"> (Opcional) Crea una interfaz web (puedes usar tu frontend React) para visualizar:
Estadísticas de emails enviados/abiertos.
Mails enviados y fallidos.
Próximos aniversarios y empleados.*/
>>>>>>> origin/diegorama
