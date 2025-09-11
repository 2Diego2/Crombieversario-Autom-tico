# Crombieversario Automático

## Descripción

Crombieversario Automático es una plataforma para automatizar el envío de correos de aniversario y cumpleaños a empleados de Crombie. El sistema integra datos de empleados, genera mensajes personalizados y administra el historial de envíos y errores, ahorrando tiempo al área de marketing y mejorando la experiencia de los colaboradores.

## Instalación

1. **Clona el repositorio:**
   ```sh
   git clone https://github.com/tu-usuario/crombieversario-automatico.git
   cd crombieversario-automatico
2. **Instala dependencias del backend:**
   ```sh
   cd proyecto-practicas
   npm install
3.**Instala dependencias del frontend:**

    cd ../frontend/crombieversario-app
    npm install
4.**Configura variables de entorno:**
    ```sh     
  
    Copia el archivo .env.example a .env en proyecto-practicas/ y completa los valores requeridos (API keys, credenciales de correo, etc.).
5.**Inicia el backend:**         
    
    cd ../../proyecto-practicas
    npm start
6.Inicia el frontend:

    cd ../frontend/crombieversario-app
    npm run dev

## Uso
# Accede a la interfaz web en http://localhost:5173.
# Configura el mensaje de aniversario desde el editor.
# Visualiza estadísticas de correos enviados y errores.
# Administra empleados y revisa próximos eventos.
# El backend expone una API REST para operaciones administrativas y automatización.

## Contribuciones
# Haz un fork del repositorio.
# Crea una rama nueva para tu funcionalidad: git checkout -b feature/nueva-funcionalidad
# Realiza tus cambios y haz commit.
# Envía un pull request describiendo tu aporte.
# Sigue las buenas prácticas de código y documentación.

## Tecnologías utilizadas
# Backend: Node.js, Express, MongoDB, Mongoose, Nodemailer
# Frontend: React, Vite
# Otros: AWS S3, Ngrok, Passport.js, dotenv, cron, CSS
