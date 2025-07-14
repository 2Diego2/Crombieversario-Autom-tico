// server.js
require('dotenv').config();
const express = require('express');
const crypto = require("crypto");
const updateEnvFile = require('./utils/saveEnv');
const { connectDB, getConfig, updateConfig } = require('./db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3033;

// --- Configuración de Multer para Subida de Archivos ---
// Mantenemos tu UPLOADS_DIR original
const UPLOADS_DIR = path.join(__dirname, '../public/uploads'); // Carpeta donde se guardarán las imágenes
// Asegúrate de que la carpeta de uploads exista
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const anniversaryNumber = req.params.anniversaryNumber; // Get from params
        console.log('Multer Filename: anniversaryNumber recibido from req.params:', anniversaryNumber);

        if (!anniversaryNumber || isNaN(parseInt(anniversaryNumber)) || parseInt(anniversaryNumber) <= 0) {
            return cb(new Error(`Número de aniversario inválido o faltante. Recibido: '${anniversaryNumber}' (desde params)`), null);
        }

        const parsedAnniversaryNumber = parseInt(anniversaryNumber);
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.png') {
            return cb(new Error('Solo se permiten imágenes PNG.'), null);
        }

        const fileName = `${parsedAnniversaryNumber}.png`;
        const filePath = path.join(UPLOADS_DIR, fileName);

        if (fs.existsSync(filePath)) {
            // THIS IS THE ERROR YOU WANT TO CATCH AND SEND AS JSON
            return cb(new Error(`Ya existe una imagen para el aniversario N° ${parsedAnniversaryNumber}. Por favor, elimínala primero.`), null);
        }

        console.log('Multer Filename: Nombre final del archivo:', fileName);
        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no soportado. Solo se permiten PNGs.'), false);
        }
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

if (!process.env.API_KEY || process.env.API_KEY.trim() === '' || process.env.API_KEY.trim() === '(dir_name)') {
    const newApiKey = crypto.randomBytes(32).toString('hex');
    updateEnvFile('API_KEY', newApiKey);
    process.env.API_KEY = newApiKey;
    console.log('API Key generada y guardada en .env.');
} else {
    process.env.API_KEY = process.env.API_KEY.trim();
}

function requireApiKey(req, res, next) {
    const apiKey = req.header('x-api-key');
    console.log('API Key recibida:', apiKey, '| API Key esperada:', process.env.API_KEY);
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'API key inválida o faltante' });
    }
    next();
}

// Middleware para servir archivos estáticos (MANTENEMOS TU RUTA ORIGINAL)
app.use('/uploads', express.static(UPLOADS_DIR)); // Sigue sirviendo /public/uploads como /uploads

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

// ENDPOINT para SUBIR UNA NUEVA IMAGEN (Con requireApiKey)
app.post('/api/upload-image/:anniversaryNumber', requireApiKey, async (req, res) => {
    // Wrap the Multer middleware in a Promise-based function or a try/catch block
    // to handle errors gracefully before proceeding.

    try {
        // Use upload.single() directly with async/await
        // This is a common pattern for handling Multer errors more explicitly
        await new Promise((resolve, reject) => {
            upload.single('image')(req, res, (err) => {
                if (err) {
                    console.error('Multer error caught:', err);
                    return reject(err); // Reject the promise if Multer throws an error
                }
                resolve(); // Resolve if upload successful
            });
        });

        // If we reach here, Multer succeeded, and req.file should be available
        if (!req.file) { // This check might still be useful for edge cases
            return res.status(400).json({ error: 'No se ha subido ningún archivo o el archivo no fue procesado por el servidor.' });
        }

        const anniversaryNumber = req.params.anniversaryNumber;
        console.log('Route Handler: anniversaryNumber from req.params:', anniversaryNumber);

        const imageUrl = `/uploads/${req.file.filename}`;

        const config = await getConfig();
        const newImagePaths = [...(config.imagePaths || [])];

        if (!newImagePaths.includes(imageUrl)) {
            newImagePaths.push(imageUrl);
        }

        newImagePaths.sort((a, b) => {
            const numA = parseInt(path.basename(a, '.png'));
            const numB = parseInt(path.basename(b, '.png'));
            return numA - numB;
        });

        const updatedConfig = await updateConfig(config.messageTemplate, newImagePaths);

        res.status(200).json({
            message: 'Imagen subida y ruta guardada exitosamente.',
            imageUrl: imageUrl,
            updatedConfig: updatedConfig
        });
    } catch (error) {
        // This catch block will now handle errors thrown by Multer's filename function
        // (because we rejected the promise with that error)
        console.error('Final upload error handler:', error);

        // Clean up partially uploaded files if any (though Multer's error should prevent saving)
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error al eliminar archivo subido tras un error en config:', err);
            });
        }
        
        // Send the specific error message from Multer
        // Multer errors are usually instance of Error, so error.message holds the text
        return res.status(400).json({ // Use 400 Bad Request for client-side input errors (like file exists)
            error: error.message || 'Error desconocido al subir imagen.'
        });
    }
});

// ENDPOINT para ELIMINAR UNA IMAGEN (Con requireApiKey)
app.delete('/api/delete-image', requireApiKey, async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
        return res.status(400).json({ error: 'URL de imagen no proporcionada.' });
    }

    // Construye la ruta física completa del archivo en el servidor
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename); // Usa UPLOADS_DIR aquí

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