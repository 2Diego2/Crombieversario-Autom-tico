// db.js
const mongoose = require('mongoose');

// *Definición de Esquemas y Modelos*

// Esquema para Colaboradores
// Este esquema define la estructura de los documentos en tu colección 'collaborators'
/*const collaboratorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // 'unique: true' asegura que no haya emails duplicados
    entryDate: { type: Date, required: true }, // Guardamos la fecha como tipo Date de JS
});*/
//const Collaborator = mongoose.model('Collaborator', collaboratorSchema); // Crea un modelo a partir del esquema

// Esquema para Logs de Correos Enviados
// Este esquema define la estructura de los documentos en tu colección 'sent_logs'
const sentLogSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true },
    years: { type: Number, required: true },
    enviado: {type: Boolean, default: false},
    opened: { type:Boolean,default: false },
    sentDate: { type: Date, default: Date.now }, // Fecha de envío, por defecto la fecha actual
}, { timestamps: true }); // 'timestamps: true' añade 'createdAt' y 'updatedAt' automáticamente
const SentLog = mongoose.model('sentlog', sentLogSchema);

const configSchema = new mongoose.Schema({
    // Podrías tener un único documento de configuración, por eso el `name`
    name: { type: String, required: true, unique: true, default: 'main_config' },
    messageTemplate: { type: String, required: true },
    // Si las imágenes son fijas y solo se seleccionan, guardas sus rutas aquí.
    // Si la gestión es más dinámica (subir nuevas), necesitarías otro enfoque.
    imagePaths: [{ type: String }], // Array de rutas de imágenes
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true }); // Añade createdAt y updatedAt

const failedEmailLogSchema = new mongoose.Schema({
email: { type: String, required: true },
years: { type: Number, required: true },
attemptDate: { type: Date, default: Date.now },
errorMessage: { type: String },
status: { type: String, default: 'failed' } 
}, { timestamps: true });
const FailedEmailLog = mongoose.model('FailedEmailLog', failedEmailLogSchema);

const Config = mongoose.model('Config', configSchema);

// *Función de Conexión a la Base de Datos*

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // Opciones recomendadas para Mongoose 6+
            // ya no son necesarias en las versiones más recientes,
            // pero pueden usarse para compatibilidad o configuración avanzada
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true, // Esto es para 'unique: true'
            // useFindAndModify: false // Esto es para métodos de actualización/eliminación
        });
        console.log('MongoDB conectado exitosamente');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error.message);
        process.exit(1); // Sale de la aplicación si no puede conectar a la DB
    }
}

// *Operaciones Básicas para Logs*

/**
 * Guarda un registro de correo enviado en la base de datos.
 * @param {string} nombre - Nombre
 * @param {string} apellido - Apellido
 * @param {string} email - Correo del colaborador.
 * @param {number} years - Años de aniversario.
 * @param {boolean} enviado - Si fue enviado o no.
 */
async function recordSentEmail(nombre, apellido, email, years, enviado = true) {
    try {
        const newLog = new SentLog({nombre, apellido, email, years, enviado });
        await newLog.save();
        console.log(`Log de envío registrado en DB para ${nombre} ${apellido} ${email} (${years} años). enviado=${enviado}`);
    } catch (error) {
        console.error(`Error al registrar log de envío para ${email}: ${error.message}`);    }
}

/**
 * Verifica si ya se envió un correo para un aniversario específico hoy.
 * @param {string} nombre - Nombre
 * @param {string} apellido - Apellido
 * @param {string} email - Correo del colaborador.
 * @param {number} years - Años de aniversario.
 * @param {boolean} enviado
 */
async function checkIfSentToday(nombre, apellido, email, years) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer a la medianoche de hoy

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Medianoche de mañana

    try {
        const log = await SentLog.findOne({
            nombre: nombre,
            apellido: apellido,
            email: email,
            years: years,
            enviado: true, // Se convierte a true
            sentDate: {
                $gte: today,    // Greater than or equal to today's midnight
                $lt: tomorrow   // Less than tomorrow's midnight
            }
        });
        return !!log; // Devuelve true si se encontró un log, false si no
    } catch (error) {
        console.error(`Error al verificar log de envío para ${email}:, error.message`);
        return false;
    }
}

async function getConfig() {
    try {
        // Busca el único documento de configuración (o crea uno si no existe)
        let config = await Config.findOne({ name: 'main_config' });
        if (!config) {
            // Si no existe, crea una configuración por defecto
            config = new Config({
                name: 'main_config',
                messageTemplate: '¡Hola, {{nombre}}!\n\nSe viene una fecha muy especial... ¡tu Crombieversario! 🎂\nQueremos agradecerte por ser parte de este camino y por compartir un año más con nosotros. Cada aporte tuyo suma a lo que hacemos día a día y nos hace crecer como equipo 💜\nPara celebrarlo, armamos unas placas digitales que podés usar (si queres) para compartir en tus redes. Podés contar alguna reflexión sobre este tiempo en Crombie: aprendizajes, desafíos, alegrías o lo que más te haya marcado 💬 Te dejamos las imágenes abajo en este mail.\n\nSi lo compartís, no te olvides de etiquetarnos para poder celebrarte también desde nuestras redes 🎈\n¡Gracias por ser parte de Crombie!\n\nAbrazo,\nEquipo de Marketing',
                imagePaths: [] // Puedes precargar algunas rutas si ya las tienes
            });
            await config.save();
            console.log('Configuración por defecto creada en DB.');
        }
        return config;
    } catch (error) {
        console.error('Error al obtener/crear configuración:', error.message);
        throw error;
    }
}

