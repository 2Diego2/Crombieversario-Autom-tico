// server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const updateEnvFile = require('./utils/saveEnv');
const { connectDB, getConfig, updateConfig, SentLog, FailedEmailLog, User, recordEmailOpen, getYearlyEmailStats, getMonthlyEmailStats, getLast7DaysTotals, findUserByEmail, createUser, updateUserRole } = require('./db'); 
const multer = require('multer');
const fs = require('fs');


const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require('mongoose-findorcreate');
const passport = require('passport');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3033;
const PORTREACT = process.env.PORTREACT || 5173;

//usuarios
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// --- Configuración de Multer para Subida de Archivos ---
const UPLOADS_DIR = path.join(__dirname, '../public/uploads'); // Carpeta donde se guardarán las imágenes
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

// Configuración CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    res.header('Access-Control-Allow-Credentials', true); // Importante para cookies/sesiones si las usas
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

    // 1. Validar dominio del correo
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

        
        let finalProfileImageUrlForClient = user.profileImageUrl;
        // Ensure the stored URL, when sent to the client, is absolute
        if (finalProfileImageUrlForClient) {
            if (!finalProfileImageUrlForClient.startsWith('/')) {
                finalProfileImageUrlForClient = `/${finalProfileImageUrlForClient}`;
            }
        } else {
            // If profileImageUrl is null or undefined from the DB, use the default absolute path
            finalProfileImageUrlForClient = '/LogoSolo.jpg';
        }

        // 4. Generar Token JWT
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' }); // Token válido por 1 hora

        res.json({ message: 'Login exitoso', token, user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profileImageUrl: finalProfileImageUrlForClient // Send the absolute URL
            }
        });

    } catch (error) {
        console.error('Error en el proceso de login:', error);
        res.status(500).json({ message: 'Error interno del servidor durante el login.' });
    }
});

//usuarios

// Passport Local Strategy (email + password)
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
  callbackURL: `http://localhost:${PORT}/auth/google/dashboard`,
}, async (accessToken, refreshToken, profile, done) => { // Añade `async`
    try {
        console.log('Verificando callback de Google:', profile);
        
        // Busca al usuario por su Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            // Si el usuario no existe, lo crea
            user = await User.create({
                googleId: profile.id,
                username: profile.displayName,
                email: profile.emails && profile.emails[0] && profile.emails[0].value,
                profileImageUrl: profile.photos && profile.photos[0] && profile.photos[0].value,
            });
        } else {
            // Si el usuario ya existe, actualiza su imagen de perfil
            // Esto asegura que siempre tengas la última imagen de perfil de Google
            if (profile.photos && profile.photos[0] && profile.photos[0].value) {
                user.profileImageUrl = profile.photos[0].value;
                await user.save();
            }
        }
        
        done(null, user); // Pasa el usuario a la siguiente etapa de Passport

    } catch (err) {
        done(err, null);
    }
}));


// Rutas de autenticación
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/dashboard',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // Si la autenticación es exitosa, se llega a esta función.
    const token = jwt.sign({
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role,
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Extrae la URL de la imagen de perfil del objeto de usuario de la DB
    const profileImageUrl = req.user.profileImageUrl || '';

    // Redirige al frontend, incluyendo el token y la URL de la imagen
    res.redirect(`http://localhost:${PORTREACT}/dashboard?token=${token}&profileImage=${encodeURIComponent(profileImageUrl)}`);
  }
);


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

        /*const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Siempre crea como 'super_admin' con esta ruta inicial
        const newUser = await createUser(email, passwordHash, ROLES.SUPER_ADMIN);*/
        const newUser = await createUser(email, password, ROLES.SUPER_ADMIN);
        res.status(201).json({ message: `Usuario ${ROLES.SUPER_ADMIN} creado exitosamente.`, userId: newUser._id });

    } catch (error) {
        console.error('Error al registrar usuario admin:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
});

