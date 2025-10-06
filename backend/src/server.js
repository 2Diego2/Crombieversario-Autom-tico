// server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const updateEnvFile = require('./utils/saveEnv.js');
const { 
    connectDB, 
    getConfig, 
    updateConfig, 
    SentLog, 
    FailedEmailLog, 
    User, 
    recordEmailOpen, 
    getYearlyEmailStats, 
    getMonthlyEmailStats, 
    getLast7DaysTotals, 
    findUserByEmail, 
    createUser, 
    updateUserRole 
} = require('./db.js');
const multer = require('multer');
const fs = require('fs');
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3033;

// Configuración de S3
const s3 = new S3Client({
    region: process.env.AWS_S3_REGION
});
const s3Bucket = process.env.AWS_S3_BUCKET_NAME;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend/crombieversario-app/dist')));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración CORS
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:5173', 
        'http://crombieversario-interfaz.s3-website.us-east-2.amazonaws.com',
        'http://localhost'
    ]; 
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Constantes
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_EMAIL_DOMAIN = '@crombie.dev';
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    STAFF: 'staff'
};

// Configuración de sesión y Passport
app.use(session({
    secret: process.env.JWT_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Generar API Key si no existe
console.log('API_KEY cargada desde .env:', process.env.API_KEY);

if (!process.env.API_KEY || process.env.API_KEY.trim() === '' || process.env.API_KEY.trim() === '(dir_name)') {
    const newApiKey = crypto.randomBytes(32).toString('hex');
    updateEnvFile('API_KEY', newApiKey);
    process.env.API_KEY = newApiKey;
    console.log('API Key generada y guardada en .env.');
} else {
    process.env.API_KEY = process.env.API_KEY.trim();
}

// ============================================
// MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================

function requireApiKey(req, res, next) {
    const apiKey = req.header('x-api-key');
    console.log('API Key recibida:', apiKey, '| API Key esperada:', process.env.API_KEY);
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'API key inválida o faltante' });
    }
    next();
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Error al verificar token:', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Acceso denegado: Token expirado.' });
            }
            return res.status(403).json({ message: 'Acceso denegado: Token inválido.' });
        }
        req.user = user;
        next();
    });
}

function authorize(requiredRoles) {
    if (!Array.isArray(requiredRoles)) {
        requiredRoles = [requiredRoles];
    }

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Acceso denegado: Rol de usuario no definido.' });
        }

        if (!requiredRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: No tienes los permisos necesarios para esta acción.' });
        }
        next();
    };
}

