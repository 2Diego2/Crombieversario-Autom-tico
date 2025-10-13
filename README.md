# Crombieversario Automático
## Descripción
Crombieversario Automático es una plataforma full-stack que integra datos de empleados desde PeopleForce API, genera mensajes personalizados con imágenes almacenadas en AWS S3, y administra el historial de envíos y errores mediante MongoDB README.md:5 . El sistema ahorra tiempo al área de marketing y mejora la experiencia de los colaboradores.
## Características 
Automatización de correos: Envío programado diario de correos de aniversario y cumpleaños
Integración con PeopleForce: Sincronización automática de datos de empleados 
Gestión de imágenes: Almacenamiento en AWS S3 con imágenes personalizadas por años de aniversario
Autenticación: Sistema de login con Google OAuth y JWT 
Roles de usuario: Sistema de permisos con roles SUPER_ADMIN y STAFF 
Estadísticas: Visualización de correos enviados, abiertos y errores por año, mes y semana 
Editor de mensajes: Interfaz para personalizar plantillas de correo 
Calendario de eventos: Visualización de próximos cumpleaños y aniversarios.
## Instalación
**Descargar e instalar Node.js**

    Ve a la página oficial de Node.js: https://nodejs.org
    Descarga la versión recomendada para tu sistema operativo (LTS es la versión estable y recomendada para producción).
    node -v
    npm -v
1. **Clona el repositorio:**
   ```
   git clone https://github.com/tu-usuario/crombieversario-automatico.git
   cd crombieversario-automatico
2. **Instala dependencias del backend:**
   ```
   cd proyecto-practicas
   npm install
3.**Instala dependencias del frontend:**

    cd ../frontend/crombieversario-app
    npm install
4.**Configura variables de entorno:**
    ```   
  
    Copia el archivo .env.example a .env en proyecto-practicas/ y completa los valores requeridos (API keys, credenciales de correo, etc.).
5.**Inicia el backend:**         
    
    cd ../../proyecto-practicas
    npm start
6.***Inicia el frontend:**

    cd ../frontend/crombieversario-app
    npm run dev
## Configuración 
**Variables de entorno del Backend**
````
Crea un archivo .env en backend/ con las siguientes variables:
````
**Gmail (Nodemailer) :**
````
GMAIL_USER: Cuenta de Gmail para enviar correos
GMAIL_APP_PASSWORD: Contraseña de aplicación de Google (no la contraseña normal)
````
**MongoDB:**
````
MONGO_URI: Cadena de conexión (MongoDB Atlas recomendado o local)
DB_NAME: Nombre de la base de datos
````
````
**PeopleForce API :**
````
````
PEOPLEFORCE_API_KEY: Clave API de PeopleForce
PEOPLEFORCE_API_URL: URL del endpoint de empleados
````
**Servidor:**
````
PORT: Puerto del backend (default: 3033)
SERVER_BASE_URL: URL base del servidor
FRONTEND_BASE_URL: URL del frontend
````
**Seguridad:**
````
JWT_SECRET: Secreto para tokens JWT
API_KEY: Clave API interna
````
**AWS S3 :**
````
AWS_ACCESS_KEY_ID: ID de acceso AWS
AWS_SECRET_ACCESS_KEY: Clave secreta AWS
AWS_S3_REGION: Región (us-east-2)
AWS_S3_BUCKET_NAME: Nombre del bucket
````
**Google OAuth :**
````
GOOGLE_CLIENT_ID: ID de cliente OAuth
GOOGLE_CLIENT_SECRET: Secreto de cliente OAuth
````
**Configuración con Docker**
````
El proyecto incluye docker-compose.yml para despliegue containerizado. Los servicios incluyen:
mongodb: Base de datos MongoDB con persistencia de datos 
backend: Servidor Node.js/Express en puerto 3033 
frontend: Aplicación React servida en puerto 80 
````
**Estructura de Directorios**
````
crombieversario-automatico/  
├── backend/                          # Backend Node.js  
│   ├── src/  
│   │   ├── server.js                # Servidor Express y endpoints API  
│   │   └── index.js                 # Scheduler de tareas cron  
│   ├── .env                         # Variables de entorno backend  
│   └── Dockerfile                   # Imagen Docker backend  
├── frontend/crombieversario-app/    # Frontend React  
│   ├── src/  
│   │   ├── componentes/             # Componentes reutilizables  
│   │   │   ├── useConfig.js        # Hook para configuración  
│   │   │   ├── useAuth.js          # Hook de autenticación  
│   │   │   ├── useEstadisticasMail.js  # Hook estadísticas  
│   │   │   └── useEventosProximos.js   # Hook eventos  
│   │   └── pages/                   # Páginas principales  
│   │       ├── EditorMensaje.jsx   # Editor de plantillas  
│   │       └── EmpleadosPage.jsx   # Gestión de empleados  
│   ├── package.json                # Dependencias frontend  
│   └── Dockerfile                  # Imagen Docker frontend  
├── docker-compose.yml              # Orquestación de contenedores  
└── README.md   

````
**Tareas Automatizadas**
````
El sistema ejecuta tareas programadas mediante node-cron para el envío automático de correos.
Flujo de automatización:
-Sincronización de datos de empleados desde PeopleForce API
-Consulta de aniversarios y cumpleaños del día
-Generación de correos personalizados con plantillas
-Obtención de imágenes correspondientes desde AWS S3
-Envío de correos mediante Gmail SMTP
-Registro de envíos exitosos en sentLogs
-Registro de errores en errorLogs
````
**Endpoints de la API**
*Autenticación*
````
POST /api/users/create: Crear nuevo usuario 
PUT /api/users/update-role-password: Actualizar rol y contraseña
````
*Configuración*
````
GET /api/config: Obtener configuración de mensajes e imágenes 
PUT /api/config: Actualizar plantilla de mensaje
````
*Imágenes*
````
POST /api/upload-image/:anniversaryNumber: Subir imagen de aniversario a S3
````
*Estadísticas*
````
GET /api/email-stats/yearly: Estadísticas anuales de correos
GET /api/email-stats/monthly?year=YYYY: Estadísticas mensuales por año
````
*Empleados* 
````
GET /trabajadores: Obtener lista de empleados
````
*Autenticación requerida: Todos los endpoints requieren token JWT en el header Authorization useConfig.js:30.*
*Tecnologías utilizadas*
````
Backend: Node.js, Express, MongoDB, Mongoose, Nodemailer
Frontend: React, Vite
Otros: AWS S3, Ngrok, Passport.js, dotenv, cron, CSS

````
