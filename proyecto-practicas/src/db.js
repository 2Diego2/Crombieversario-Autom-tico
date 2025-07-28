// db.js
const mongoose = require('mongoose');

// *Definición de Esquemas y Modelos*

// Esquema para Colaboradores
// Este esquema define la estructura de los documentos en tu colección 'user'
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'staff'], default: 'staff' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

/**
 * Busca un usuario por su email.
 * @param {string} email El email del usuario.
 * @returns {Promise<Object|null>} El objeto de usuario si se encuentra, de lo contrario null.
 */
async function findUserByEmail(email) {
    try {
        const user = await User.findOne({ email });
        return user;
    } catch (error) {
        console.error('Error al buscar usuario por email:', error);
        throw error;
    }
}

/**
 * Crea un nuevo usuario en la base de datos.
 * @param {string} email El email del nuevo usuario.
 * @param {string} passwordHash El hash de la contraseña del usuario.
 * @param {string} [role='admin_interfaz'] El rol del usuario.
 * @returns {Promise<Object>} El objeto del usuario creado.
 */
async function createUser(email, passwordHash, role = 'staff') {
    try {
        const newUser = new User({ email, passwordHash, role });
        await newUser.save();
        console.log(`Usuario creado: ${email} con rol: ${role}`);
        return newUser;
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
}

async function updateUserRole(userId, newRole) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }
        user.role = newRole;
        await user.save();
        console.log(`Rol del usuario ${user.email} actualizado a ${newRole}`);
        return user;
    } catch (error) {
        console.error('Error al actualizar rol de usuario:', error);
        throw error;
    }
}

// Esquema para Logs de Correos Enviados
// Este esquema define la estructura de los documentos en tu colección 'sent_logs'
const sentLogSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true },
    years: { type: Number, required: true },
    sentDate: { type: Date, default: Date.now }, // Fecha de envío, por defecto la fecha actual
    opened: { type: Boolean, default: false },
    openedAt: { type: Date }
}, { timestamps: true }); // 'timestamps: true' añade 'createdAt' y 'updatedAt' automáticamente
const SentLog = mongoose.model('SentLog', sentLogSchema);

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
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true },
    years: { type: Number, required: true },
    attemptDate: { type: Date, default: Date.now },
    errorMessage: { type: String },
    status: { type: String, default: 'failed' } // 'failed', 'retried', 'succeeded_after_retry'
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
 * @param {string} email - Correo del colaborador.
 * @param {number} years - Años de aniversario.
 */
async function recordSentEmail(nombre, apellido, email, years) {
    try {
        const newLog = new SentLog({ nombre, apellido, email, years });
        await newLog.save();
        console.log(`Log de envío registrado en DB para ${nombre} ${apellido} (${email}, ${years} años).`);
    } catch (error) {
        console.error(`Error al registrar log de envío para ${email}: ${error.message}`);
    }
}

/**
 * Verifica si ya se envió un correo para un aniversario específico hoy.
 * @param {string} email - Correo del colaborador.
 * @param {number} years - Años de aniversario.
 * @returns {boolean} - True si ya se envió hoy, false de lo contrario.
 */
async function checkIfSentToday(email, years) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer a la medianoche de hoy

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Medianoche de mañana

    try {
        const log = await SentLog.findOne({
            email: email,
            years: years,
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

async function recordEmailOpen(email, years) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Establecer a la medianoche de hoy

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Medianoche de mañana

        // Encuentra el log de envío más reciente para hoy y actualízalo
        const updatedLog = await SentLog.findOneAndUpdate(
            {
                email: email,
                years: years,
                sentDate: {
                    $gte: today,
                    $lt: tomorrow
                },
                opened: false // Solo actualiza si no ha sido marcado como abierto
            },
            {
                $set: {
                    opened: true,
                    openedAt: Date.now()
                }
            },
            { new: true } // Devuelve el documento actualizado
        );

        if (updatedLog) {
            console.log(`Apertura de email registrada en DB para ${email} (${years} años).`);
        } else {
            console.warn(`No se encontró un log de envío pendiente de apertura para ${email} (${years} años) o ya estaba marcado como abierto.`);
        }
    } catch (error) {
        console.error(`Error al registrar apertura de email para ${email}: ${error.message}`);
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
    findUserByEmail,
    createUser,
    updateUserRole,
    SentLog,
    Config,
    FailedEmailLog,
    recordFailedEmail,
    getFailedEmailsToRetry,
    updateFailedEmailStatus,
    recordEmailOpen,
    getYearlyEmailStats
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