// ============================================
// CONFIGURACIÓN DE PASSPORT
// ============================================

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Estrategia Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_BASE_URL}/auth/google/dashboard`,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('Verificando callback de Google:', profile);

        const userEmail = profile.emails && profile.emails[0] && profile.emails[0].value;
        const googleId = profile.id;

        // Validar el dominio del email
        if (!userEmail || !userEmail.endsWith(ALLOWED_EMAIL_DOMAIN)) {
            console.warn(`Intento de autenticación de Google rechazado: Dominio de email no permitido: ${userEmail}`);
            return done(null, false, { message: 'Dominio de correo no permitido.' });
        }

        // Buscar usuario por email o googleId
        let user = await User.findOne({
            $or: [
                { email: userEmail },
                { googleId: googleId }
            ]
        });

        if (user) {
            // Actualizar datos si es necesario
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.username) {
                user.username = profile.displayName;
            }
            if (profile.photos && profile.photos[0] && profile.photos[0].value) {
                user.profileImageUrl = profile.photos[0].value;
            }
            await user.save();
        } else {
            // Crear nuevo usuario
            user = await User.create({
                googleId: googleId,
                email: userEmail,
                username: profile.displayName,
                profileImageUrl: profile.photos && profile.photos[0] && profile.photos[0].value,
            });
        }

        done(null, user);

    } catch (err) {
        console.error('Error en la estrategia de Google:', err);
        done(err, null);
    }
}));

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// Iniciar autenticación con Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback de Google
app.get('/auth/google/dashboard',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        const token = jwt.sign({
            id: req.user._id,
            email: req.user.email,
            username: req.user.username,
            role: req.user.role,
        }, JWT_SECRET, { expiresIn: '1h' });

        const profileImageUrl = req.user.profileImageUrl || '';

        // Redirigir al frontend con token y profileImage
        res.redirect(`${process.env.FRONTEND_BASE_URL}/dashboard?token=${token}&profileImage=${encodeURIComponent(profileImageUrl)}`);
    }
);

// Login local
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Validar dominio
    if (!email || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        return res.status(400).json({ message: `Dominio de correo no permitido o email faltante. Debe ser ${ALLOWED_EMAIL_DOMAIN}` });
    }

    try {
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        let finalProfileImageUrlForClient = user.profileImageUrl;
        if (finalProfileImageUrlForClient) {
            if (!finalProfileImageUrlForClient.startsWith('/')) {
                finalProfileImageUrlForClient = `/${finalProfileImageUrlForClient}`;
            }
        } else {
            finalProfileImageUrlForClient = '/LogoSolo.jpg';
        }

        const token = jwt.sign({ 
            id: user._id, 
            email: user.email, 
            role: user.role 
        }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ 
            message: 'Login exitoso', 
            token, 
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profileImageUrl: finalProfileImageUrlForClient,
                username: user.username
            }
        });

    } catch (error) {
        console.error('Error en el proceso de login:', error);
        res.status(500).json({ message: 'Error interno del servidor durante el login.' });
    }
});

// ============================================
// RUTAS DE GESTIÓN DE USUARIOS
// ============================================

// Registrar admin inicial (usar con precaución)
app.post('/api/register-admin', requireApiKey, async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        return res.status(400).json({ message: 'Email, contraseña o dominio inválido.' });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Este email ya está registrado.' });
        }
        
        const newUser = await createUser(email, password, ROLES.SUPER_ADMIN, username);
        res.status(201).json({ message: `Usuario ${ROLES.SUPER_ADMIN} creado exitosamente.`, userId: newUser._id });

    } catch (error) {
        console.error('Error al registrar usuario admin:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
});

// Registrar staff
app.post('/api/register-staff', requireApiKey, async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        return res.status(400).json({ message: 'Email, contraseña o dominio inválido.' });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Este email ya está registrado.' });
        }

        const newUser = await createUser(email, password, ROLES.STAFF, username);
        res.status(201).json({ message: `Usuario ${ROLES.STAFF} creado exitosamente.`, userId: newUser._id });

    } catch (error) {
        console.error('Error al registrar usuario staff:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
});

// Crear usuario (solo super_admin)
app.post('/api/users/create', authenticateToken, authorize(ROLES.SUPER_ADMIN), async (req, res) => {
    const { email, password, role, profileImageUrl, username } = req.body;

    if (!email || !password || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        return res.status(400).json({ message: 'Email, contraseña o dominio inválido.' });
    }

    if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({ message: 'Rol de usuario inválido.' });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Este email ya está registrado.' });
        }
        
        let finalProfileImageUrl;
        if (profileImageUrl) {
            finalProfileImageUrl = profileImageUrl.startsWith('/') ? profileImageUrl : `/${profileImageUrl}`;
        } else {
            finalProfileImageUrl = '/LogoSolo.jpg';
        }

        const newUser = await createUser(email, password, role, finalProfileImageUrl, username);
        res.status(201).json({ message: `Usuario ${role} creado exitosamente.`, userId: newUser._id });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear usuario.' });
    }
});

// Actualizar rol y/o contraseña de usuario
app.put('/api/users/update-role-password', authenticateToken, authorize([ROLES.SUPER_ADMIN]), async (req, res) => {
    const { email, newRole, newPassword } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'El correo electrónico del usuario es requerido.' });
    }
    if (!newRole && !newPassword) {
        return res.status(400).json({ message: 'Se requiere al menos un nuevo rol o una nueva contraseña.' });
    }

    try {
        const userToUpdate = await findUserByEmail(email);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        let roleToSet = userToUpdate.role;
        if (newRole) {
            if (!Object.values(ROLES).includes(newRole)) {
                return res.status(400).json({ message: `Rol inválido: ${newRole}. Roles permitidos: ${Object.values(ROLES).join(', ')}.` });
            }
            roleToSet = newRole;
        }

        const updatedUser = await updateUserRole(email, roleToSet, newPassword);
        if (updatedUser) {
            res.status(200).json({ 
                message: 'Usuario actualizado con éxito.', 
                user: { email: updatedUser.email, role: updatedUser.role } 
            });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado o no se pudo actualizar.' });
        }
    } catch (error) {
        console.error('Error al actualizar rol/contraseña de usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar usuario.' });
    }
});

// ============================================
// RUTAS DE GESTIÓN DE IMÁGENES
// ============================================

const uploadToMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no soportado. Solo se permiten PNGs.'), false);
        }
    }
});

app.post("/api/upload-image/:anniversaryNumber", 
    uploadToMemory.single("file"), 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN]), 
    async (req, res) => {
        try {
            const anniversaryNumber = parseInt(req.params.anniversaryNumber, 10);
            const fileName = `${anniversaryNumber}.png`;
            const s3Key = `uploads/${fileName}`;

            const command = new PutObjectCommand({
                Bucket: s3Bucket,
                Key: s3Key,
                Body: req.file.buffer,
                ContentType: "image/png",
            });
            await s3.send(command);

            const publicUrl = `https://${s3Bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${s3Key}`;

            const config = await getConfig();
            const newImagePaths = [...(config.imagePaths || [])];
            if (!newImagePaths.includes(publicUrl)) {
                newImagePaths.push(publicUrl);
            }
            await updateConfig(config.messageTemplate || "", newImagePaths);

            res.json({ message: "Imagen subida y guardada con éxito.", path: publicUrl });
        } catch (error) {
            console.error("Error al subir imagen:", error);
            res.status(500).json({ message: "No se pudo subir la imagen." });
        }
    }
);