// RUTA PARA QUE UN SUPER_ADMIN CREE OTROS USUARIOS (staff o super_admin)
app.post('/api/users/create', authenticateToken, authorize(ROLES.SUPER_ADMIN), async (req, res) => {
    const { email, password, role, profileImageUrl } = req.body;

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
        let finalProfileImageUrl;
        if (profileImageUrl) {
            finalProfileImageUrl = profileImageUrl.startsWith('/') ? profileImageUrl : `/${profileImageUrl}`;
        } else {
            finalProfileImageUrl = '/LogoSolo.jpg';
        }
        
        //const newUser = await createUser(email, password, role, finalProfileImageUrl);
        const newUser = await createUser(email, password, role, finalProfileImageUrl);
        res.status(201).json({ message: `Usuario ${role} creado exitosamente.`, userId: newUser._id });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear usuario.' });
    }
});

app.put('/api/users/update-role-password', authenticateToken, authorize([ROLES.SUPER_ADMIN]), async (req, res) => {
    const { email, newRole, newPassword } = req.body; // 'email' del usuario a modificar

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
        // Validar el nuevo rol si se proporciona
        if (newRole) {
            if (!Object.values(ROLES).includes(newRole)) {
                 return res.status(400).json({ message: `Rol inválido: ${newRole}. Roles permitidos: ${Object.values(ROLES).join(', ')}.` });
            }
            roleToSet = newRole;
        }

        // Llamada a la función updateUserRole con email, nuevo rol y nueva contraseña (si existe)
        const updatedUser = await updateUserRole(email, roleToSet, newPassword);
        if (updatedUser) {
            res.status(200).json({ message: 'Usuario actualizado con éxito.', user: { email: updatedUser.email, role: updatedUser.role } });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado o no se pudo actualizar.' });
        }
    } catch (error) {
        console.error('Error al actualizar rol/contraseña de usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar usuario.' });
    }
});

// Middleware para servir archivos estáticos (MANTENEMOS TU RUTA ORIGINAL)
app.use('/uploads', express.static(UPLOADS_DIR)); // Sigue sirviendo /public/uploads como /uploads
app.use(express.static(path.join(__dirname, '../frontend/crombieversario-app/dist'))); // Servir archivos de la build de React
app.use(express.static(path.join(__dirname, '../public')));

