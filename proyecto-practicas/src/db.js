// backend/src/db/mongoService.js
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
    email: { type: String, required: true },
    years: { type: Number, required: true },
    sentDate: { type: Date, default: Date.now }, // Fecha de envío, por defecto la fecha actual
}, { timestamps: true }); // 'timestamps: true' añade 'createdAt' y 'updatedAt' automáticamente
const SentLog = mongoose.model('SentLog', sentLogSchema);

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
async function recordSentEmail(email, years) {
    try {
        const newLog = new SentLog({ email, years });
        await newLog.save();
        console.log(`Log de envío registrado en DB para ${email} (${years} años).`);
    } catch (error) {
        console.error(`Error al registrar log de envío para ${email}:, error.message`);
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
    // Puedes exportar estas si decides migrar los colaboradores a MongoDB
    //saveOrUpdateCollaborator,
    //getAllCollaborators,
    // Exportar los modelos directamente si otros servicios necesitan interactuar con ellos
    //
    // Collaborator,
    SentLog
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