app.delete("/api/delete-image", 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN]), 
    async (req, res) => {
        console.log('Cuerpo de la solicitud DELETE:', req.body);
        
        const { imageUrl } = req.body;

        try {
            const url = new URL(imageUrl);
            const s3Key = url.pathname.substring(1);

            if (!s3Key || !s3Key.startsWith("uploads/")) {
                return res.status(400).json({ message: "Ruta de imagen inválida." });
            }

            const command = new DeleteObjectCommand({
                Bucket: s3Bucket,
                Key: s3Key,
            });
            await s3.send(command);

            const config = await getConfig();
            const newImagePaths = (config.imagePaths || []).filter(
                (path) => path !== imageUrl
            );

            await updateConfig(config.messageTemplate || "", newImagePaths);

            res.json({ message: "Imagen eliminada con éxito." });
        } catch (error) {
            console.error("Error al eliminar imagen:", error);
            res.status(500).json({ message: "No se pudo eliminar la imagen." });
        }
    }
);

// ============================================
// RUTAS DE DATOS Y CONFIGURACIÓN
// ============================================

// Obtener trabajadores
app.get('/trabajadores', async (req, res) => {
    const trabajadoresPath = path.join(__dirname, '../data/trabajadores.json');
    fs.readFile(trabajadoresPath, 'utf-8', async (err, data) => {
        if (err) {
            console.error('Error al leer trabajadores.json:', err);
            return res.status(500).json({ error: 'No se pudo leer el archivo de trabajadores.' });
        }
        try {
            const trabajadores = JSON.parse(data);

            const users = await User.find({}, 'email role').lean();
            const userRolesMap = new Map(users.map(u => [u.email, u.role]));

            const empleadosConRoles = trabajadores.map(empleado => {
                const role = userRolesMap.get(empleado.mail) || 'none';
                return {
                    ...empleado,
                    id: empleado.mail,
                    role
                };
            });

            res.json(empleadosConRoles);
        } catch (parseErr) {
            console.error('Error al parsear trabajadores.json o combinar datos:', parseErr);
            res.status(500).json({ error: 'Error de formato en trabajadores.json o al procesar datos de usuario.' });
        }
    });
});

// Obtener mails enviados
app.get('/api/aniversarios-enviados', 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), 
    async (req, res) => {
        try {
            const enviados = await SentLog.find({});
            const enviadosOrdenados = enviados.sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));

            res.json(enviadosOrdenados);
        } catch (error) {
            console.error('Error al obtener aniversarios enviados:', error);
            res.status(500).json({ error: 'Error al obtener aniversarios enviados.' });
        }
    }
);