// ENDPOINT para obtener trabajadores desde el archivo JSON local
app.get('/trabajadores', async (req, res) => {
    const trabajadoresPath = path.join(__dirname, '../data/trabajadores.json');
    fs.readFile(trabajadoresPath, 'utf-8', async (err, data) => {
        if (err) {
            console.error('Error al leer trabajadores.json:', err);
            return res.status(500).json({ error: 'No se pudo leer el archivo de trabajadores.' });
        }
        try {
            const trabajadores = JSON.parse(data);

            // Obtener todos los usuarios del sistema de autenticación
            // Asegúrate de que User esté importado correctamente
            const users = await User.find({}, 'email role').lean();
            const userRolesMap = new Map(users.map(u => [u.email, u.role]));

            // Combinar datos de empleados con roles de usuario y añadir un 'id'
            const empleadosConRoles = trabajadores.map(empleado => {
                const role = userRolesMap.get(empleado.mail) || 'none';
                return {
                    ...empleado,
                    id: empleado.mail, // <--- AÑADIDO: Usa el mail como ID único para React keys
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

//Endpoint para obtener los mails enviados desde la base de datos
app.get('/api/aniversarios-enviados', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
    try {
        const enviados = await SentLog.find({});
        const enviadosOrdenados = enviados.sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));

        res.json(enviadosOrdenados);
    } catch (error) {
        console.error('Error al obtener aniversarios enviados:', error);
        res.status(500).json({ error: 'Error al obtener aniversarios enviados.' });
    }
});
/*app.get('/api/aniversarios-error', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
    try {
        const fallos = await FailedEmailLog.find({
            $or: [
                { status: 'failed' },
                { status: { $exists: false } }
            ]
        });
        
        const fallosOrdenados = fallos.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
        // El resto del código para formatear la respuesta se mantiene igual.
        const formattedFallos = fallosOrdenados.map(fallo => ({
            _id: fallo._id, // Es buena práctica pasar el ID para el 'key' de React
            nombre: fallo.nombre,
            apellido: fallo.apellido,
            email: fallo.email,
            years: fallo.years,
            sentDate: fallo.attemptDate, // Ahora es attemptDate
            errorMessage: fallo.errorMessage
        }));
        res.json(formattedFallos);
            // Ordenar desde el más reciente al más antiguo

    } catch (error) {
        console.error('Error al obtener aniversarios con error:', error);
        res.status(500).json({ error: 'Error al obtener los registros de error.' });
    }
}); */
app.get('/api/aniversarios-error', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
    try {
        // MODIFICACIÓN: La consulta ahora busca registros nuevos y antiguos.
        const fallos = await FailedEmailLog.find({
            $or: [
                { status: 'failed' },
                { status: { $exists: false } }
            ]
        });
        
        const fallosOrdenados = fallos.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
        // El resto del código para formatear la respuesta se mantiene igual.
        const formattedFallos = fallosOrdenados.map(fallo => ({
            _id: fallo._id, // Es buena práctica pasar el ID para el 'key' de React
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
});

// ENDPOINTS para la configuración
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
        // Agregamos este console.log para ver el resultado de la función.
        console.log('Datos de estadísticas anuales obtenidos:', stats); 
        res.json(stats);
    } catch (error) {
        console.error('Error en el endpoint /api/email-stats/yearly:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas de email.' });
    }
});
console.log('--- Ruta /api/email-stats/yearly registrada con éxito ---');

app.get('/api/email-stats/monthly', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
  console.log('Recibida petición GET /api/email-stats/monthly ');
  const year = req.query.year || new Date().getFullYear();
  try {
    const stats = await getMonthlyEmailStats(year);
    res.json(stats);
  } catch (error) {
    console.error('Error en el endpoint /api/email-stats/monthly:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas de email.' });
  }
});
console.log('--- Successfully registered /api/email-stats/monthly route ---');


console.log('--- Attempting to register /api/email-stats/week route ---');
app.get('/api/email-stats/week', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
  console.log('Recibida petición GET /api/email-stats/week ');
  try {
    const stats = await getLast7DaysTotals();
    res.json(stats);
  } catch (error) {
    console.error('Error en el endpoint /api/email-stats/week:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas de email.' });
  }
});
console.log('--- Successfully registered /api/email-stats/week route ---');


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
        console.error('Manejador de errores de carga final: ', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error al eliminar archivo subido tras un error en config:', err);
            });
        }
        
        return res.status(400).json({ 
            error: error.message || 'Error desconocido al subir imagen.'
        });
    }
});

app.delete('/api/delete-image', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.STAFF]), async (req, res) => {
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


// Envía el GIF transparente de 1x1 pixel directamente desde el servidor como parte de la respuesta HTTP a una solicitud. No lo saca de un archivo físico en el servidor. Asi funciona:

// Generación en memoria: El GIF se define como una cadena Base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'.

// Conversión a Buffer: Esta cadena Base64 se convierte en un Buffer en Node.js utilizando Buffer.from('...', 'base64'). Un Buffer es una representación binaria de datos, que es lo que se envía a través de la red.

// Encabezados HTTP: Cuando se realiza la solicitud al endpoint /track/:email/:anniversaryNumber, el servidor establece los encabezados HTTP Content-Type como image/gif y Content-Length con la longitud del Buffer del pixel. Esto le dice al cliente (el programa de correo) que lo que está recibiendo es una imagen GIF y su tamaño.

// Envío del Buffer: Finalmente, el método res.end(pixel) envía el contenido binario del Buffer directamente en el cuerpo de la respuesta HTTP.

// En resumen, el GIF no se almacena como un archivo .gif en el disco. Se crea dinámicamente en la memoria del servidor y se transmite directamente al cliente de correo cuando se solicita la URL de seguimiento.
