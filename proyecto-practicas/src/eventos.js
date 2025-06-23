/*Define y exporta los eventos personalizados usando 
EventEmitter. Aquí puedes manejar lo que ocurre cuando se detecta un aniversario */


const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");
const  EventEmitter = require("events");



const ruta = path.join(__dirname, "../data/trabajadores.json");


const personas = fs.readFileSync(ruta,"utf-8");
let trabajadores = JSON.parse(personas);



function AniversarioPersonas(trabajadores){
 const hoy=dayjs();
 const enTresDias = hoy.add(3,"day");

 //const empleados= [];
for (let i=0; i<trabajadores.length; i++){
    const trabajador = trabajadores[i];
    const { nombre, fechaEntrada, mail } = trabajador;
  console.log(nombre, fechaEntrada, mail);
 const fechaIngreso = dayjs(fechaEntrada); //Sirve para cambiar de String a Fecha :)


let fechaAniversario = fechaIngreso.year(enTresDias.year());

if (fechaAniversario = enTresDias){
    console.log(`El trabajador ${nombre} cumplira su aniversario en 3 dias. `);
}



console.log(fechaAniversario);
 

}

};

AniversarioPersonas(trabajadores);


/*
aniversarioPersona.on("aniversario",(fechaEntrada) => {
console.log(`El trabajador: ${nombre} cumplira en 3 dias su aniversario numero: ${aniversarioPersona}`);

});

aniversarioPersona.emit("aniversario", trabajadores.fechaEntrada);

//Llamar de la BD la fecha de ingreso

*/
