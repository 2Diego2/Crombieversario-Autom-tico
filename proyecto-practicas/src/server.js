// server.js
require('dotenv').config();
const express = require('express');
const crypto = require("crypto");
const updateEnvFile = require('./utils/saveEnv');
const { connectDB, getConfig, updateConfig, db } = require('./db'); // Importa las nuevas funciones
const multer = require('multer'); // Importa multer
const fs = require('fs'); // Para manejar archivos (eliminar)
const path = require('path'); // Para manejar rutas de archivos
const mongoUri = process.env.MONGO_URI;
const mongoose = require('mongoose');


const app = express();
const PORT = process.env.PORT || 3033; // Usa la variable de entorno para el puerto
const aniversarioSchema = new mongoose.Schema({}, { strict: false, collection: 'aniversarios' });
const Aniversario = mongoose.model('Aniversario', aniversarioSchema);



// --- Configuración de Multer para Subida de Archivos ---
const UPLOADS_DIR = path.join(__dirname, '../public/uploads'); // Carpeta donde se guardarán las imágenes
// Asegúrate de que la carpeta de uploads exista
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR); // Guarda los archivos en la carpeta UPLOADS_DIR
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único para evitar colisiones
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para parsear cuerpos de petición URL-encoded (si fuera necesario)

// Middleware para habilitar CORS (Cross-Origin Resource Sharing)
// Esto es CRÍTICO para que React pueda hacer peticiones a tu backend
app.use((req, res, next) => {
    // Permite peticiones desde cualquier origen (para desarrollo)
    res.header('Access-Control-Allow-Origin', '*');
    // Permite los métodos HTTP que vas a usar
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // Permite los headers que vas a usar (incluyendo x-api-key)
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    // Maneja peticiones OPTIONS (preflight requests)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

console.log('API_KEY cargada desde .env:', process.env.API_KEY); // Log para mostrar la API Key cargada

// Middleware para servir archivos estáticos (¡CRÍTICO para las imágenes!)
// Esto hará que los archivos en 'proyecto-practicas/public' sean accesibles vía URL
app.use('/uploads', express.static(UPLOADS_DIR)); // Hace que /public/uploads sea accesible como /uploads en la URL

// ... (tu lógica de generación de API Key) ...
if (!process.env.API_KEY || process.env.API_KEY.trim() === '' || process.env.API_KEY.trim() === '(dir_name)') {
    const newApiKey = crypto.randomBytes(32).toString('hex');
    updateEnvFile('API_KEY', newApiKey);
    process.env.API_KEY = newApiKey;
    console.log('API Key generada y guardada en .env.');
} else {
    process.env.API_KEY = process.env.API_KEY.trim();
}

// Middleware solo para rutas protegidas
function requireApiKey(req, res, next) {
    const apiKey = req.header('x-api-key');
    console.log('API Key recibida:', apiKey, '| API Key esperada:', process.env.API_KEY);
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'API key inválida o faltante' });
    }
    next();
}

// ENDPOINT para obtener trabajadores desde el archivo JSON local
app.get('/trabajadores', (req, res) => {
    const trabajadoresPath = path.join(__dirname, '../data/trabajadores.json');
    fs.readFile(trabajadoresPath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error al leer trabajadores.json:', err);
            return res.status(500).json({ error: 'No se pudo leer el archivo de trabajadores.' });
        }
        try {
            const trabajadores = JSON.parse(data);
            res.json(trabajadores);
        } catch (parseErr) {
            console.error('Error al parsear trabajadores.json:', parseErr);
            res.status(500).json({ error: 'Error de formato en trabajadores.json.' });
        }
    });
});

//Endpoint para obtener los mails enviados desde la base de datos
app.get('/api/aniversarios-enviados', requireApiKey, async (req, res) => {
    try {
        // Busca solo los que tengan enviado: true
        const enviados = await Aniversario.find({ enviado: true });
        res.json(enviados);
    } catch (error) {
        console.error('Error al obtener aniversarios enviados:', error);
        res.status(500).json({ error: 'Error al obtener aniversarios enviados.' });
    }
});


