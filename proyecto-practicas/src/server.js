// server.js
require('dotenv').config();
const express = require('express');
const crypto = require("crypto");
const updateEnvFile = require('./utils/saveEnv');
const { connectDB, getConfig, updateConfig, recordEmailOpen, getYearlyEmailStats} = require('./db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3033;

// --- Configuración de Multer para Subida de Archivos ---
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para habilitar CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

console.log('API_KEY cargada desde .env:', process.env.API_KEY);

app.use('/uploads', express.static(UPLOADS_DIR));

// Generación de API Key si no existe
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

// ENDPOINTS para la configuración
app.get('/api/config', requireApiKey, async (req, res) => {
    try {
        const config = await getConfig();
        res.json(config);
    } catch (error) {
        console.error('Error al obtener la configuración:', error);
        res.status(500).json({ error: 'Error al obtener la configuración.' });
    }
});

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
    res.json({ apiKey: process.env.API_KEY });
});

// ENDPOINT para SUBIR UNA NUEVA IMAGEN
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }
});

console.log('--- Attempting to register /api/email-stats/yearly route ---');
app.get('/api/email-stats/yearly', requireApiKey, async (req, res) => {
    console.log('Recibida petición GET /api/email-stats/yearly');
    try {
        const stats = await getYearlyEmailStats();
        res.json(stats);
    } catch (error) {
        console.error('Error en el endpoint /api/email-stats/yearly:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas de email.' });
    }
});
console.log('--- Successfully registered /api/email-stats/yearly route ---');

// ENDPOINT para SUBIR UNA NUEVA IMAGEN (Con requireApiKey)
app.post('/api/upload-image/:anniversaryNumber', requireApiKey, async (req, res) => {
    // Wrap the Multer middleware in a Promise-based function or a try/catch block
    // to handle errors gracefully before proceeding.

    try {
        const imageUrl = `/uploads/${req.file.filename}`;
        const config = await getConfig();
        const newImagePaths = [...(config.imagePaths || []), imageUrl];
        const updatedConfig = await updateConfig(config.messageTemplate, newImagePaths);

        res.status(200).json({
            message: 'Imagen subida y ruta guardada exitosamente.',
            imageUrl: imageUrl,
            updatedConfig: updatedConfig
        });
    } catch (error) {
        console.error('Error al subir imagen o actualizar configuración:', error);
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error al eliminar archivo subido tras un error:', err);
        });
        res.status(500).json({ error: 'Error interno del servidor al subir imagen.' });
    }
});

// ENDPOINT para ELIMINAR UNA IMAGEN
app.delete('/api/delete-image', async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
        return res.status(400).json({ error: 'URL de imagen no proporcionada.' });
    }

    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename);

    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`Archivo ${filePath} eliminado del servidor.`);
        } else {
            console.warn(`Intento de eliminar imagen no existente en el servidor: ${filePath}`);
        }

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

app.use((req, res, next) => { // This catch-all should be at the very end
    console.log(`❌ 404 Not Found: Request to ${req.method} ${req.originalUrl} did not match any routes.`);
    res.status(404).json({ error: 'Endpoint no encontrado.' });
});

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