// Obtener mails con error
app.get('/api/aniversarios-error', 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), 
    async (req, res) => {
        try {
            const fallos = await FailedEmailLog.find({
                $or: [
                    { status: 'failed' },
                    { status: { $exists: false } }
                ]
            });

            const fallosOrdenados = fallos.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
            
            const formattedFallos = fallosOrdenados.map(fallo => ({
                _id: fallo._id,
                nombre: fallo.nombre,
                apellido: fallo.apellido,
                email: fallo.email,
                years: fallo.years,
                sentDate: fallo.attemptDate,
                errorMessage: fallo.errorMessage
            }));
            
            res.json(formattedFallos);

        } catch (error) {
            console.error('Error al obtener aniversarios con error:', error);
            res.status(500).json({ error: 'Error al obtener los registros de error.' });
        }
    }
);

// Obtener configuración
app.get('/api/config', 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), 
    async (req, res) => {
        try {
            const config = await getConfig();
            res.json(config);
        } catch (error) {
            console.error('Error al obtener la configuración:', error);
            res.status(500).json({ error: 'Error al obtener la configuración.' });
        }
    }
);

// Actualizar configuración
app.put('/api/config', 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN]), 
    async (req, res) => {
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
    }
);

// ============================================
// RUTAS DE TRACKING Y ESTADÍSTICAS
// ============================================

// Pixel de seguimiento (no necesita autenticación)
app.get('/track/:email/:anniversaryNumber', async (req, res) => {
    const { email, anniversaryNumber } = req.params;

    const decodedEmail = decodeURIComponent(email);
    const decodedAnniversaryNumber = parseInt(anniversaryNumber);

    console.log(`Pixel de seguimiento activado para: ${decodedEmail}, Aniversario: ${decodedAnniversaryNumber}`);

    try {
        await recordEmailOpen(decodedEmail, decodedAnniversaryNumber);

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

// Estadísticas anuales
app.get('/api/email-stats/yearly', 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), 
    async (req, res) => {
        console.log('Recibida petición GET /api/email-stats/yearly');
        try {
            const stats = await getYearlyEmailStats();
            console.log('Datos de estadísticas anuales obtenidos:', stats);
            res.json(stats);
        } catch (error) {
            console.error('Error en el endpoint /api/email-stats/yearly:', error);
            res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas de email.' });
        }
    }
);

// Estadísticas mensuales
app.get('/api/email-stats/monthly', 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), 
    async (req, res) => {
        console.log('Recibida petición GET /api/email-stats/monthly');
        const year = req.query.year || new Date().getFullYear();
        try {
            const stats = await getMonthlyEmailStats(year);
            res.json(stats);
        } catch (error) {
            console.error('Error en el endpoint /api/email-stats/monthly:', error);
            res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas de email.' });
        }
    }
);

// Estadísticas semanales
app.get('/api/email-stats/week', 
    authenticateToken, 
    authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), 
    async (req, res) => {
        console.log('Recibida petición GET /api/email-stats/week');
        try {
            const stats = await getLast7DaysTotals();
            res.json(stats);
        } catch (error) {
            console.error('Error en el endpoint /api/email-stats/week:', error);
            res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas de email.' });
        }
    }
);

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ============================================

app.use((req, res, next) => {
    console.log(`❌ 404 Not Found: Request to ${req.method} ${req.originalUrl} did not match any routes.`);
    res.status(404).json({ error: 'Endpoint no encontrado.' });
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================

(async () => {
    try {
        console.log('Intentando conectar con MONGO_URI:', process.env.MONGO_URI);
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        });

        require("./index.js");

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
})();

// Envía el GIF transparente de 1x1 pixel directamente desde el servidor como parte de la respuesta HTTP a una solicitud. No lo saca de un archivo físico en el servidor. Asi funciona:

// Generación en memoria: El GIF se define como una cadena Base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'.

// Conversión a Buffer: Esta cadena Base64 se convierte en un Buffer en Node.js utilizando Buffer.from('...', 'base64'). Un Buffer es una representación binaria de datos, que es lo que se envía a través de la red.

// Encabezados HTTP: Cuando se realiza la solicitud al endpoint /track/:email/:anniversaryNumber, el servidor establece los encabezados HTTP Content-Type como image/gif y Content-Length con la longitud del Buffer del pixel. Esto le dice al cliente (el programa de correo) que lo que está recibiendo es una imagen GIF y su tamaño.

// Envío del Buffer: Finalmente, el método res.end(pixel) envía el contenido binario del Buffer directamente en el cuerpo de la respuesta HTTP.

// En resumen, el GIF no se almacena como un archivo .gif en el disco. Se crea dinámicamente en la memoria del servidor y se transmite directamente al cliente de correo cuando se solicita la URL de seguimiento.
