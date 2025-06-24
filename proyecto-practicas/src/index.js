/*3. index.js
Es el archivo principal. Lee los datos, usa las utilidades y emite eventos según la lógica. */

const fs = require("fs");
const path = require("path");
const { aniversarioEmitter, buscarAniversarios, MensajeMail } = require("./eventos");

const ruta = path.join(__dirname, "../data/trabajadores.json");
const trabajadores = JSON.parse(fs.readFileSync(ruta, "utf-8"));

aniversarioEmitter.on("sinAniversarios", () => {
  console.log("No hay trabajadores que cumplan aniversario en 3 días.");
});

// Escucha el evento y muestra un mensaje personalizado
aniversarioEmitter.on("aniversario", (empleado) => {
  console.log(`El trabajador ${empleado.nombre} (${empleado.mail}) cumplirá su aniversario número ${empleado.nroAniversario}° en 3 días.`);
  const mensaje = MensajeMail(empleado.nombre, empleado.imagen);
  console.log("Mensaje para enviar por mail:");
  console.log(mensaje);
  console.log("--------------------------------------------------");
});

// Ejecuta la búsqueda de aniversarios
buscarAniversarios(trabajadores);