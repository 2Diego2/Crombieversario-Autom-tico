// eventos.js
require("dotenv").config();
const mongoService = require("./db.js");
const EventEmitter = require("events");
const dayjs = require("dayjs");
const weekDay = require("dayjs/plugin/weekday");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");
const axios = require("axios"); // Asegúrate de importar axios si aún no lo has hecho
const S3Client = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require('@aws-sdk/client-s3');

dayjs.extend(weekDay); // Extend dayjs with the weekday plugin

class AniversarioEmitter extends EventEmitter {}
const aniversarioEmitter = new AniversarioEmitter();
const s3 = new S3Client.S3Client({
    region: process.env.AWS_S3_REGION
});
const s3Bucket = process.env.AWS_S3_BUCKET_NAME;

const PEOPLE_API_URL = process.env.PEOPLEFORCE_API_URL;
const PEOPLE_API_KEY = process.env.PEOPLEFORCE_API_KEY;

async function obtenerTrabajadoresPeople() {
  if(!PEOPLE_API_KEY || !PEOPLE_API_URL){
    console.error("Error. Las credenciales de PeopleForce no estan configuradas en el .env");
  }
  try {
    const response = await axios.get(`${PEOPLE_API_URL}`, {
      headers: {
        'Authorization': `Bearer ${PEOPLE_API_KEY}`
      }
    });
    const empleadosDesdeApi = response.data.data;
    //Mapeo de datos.--Estructura de datos de PeopleForce
    const trabajadoresCrombie = empleadosDesdeApi.map(empleado => {
      return {
        nombre: empleado.first_name,
        apellido: empleado.last_name,
        mail: empleado.email,
        fechaEntrada: empleado.hired_date
      };
    });
    console.log(`Se obtuvieron ${trabajadoresCrombie.lenght} trabajadores desde PeopleForce.`);
    return trabajadoresCrombie;
  } catch (error){
    console.log("Fallo la obtencion de datos desde la API de PeopleForce:", error.response ? error.response.data : error.message);
  }
}


async function buscarAniversarios() {
  //Obtiene los trabajadores directamente desde la API
  const trabajadorse = await obtenerTrabajadoresPeople();
  //Si no se obtuvieron trabajadores..  
  if (!trabajadores || trabajadores.length === 0) {
    console.log("No se procesarán aniversarios porque no se obtuvieron trabajadores.");
    aniversarioEmitter.emit("sinAniversarios");
    return;
  }
  //---
  
  const hoy = dayjs().startOf("day");
  let aniversariosProximosEncontrados = 0;

  for (const trabajador of trabajadores) {
    if (!trabajador.fechaEntrada) continue;
    const fechaIngreso = dayjs(trabajador.fechaEntrada);
    if (!fechaIngreso.isValid()) {
      console.warn(
        `[ADVERTENCIA] Fecha de ingreso inválida para ${trabajador.nombre}: ${trabajador.fechaEntrada}. Saltando.`
      );
      continue;
    }

    // Ver si el aniversario es este anio o el que viene
    let aniversarioEsteAno = fechaIngreso.year(hoy.year());
    let nroAniversario = hoy.year() - fechaIngreso.year();

    // Si el aniversario ya pasó este año, considera el aniversario del próximo año 
    // y ajusta el número del aniversario en consecuencia.
    if (aniversarioEsteAno.isBefore(hoy, 'day')) {
      aniversarioEsteAno = fechaIngreso.year(hoy.year() + 1);
      nroAniversario = (hoy.year() + 1) - fechaIngreso.year();
    }

    // --- Lógica para determinar la fecha de envío del correo ---
    let fechaPrevistaEnvio = aniversarioEsteAno.subtract(3, "day").startOf("day");

    // dayjs().weekday() devuelve 0 para el domingo, 1 para el lunes, ..., 6 para el sábado. 
    // Si es sábado o domingo, ajusta al siguiente lunes.
    const diaDeLaSemana = fechaPrevistaEnvio.weekday();

    if (diaDeLaSemana === 6) { // If Saturday
      fechaPrevistaEnvio = fechaPrevistaEnvio.add(2, "day").startOf("day"); // Move to Monday
    } else if (diaDeLaSemana === 0) { // If Sunday
      fechaPrevistaEnvio = fechaPrevistaEnvio.add(1, "day").startOf("day"); // Move to Monday
    }
    
    // Comparar el dia que se debe enviar con el dia de hoy
    if (fechaPrevistaEnvio.isSame(hoy, "day")) {
      aniversariosProximosEncontrados++;
      const imagen = await obtenerImagenesParaAniversario(nroAniversario);
      const info = {
        ...trabajador,
        nroAniversario,
        imagen,
        fechaEnvioProgramada: fechaPrevistaEnvio.toDate(), // Convert dayjs object back to Date if needed by consumer
      };
      aniversarioEmitter.emit("aniversario", info);
    }
  }

  if (aniversariosProximosEncontrados === 0) {
    aniversarioEmitter.emit("sinAniversarios");
  }
}

