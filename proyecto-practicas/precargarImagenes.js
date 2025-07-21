// Script para precargar las rutas de imagenes.json en el array imagePaths de la config de MongoDB
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, getConfig, updateConfig } = require('./src/db');

async function precargarImagenes() {
  await connectDB(); // Conéctate a MongoDB antes de hacer nada
  // Lee imagenes.json
  const imagenesPath = path.join(__dirname, 'data', 'imagenes.json');
  const imagenes = JSON.parse(fs.readFileSync(imagenesPath, 'utf-8'));
  const rutas = imagenes.map(img => img.ruta);

  // Obtiene la config actual
  const config = await getConfig();
  // Actualiza solo imagePaths, mantiene el mensaje
  await updateConfig(config.messageTemplate, rutas);
  console.log('Rutas de imágenes precargadas en la base de datos:', rutas);
  process.exit(0);
}

precargarImagenes();
