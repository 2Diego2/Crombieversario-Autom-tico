//Se conecta a la base de datos y guarda informacion de los aniversarios que se cumplieron.
const mongoose = require('mongoose');

const aniversarioSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  fechaEntrada: String,
  cumpleanios: String,
  mail: String,
  nroAniversario: Number,
  imagen: [String],
  fechaRegistro: {
  type: Date,
  default: () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))
}
  //MongoDB seguirá mostrando en UTC la fecha en Compass, pero internamente la hora estará correctamente ajustada. 
  //Si necesitás visualizarla siempre como hora local, deberás formatearla en el cliente,(por ejemplo, en una app web o al mostrarla en consola)
});

const Aniversario = mongoose.model('Aniversario', aniversarioSchema, 'aniversarios');

async function connectDB() {
  try {
await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado exitosamente');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
  }
}

async function guardarAniversario(data) {
  try {
    console.log('Datos a guardar:', data); 
    const nuevo = new Aniversario(data);
    await nuevo.save();
    console.log('Aniversario guardado en MongoDB');
  } catch (error) {
    console.error('Error guardando aniversario:', error.message);
  }
}
module.exports = {
  connectDB,
  guardarAniversario
};