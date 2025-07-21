require('dotenv').config(); // Carga las variables de entorno
const fs = require('fs');
const path = require('path');
const { connectDB, SentLog } = require('./src/db'); // Importa connectDB y SentLog

async function precargarSentLogs() {
    try {
        await connectDB(); // Conéctate a MongoDB

        // Ruta al archivo sentlogs.json (asumiendo que está en una carpeta 'data' en la raíz)
        const sentLogsPath = path.join(__dirname, 'data', 'sentLogs.json'); // Usamos el nombre del archivo que te di
        
        // Verifica si el archivo existe antes de intentar leerlo
        if (!fs.existsSync(sentLogsPath)) {
            console.error(`Error: El archivo ${sentLogsPath} no se encontró.`);
            console.error('Asegúrate de que sentLogs.json esté en la raíz de tu proyecto.');
            process.exit(1);
        }

        const sentLogsData = JSON.parse(fs.readFileSync(sentLogsPath, 'utf-8'));

        console.log(`Intentando insertar ${sentLogsData.length} registros de SentLog...`);

        // Inserta todos los documentos en la colección SentLog
        // .insertMany() es más eficiente para insertar múltiples documentos
        const result = await SentLog.insertMany(sentLogsData);

        console.log(`Se insertaron ${result.length} registros de SentLog exitosamente.`);
    } catch (error) {
        console.error('Error al precargar sentLogs:', error);
    } finally {
        // Asegúrate de importar mongoose si no lo has hecho ya en este script
        // const mongoose = require('mongoose'); 
        if (mongoose.connection.readyState === 1) { // 1 = connected
            await mongoose.connection.close();
            console.log('Conexión a MongoDB cerrada.');
        }
        process.exit(0); // Salir del proceso
    }
}

// Para que mongoose.connection.close() funcione
const mongoose = require('mongoose'); 

precargarSentLogs();