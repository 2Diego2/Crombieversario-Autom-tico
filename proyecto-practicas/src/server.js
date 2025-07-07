
//Se crea un servidor Express que valida una API key y devuelve trabajadores, para despues llamar
// a la api de este servidor en eventos.js y guardar los datos en la base de datos en MongoDB
require('dotenv').config();
const express = require('express');
const crypto= require("crypto");
const updateEnvFile = require('./utils/saveEnv');


const app = express();
const PORT = 3033;

// Si no hay una API Key en el archivo .env o es un placeholder, generamos una nueva
if (!process.env.API_KEY || process.env.API_KEY === '(dir_name)') {
  const newApiKey = crypto.randomBytes(32).toString('hex'); // Genera una clave de 64 caracteres
  updateEnvFile('API_KEY', newApiKey); // Guardamos la nueva API Key en el archivo .env
  process.env.API_KEY = newApiKey; // Actualizamos la clave en tiempo de ejecución
}


// Middleware para validar x-api-key
app.use((req, res, next) => {
  const apiKey = req.header('x-api-key');
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'API key inválida o faltante' });
  } 
  next();
});


const trabajadores = [
{nombre: 'Juan',apellido: 'Perez',fechaEntrada:'2024-07-10',cumpleanios:'1990-08-27',mail:'diegoabelleyra74@gmail.com'},
{nombre: 'Ana',apellido: 'Garcia',fechaEntrada:'2024-06-20',cumpleanios:'1985-12-05',mail:'anita@gmail.com'},
]; 

app.get('/trabajadores', (req, res) => {

    res.json(trabajadores);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