// MensajeMail ahora obtiene el mensaje editable desde la base de datos
async function MensajeMail(nombre, nroAniversario, empleadoEmail) {
  const { getConfig } = require("./db.js");
  let messageTemplate = "";
  let imageUrlFromDb = "";

  try {
    const config = await getConfig();
    messageTemplate = config.messageTemplate || "";

    const nombreArchivoEsperado = `${nroAniversario}.png`;
    // Asegúrate de que config.imagePaths contiene la URL relativa de la imagen como '/uploads/16.png'
    imageUrlFromDb = (config.imagePaths || []).find(
      (ruta) => ruta.endsWith(`/uploads/${nombreArchivoEsperado}`)
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

  // Reemplaza {{nombre}} en la plantilla completa que viene de la DB
  const mensajeFinalHTML = messageTemplate
    .replace(/{{nombre}}/gi, nombre)
    .replace(/\n/g, "<br>");

  // Codifica el email para que sea seguro en la URL
  const encodedEmail = encodeURIComponent(empleadoEmail);
  const encodedAnniversaryNumber = encodeURIComponent(nroAniversario);

  // URL del pixel de seguimiento. Asegúrate de que el puerto sea el de tu servidor.
  // ---------------Usando Ngrok para pruebas-------------------------------------------------
  // Reemplaza 'https://5cc18fce34b8.ngrok-free.app' con la URL que te da ngrok en tu terminal
  // Asegurarte de que server.js esté corriendo.
  // Ejecutar ngrok http 3033 (o el puerto de tu servidor).
  // ngrok te dará una nueva URL pública.
  // Tendrás que actualizar esa nueva URL en tu archivo .env (la variable API_BASE_URL) para que los correos que envíes usen la URL correcta de ngrok para esa sesión.
  //const trackingPixelUrl = `http://localhost:${process.env.PORT || 3033}/track/${encodedEmail}/${encodedAnniversaryNumber}`;
  //const trackingPixelUrl = `https://7c5beb79e7f1.ngrok-free.app/track/${encodedEmail}/${encodedAnniversaryNumber}`;
 
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    console.error("ERROR: La variable API_BASE_URL no está definida en el archivo .env");
    // Puedes decidir cómo manejar este error, quizás devolviendo el HTML sin el pixel.
  }

  const trackingPixelUrl = `${baseUrl}/track/${encodedEmail}/${encodedAnniversaryNumber}`;

  console.log(`URL del pixel generada: ${trackingPixelUrl}`);
  
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
  <img src="${trackingPixelUrl}" width="1" height="1" alt="" border="0" style="border:0; margin:0; padding:0; line-height:0;" >
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
        
        // La clave S3 está guardada en la base de datos como 'uploads/5.png', 'uploads/6.png', etc.
        const nombreArchivoEsperado = `${nroAniversario}.png`;
        const imageUrl = (config.imagePaths || []).find(
            (ruta) => ruta.endsWith(`/uploads/${nombreArchivoEsperado}`)
        );

    if (imageUrl) {
        // La URL ya es pública, la devolvemos directamente
        return imageUrl;
    } else {
        console.warn(`[ADVERTENCIA] No se encontró una imagen para el aniversario ${nroAniversario} años en la configuración.`);
        return null;
    }
    } catch (error) {
        console.error("Error al obtener la imagen para aniversario:", error);
        return null;
    }
}

module.exports = { aniversarioEmitter, buscarAniversarios, MensajeMail };