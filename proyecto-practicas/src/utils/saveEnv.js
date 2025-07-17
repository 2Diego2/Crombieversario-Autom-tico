//saveEnv.js
//Se genera una api key y se guarda en el archivo .env, si no existe se crea el archivo.
const path = require('path');
const fs = require('fs');

// Función para actualizar el archivo .env
function updateEnvFile(key, value) {
  // Ruta al archivo .env en la raíz del proyecto (proyecto-practica)
 const envPath = path.resolve(__dirname, '../../.env'); // Subimos un nivel con '../' para acceder a la raíz
  let envContent = '';

  // Verifica si el archivo .env ya existe
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    const regex = new RegExp(`^${key}=.*$`, 'm'); // Busca la línea de la clave

    // Si la clave ya existe, la reemplaza
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`; // Si no existe, la agrega al final
    }
  } else {
    envContent = `${key}=${value}`; // Si el archivo no existe, lo crea
  }

  // Escribe el contenido actualizado en el archivo .env
  fs.writeFileSync(envPath, envContent);
  console.log(`API Key guardada en .env: ${value}`);
}

module.exports = updateEnvFile;