// NUEVOS ENDPOINTS para la configuración
app.get('/api/config', requireApiKey, async (req, res) => {
    try {
        const config = await getConfig();
        res.json(config);
    } catch (error) {
        console.error('Error al obtener la configuración:', error);
        res.status(500).json({ error: 'Error al obtener la configuración.' });
    }
});

// Deja solo esta versión protegida del PUT
app.put('/api/config', requireApiKey, async (req, res) => {
    const { messageTemplate, imagePaths } = req.body;
    if (messageTemplate === undefined) {
        return res.status(400).json({ error: 'messageTemplate es requerido.' });
    }
    try {
        const updatedConfig = await updateConfig(messageTemplate, imagePaths || []);
        res.json(updatedConfig);
    } catch (error) {
        console.error('Error al actualizar la configuración:', error);
        res.status(500).json({ error: 'Error al actualizar la configuración.' });
    }
});

app.get('/api/get-api-key', (req, res) => {
    // Cuidado: Exponer la API_KEY así no es seguro en producción.
    // Solo para propósitos de desarrollo/prueba.
    res.json({ apiKey: process.env.API_KEY });
});

// ENDPOINT para SUBIR UNA NUEVA IMAGEN
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }

    try {
        // La ruta que guardaremos en la DB y que el frontend usará para mostrar
        // Será relativa al directorio base que Express sirve estáticamente ('/uploads/nombre_del_archivo')
        const imageUrl = `/uploads/${req.file.filename}`;

        // Obtener la configuración actual
        const config = await getConfig(); // Ojo, esta función puede crear una config si no existe
        // Asegúrate de que config.imagePaths sea un array y añade la nueva ruta
        const newImagePaths = [...(config.imagePaths || []), imageUrl];

        // Actualiza la configuración con la nueva ruta de imagen
        const updatedConfig = await updateConfig(config.messageTemplate, newImagePaths);

        res.status(200).json({
            message: 'Imagen subida y ruta guardada exitosamente.',
            imageUrl: imageUrl,
            updatedConfig: updatedConfig
        });
    } catch (error) {
        console.error('Error al subir imagen o actualizar configuración:', error);
        // Si hay un error, intentar eliminar el archivo subido para limpiar
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error al eliminar archivo subido tras un error:', err);
        });
        res.status(500).json({ error: 'Error interno del servidor al subir imagen.' });
    }
});

// ENDPOINT para ELIMINAR UNA IMAGEN
app.delete('/api/delete-image', async (req, res) => {
    const { imageUrl } = req.body; // Esperamos la URL de la imagen a eliminar
    if (!imageUrl) {
        return res.status(400).json({ error: 'URL de imagen no proporcionada.' });
    }

    // Construye la ruta física completa del archivo en el servidor
    const filename = path.basename(imageUrl); // Extrae 'nombre_del_archivo.jpg' de '/uploads/nombre_del_archivo.jpg'
    const filePath = path.join(UPLOADS_DIR, filename);

    try {
        // 1. Eliminar el archivo del sistema de archivos
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath); // Usa fs.promises para asincronía
            console.log(`Archivo ${filePath} eliminado del servidor.`);
        } else {
            console.warn(`Intento de eliminar imagen no existente en el servidor: ${filePath}`);
        }

        // 2. Eliminar la ruta de la imagen de la base de datos
        const config = await getConfig();
        const newImagePaths = (config.imagePaths || []).filter(path => path !== imageUrl);

        const updatedConfig = await updateConfig(config.messageTemplate, newImagePaths);

        res.status(200).json({
            message: 'Imagen eliminada exitosamente del servidor y la configuración.',
            updatedConfig: updatedConfig
        });
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar imagen.' });
    }
});

// Iniciar el servidor y la conexión a la DB
(async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
})();