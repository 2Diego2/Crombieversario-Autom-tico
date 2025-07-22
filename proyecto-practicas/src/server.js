// server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const updateEnvFile = require('./utils/saveEnv');
const { connectDB, getConfig, updateConfig, recordEmailOpen, getYearlyEmailStats, findUserByEmail, createUser, updateUserRole } = require('./db');
const multer = require('multer');
const fs = require('fs'); 
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

const JWT_SECRET = process.env.JWT_SECRET ;

// Dominio permitido para los correos (¡AHORA DESCOMENTADO Y EN UNA POSICIÓN CORRECTA!)
// const ALLOWED_EMAIL_DOMAIN = '@crombie.dev'; 

// Definición de Roles
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    STAFF: 'staff'
};

// Middleware para verificar JWT (nuevo)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Error al verificar token:', err.message);
            // Distingue entre token expirado y otros errores
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Acceso denegado: Token expirado.' });
            }
            return res.status(403).json({ message: 'Acceso denegado: Token inválido.' });
        }
        req.user = user; // Almacena la información del usuario en el objeto de solicitud
        next();
    });
}

// Middleware de autorización
function authorize(requiredRoles) { // Ahora acepta un array de roles
    // Asegurarse de que requiredRoles sea un array
    if (!Array.isArray(requiredRoles)) {
        requiredRoles = [requiredRoles];
    }

    return (req, res, next) => {
        // req.user viene del middleware authenticateToken
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Acceso denegado: Rol de usuario no definido.' });
        }

        // Verificar si el rol del usuario está en la lista de roles requeridos
        if (!requiredRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: No tienes los permisos necesarios para esta acción.' });
        }
        next();
    };
}


// --- Rutas de Autenticación ---

// Ruta para el Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Validar dominio del correo (¡AHORA DESCOMENTADO!)
    // if (!email || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    //     return res.status(400).json({ message: `Dominio de correo no permitido o email faltante. Debe ser ${ALLOWED_EMAIL_DOMAIN}` });
    // }

    try {
        // 2. Buscar usuario en la base de datos (usando la nueva función)
        const user = await findUserByEmail(email);

        if (!user) {
            // Mensaje genérico por seguridad
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Comparar contraseña
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // 4. Generar Token JWT
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' }); // Token válido por 1 hora

        res.json({ message: 'Login exitoso', token, user: { id: user._id, email: user.email, role: user.role } });

    } catch (error) {
        console.error('Error en el proceso de login:', error);
        res.status(500).json({ message: 'Error interno del servidor durante el login.' });
    }
});

// Ruta inicial para crear el primer/segundo super_admin (¡USAR CON CUIDADO Y LUEGO PROTEGER/ELIMINAR!)
// Puedes dejarla como '/api/register-admin' o renombrarla a algo más específico como '/api/initial-admin-setup'
app.post('/api/register-admin', requireApiKey, async (req, res) => {
    const { email, password } = req.body;
    // Aquí no necesitas el campo 'role' en req.body, siempre será 'super_admin'
    // para las cuentas iniciales que configurarán el sistema.

    // if (!email || !password || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    //     return res.status(400).json({ message: 'Email, contraseña o dominio inválido.' });
    // }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Este email ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Siempre crea como 'super_admin' con esta ruta inicial
        const newUser = await createUser(email, passwordHash, ROLES.SUPER_ADMIN);
        res.status(201).json({ message: `Usuario ${ROLES.SUPER_ADMIN} creado exitosamente.`, userId: newUser._id });

    } catch (error) {
        console.error('Error al registrar usuario admin:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
});

// RUTA PARA QUE UN SUPER_ADMIN CREE OTROS USUARIOS (staff o super_admin)
app.post('/api/users/create', authenticateToken, authorize(ROLES.SUPER_ADMIN), async (req, res) => {
    const { email, password, role } = req.body; // Ahora el rol puede venir en el cuerpo

    // Validaciones: email, password, dominio
    // if (!email || !password || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    //     return res.status(400).json({ message: 'Email, contraseña o dominio inválido.' });
    // }

    // Validar el rol que se intenta asignar
    if (!Object.values(ROLES).includes(role)) { // Asegura que el rol sea uno de los definidos
        return res.status(400).json({ message: 'Rol de usuario inválido.' });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Este email ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await createUser(email, passwordHash, role); // Crea con el rol especificado
        res.status(201).json({ message: `Usuario ${role} creado exitosamente.`, userId: newUser._id });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear usuario.' });
    }
});

// RUTA PARA QUE UN SUPER_ADMIN ACTUALICE EL ROL DE UN USUARIO EXISTENTE
app.put('/api/users/:userId/role', authenticateToken, authorize(ROLES.SUPER_ADMIN), async (req, res) => {
    const { userId } = req.params;
    const { newRole } = req.body;

    if (!newRole || !Object.values(ROLES).includes(newRole)) {
        return res.status(400).json({ message: 'Rol inválido proporcionado.' });
    }

    try {
        const updatedUser = await updateUserRole(userId, newRole);
        res.json({ message: `Rol del usuario ${updatedUser.email} actualizado a ${newRole} exitosamente.`, user: updatedUser });
    } catch (error) {
        console.error('Error al actualizar rol de usuario:', error);
        if (error.message === 'Usuario no encontrado.') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar rol.' });
    }
});

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

// Rutas de interfaz protegidas por roles
app.get('/api/config', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
    try {
        const config = await getConfig();
        res.json(config);
    } catch (error) {
        console.error('Error al obtener la configuración:', error);
        res.status(500).json({ error: 'Error al obtener la configuración.' });
    }
});