async function updateConfig(messageTemplate, imagePaths) {
    try {
        const config = await Config.findOneAndUpdate(
            { name: 'main_config' },
            { messageTemplate, imagePaths, lastUpdated: Date.now() },
            { new: true, upsert: true, setDefaultsOnInsert: true } // new: true devuelve el doc actualizado; upsert: true crea si no existe
        );
        console.log('Configuración actualizada en DB.');
        return config;
    } catch (error) {
        console.error('Error al actualizar configuración:', error.message);
        throw error;
    }
}

async function recordFailedEmail(email, years, errorMessage) {
    try {
        const newFailedLog = new FailedEmailLog({ email, years, errorMessage });
        await newFailedLog.save();
        console.error(`Log de envío fallido registrado en DB para ${email} (${years} años): ${errorMessage}`);
    } catch (error) {
        console.error(`Error al registrar log de envío fallido para ${email}: ${error.message}`);
    }
}

// Add a function to get failed emails for retry attempts
async function getFailedEmailsToRetry() {
    try {
        // Fetch emails that failed, for example, within the last 24 hours and haven't been successfully retried
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const failedEmails = await FailedEmailLog.find({
            status: 'failed',
            attemptDate: { $gte: twentyFourHoursAgo }
        }).limit(50); // Limit to avoid overwhelming retries
        return failedEmails;
    } catch (error) {
        console.error('Error al obtener emails fallidos para reintento:', error.message);
        return [];
    }
}

async function updateFailedEmailStatus(logId, newStatus) {
    try {
        await FailedEmailLog.findByIdAndUpdate(logId, { status: newStatus });
        console.log(`Estado del log de email fallido ${logId} actualizado a ${newStatus}.`);
    } catch (error) {
        console.error(`Error al actualizar estado del log de email fallido ${logId}:`, error.message);
    }
}


// db.js - Versión para depuración

async function recordEmailOpen(email, years) {
    console.log('--- Iniciando recordEmailOpen ---');
    console.log(`Recibido: email=${email}, tipo=${typeof email}`);
    console.log(`Recibido: years=${years}, tipo=${typeof years}`);

    const numericYears = parseInt(years);
    if (isNaN(numericYears)) {
        console.error('ERROR: "years" no es un número válido. Saliendo.');
        return;
    }

    const query = {
        email: email,
        years: numericYears,
        opened: false
    };

    console.log('Ejecutando findOneAndUpdate con la siguiente consulta:', query);

    try {
        const updatedLog = await SentLog.findOneAndUpdate(
            query,
            {
                $set: {
                    opened: true,
                    openedAt: new Date()
                }
            },
            {
                new: true,
                sort: { sentDate: -1 }
            }
        );

        if (updatedLog) {
            console.log('✅ ÉXITO: Documento actualizado en la BD:', updatedLog);
        } else {
            console.warn('⚠️ ADVERTENCIA: No se encontró ningún documento que coincida con la consulta. Verifique los datos en la colección "sentlogs".');
            // Como extra, busca si ya fue abierto
            const alreadyOpened = await SentLog.findOne({ email: email, years: numericYears, opened: true }).sort({ sentDate: -1 });
            if (alreadyOpened) {
                console.log('INFO: Se encontró un registro que ya estaba marcado como abierto.');
            }
        }
    } catch (error) {
        console.error(`❌ ERROR GRAVE al ejecutar la consulta en la BD: ${error.message}`);
    }
}

