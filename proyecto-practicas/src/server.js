
//Se crea un servidor Express que valida una API key y devuelve trabajadores
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3033;

// Middleware para validar x-api-key
app.use((req, res, next) => {
  const apiKey = req.header('x-api-key');
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'API key inválida o faltante' });
  }
  next();
});


const trabajadores = [
{nombre: 'Juan',apellido: 'Perez',fechaEntrada:'2024-06-29',cumpleanios:'1990-08-27',mail:'juan@gmail.com'},
{nombre: 'Ana',apellido: 'Garcia',fechaEntrada:'2024-06-20',cumpleanios:'1985-12-05',mail:'anita@gmail.com'},
]; 


app.get('/trabajadores', (req, res) => {
  
    res.json(trabajadores);//
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