app.put('/api/config', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
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

// Nuevo endpoint para el pixel de seguimiento (no necesita autenticación)
app.get('/track/:email/:anniversaryNumber', async (req, res) => {
    const { email, anniversaryNumber } = req.params;

    // Decodifica el email y el número de aniversario si están codificados en la URL
    const decodedEmail = decodeURIComponent(email);
    const decodedAnniversaryNumber = parseInt(anniversaryNumber);

    console.log(`Pixel de seguimiento activado para: ${decodedEmail}, Aniversario: ${decodedAnniversaryNumber}`);

    try {
        // Registra la apertura en la base de datos (puedes crear una nueva colección o añadir un campo a SentLog)
        // Aquí, por simplicidad, vamos a actualizar el log de envío existente o crear uno si no lo hay.
        // Una forma más robusta sería una nueva colección 'EmailOpens'
        await recordEmailOpen(decodedEmail, decodedAnniversaryNumber);

        // Sirve un GIF transparente de 1x1 pixel
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
        });
        res.end(pixel);
    } catch (error) {
        console.error('Error al registrar apertura de email:', error);
        // Si hay un error, aún así sirve el pixel para no romper la visualización del correo
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
        });
        res.end(pixel);
    }
});

app.get('/api/email-stats/yearly', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
    console.log('Recibida petición GET /api/email-stats/yearly');
    try {
        const stats = await getYearlyEmailStats();
        res.json(stats);
    } catch (error) {
        console.error('Error en el endpoint /api/email-stats/yearly:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas de email.' });
    }
});
console.log('--- Ruta /api/email-stats/yearly registrada con éxito ---');

app.post('/api/upload-image/:anniversaryNumber', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => { 
    try {
        await new Promise((resolve, reject) => {
            upload.single('image')(req, res, (err) => {
                if (err) {
                    console.error('Error de Multer: ', err);
                    return reject(err); 
                }
                resolve(); 
            });
        });

        if (!req.file) { 
            return res.status(400).json({ error: 'No se ha subido ningún archivo o el archivo no fue procesado por el servidor.' });
        }

        const anniversaryNumber = req.params.anniversaryNumber;
        console.log('Controlador de ruta: anniversaryNumber de req.params:', anniversaryNumber);

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
        console.error('Manejador de errores de carga final: ', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error al eliminar archivo subido tras un error en config:', err);
            });
        }
        
        return res.status(400).json({ 
            error: error.message || 'Error desconocido al subir imagen.'
        });
        res.status(500).json({ error: 'Error interno del servidor al subir imagen.' });
    }
});

app.delete('/api/delete-image', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
        return res.status(400).json({ error: 'URL de imagen no proporcionada.' });
    }

    try {
        const filename = path.basename(imageUrl);
        const filePath = path.join(UPLOADS_DIR, filename);

        // Verificar si el archivo existe antes de eliminar
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);         } else {
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

app.use((req, res, next) => { // Este catch-all debería estar al final
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