async function getYearlyEmailStats() {
    try {
        const stats = await SentLog.aggregate([
            {
                // Paso 1: Asegurarse de que 'sentDate' existe y es de tipo 'date'
                $match: {
                    sentDate: { $exists: true, $type: "date" } 
                }
            },
            {
                $group: {
                    _id: { $year: "$sentDate" }, // Agrupa por el año de la fecha de envío
                    sent: { $sum: 1 }, // Cada documento en SentLog representa un email enviado
                    opened: {
                        $sum: {
                            $cond: [{ $eq: ["$opened", true] }, 1, 0] // Suma 1 si 'opened' es true
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0, // Excluye el campo _id del resultado final
                    year: "$_id", // Renombra _id (que es el año) a 'year'
                    sent: 1, // Incluye el conteo de enviados
                    opened: 1 // Incluye el conteo de abiertos
                }
            },
            {
                $sort: { year: 1 } // Ordena los resultados por año ascendente
            }
        ]);
        console.log('Estadísticas anuales de email obtenidas:', stats);
        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas anuales de email (MongoDB):', error.message);
        throw error; // Propaga el error para que sea manejado en el endpoint
    }
}




  async function getMonthlyEmailStats(year) {
  try {
    const stats = await SentLog.aggregate([
      // 1) Selecciona sólo documentos con sentDate válido
      {
        $match: {
          sentDate: { $exists: true, $type: "date" }
        }
      },
      // 2) Agrupa por año y mes del sentDate
      {
        $group: {
          _id: {
            year:  { $year:  "$sentDate" },
            month: { $month: "$sentDate" }
          },
          sent:   { $sum: 1 },
          opened: {
            $sum: {
              $cond: [{ $eq: ["$opened", true] }, 1, 0]
            }
          },
          unread: {
            // Cuenta los no leídos: opened === false
            $sum: {
              $cond: [{ $eq: ["$opened", false] }, 1, 0]
            }
          }
        }
      },
      // 3) Proyecta los campos que te interesan
      {
        $project: {
          _id:    0,
          year:   "$_id.year",
          month:  "$_id.month",
          sent:   1,
          opened: 1,
          unread: 1
        }
      },
      // 4) Ordena por año y mes ascendente
      /*  { 
        $sort: { year: 1, month: 1 }
      } */

  ]); 

    console.log('Estadísticas mensuales de email obtenidas:', stats);
    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas mensuales de email:', error.message);
    throw error;
  }
} 

async function getLast7DaysTotals() {
  try {
    const end   = new Date();                // ahora
    const start = new Date(end);            
    start.setDate(end.getDate() - 6);        // hace 6 días, para cubrir 7 jornadas (incluye hoy)

    const stats = await SentLog.aggregate([
      {
        $match: {
          sentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          sent: {
            $sum: 1
          },
          opened: {
            $sum: { $cond: [{ $eq: ["$opened", true] }, 1, 0] }
          },
          unread: {
            $sum: { $cond: [{ $eq: ["$opened", false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          sent: 1,
          opened: 1,
          unread: 1
        }
      }
    ]);
    
    console.log('Estadísticas de la semana obtenidas:', stats);
    return stats[0] || { sent: 0, opened: 0, unread: 0 };
  } catch (err) {
    console.error("Error al obtener totales últimos 7 días:", err);
    throw err;
  }
}

// *Operaciones Básicas para Colaboradores (si decides migrarlos a la DB)*

/**
 * Guarda o actualiza un colaborador en la base de datos.
 * @param {Object} collabData - Objeto con los datos del colaborador.
 * @returns {Object} - El documento del colaborador guardado/actualizado.
 */
/*async function saveOrUpdateCollaborator(collabData) {
    try {
        // Busca si el colaborador ya existe por email
        const existingCollab = await Collaborator.findOne({ email: collabData.email });

        if (existingCollab) {
            // Actualiza los datos si ya existe
            Object.assign(existingCollab, collabData);
            await existingCollab.save();
            console.log(`Colaborador ${collabData.email} actualizado en DB.`);
            return existingCollab;
        } else {
            // Crea un nuevo colaborador si no existe
            const newCollab = new Collaborator(collabData);
            await newCollab.save();
            console.log(`Colaborador ${collabData.email} guardado en DB.`);
            return newCollab;
        }
    } catch (error) {
        console.error(`Error al guardar/actualizar colaborador ${collabData.email}:, error.message`);
        throw error; // Propaga el error para manejo externo
    }
} */

/**
 * Obtiene todos los colaboradores de la base de datos.
 * @returns {Array<Object>} - Lista de colaboradores.
 */
 /*async function getAllCollaborators() {
    try {
        const collaborators = await Collaborator.find({});
        console.log(`Extraídos ${collaborators.length} colaboradores de la DB.`);
        return collaborators;
    } catch (error) {
        console.error('Error al obtener colaboradores de la DB:', error.message);
        throw error;
    }
}*/

module.exports = {
    connectDB,
    recordSentEmail,
    checkIfSentToday,
    getConfig,
    updateConfig,
    SentLog,
    Config,
    recordFailedEmail,
    FailedEmailLog,
    getFailedEmailsToRetry,
    updateFailedEmailStatus,
    recordEmailOpen,
    getYearlyEmailStats,
    getMonthlyEmailStats,
    getLast7DaysTotals
    // Puedes exportar estas si decides migrar los colaboradores a MongoDB
    //saveOrUpdateCollaborator,
    //getAllCollaborators,
    // Exportar los modelos directamente si otros servicios necesitan interactuar con ellos
    //
    // Collaborator,
};


if (require.main === module) {
    // Si ejecutas este archivo directamente, prueba la conexión
    connectDB().then(() => {
        console.log('Conexión a MongoDB probada correctamente.');
        process.exit(0);
    }).catch((err) => {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1);
    });
}


/*Adaptar todo el codigo de vuelta de eventos.js para que traiga la informacion de la API de peopleForce
Despues adaptar ¿db.js? y eventos.js para que guarde los mensajes automaticos que se mandan
(emails,personas,mensaje,foto)*/
