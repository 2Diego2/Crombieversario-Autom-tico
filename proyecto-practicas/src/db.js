const mongoose = require('mongoose');

console.log('MONGO_URI:', process.env.MONGO_URI);
const trabajadorSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  fechaEntrada: String,
  cumpleanios: String,
  mail: String
});

const Trabajador = mongoose.model('Trabajador', trabajadorSchema, 'aniversarios');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB conectado exitosamente');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
  }
}

async function obtenerTrabajadores() {
  return await Trabajador.find({});
}

module.exports = {
  connectDB,
  obtenerTrabajadores
};

