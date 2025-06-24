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

 const cantAniversario = [] ;
for (let i=0; i<trabajadores.length; i++){
    const trabajador = trabajadores[i];
    const { nombre, fechaEntrada, mail } = trabajador;
 const fechaIngreso = dayjs(fechaEntrada); //Sirve para cambiar de String a Fecha :) 
   


let fechaAniversario = fechaIngreso.year(enTresDias.year());

 const Aniversario = fechaAniversario.diff(fechaIngreso,'year');


if (fechaAniversario.isSame(enTresDias, 'day')) {
            console.log(`El trabajador ${nombre} cumplira su aniversario numero ${Aniversario}° en 3 dias.`);

        cantAniversario.push({
          nombre,
          fechaEntrada,
          mail
        });
         //evento?-->
          }
}
  return cantAniversario;
 };

function MensajeMail(nombre){
  return `¡Hola, ${nombre}!

Se viene una fecha muy especial... ¡tu Crombieversario! 🎂
Queremos agradecerte por ser parte de este camino y por compartir un año más con nosotros. Cada aporte tuyo suma a lo que hacemos día a día y nos hace crecer como equipo 💜
Para celebrarlo, armamos unas placas digitales que podés usar (si queres) para compartir en tus redes. Podés contar alguna reflexión sobre este tiempo en Crombie: aprendizajes, desafíos, alegrías o lo que más te haya marcado 💬 Te dejamos las imágenes abajo en este mail.

Si lo compartís, no te olvides de etiquetarnos para poder celebrarte también desde nuestras redes 🎈
¡Gracias por ser parte de Crombie!

Abrazo,
Equipo de Marketing`;

}


function Mail (cantTotalAniversario){
   for(i=0; i<cantTotalAniversario.length;i++){
   const empleado= cantTotalAniversario[i];
   const { nombre, fechaEntrada, mail } = empleado;
   console.log(nombre);
   const mensaje=MensajeMail(nombre);
   }

}



const cantTotalAniversario= AniversarioPersonas(trabajadores);
Mail(cantTotalAniversario);


/*
aniversarioPersona.on("aniversario",(fechaEntrada) => {
console.log(`El trabajador: ${nombre} cumplira en 3 dias su aniversario numero: ${aniversarioPersona}`);

});

aniversarioPersona.emit("aniversario", trabajadores.fechaEntrada);

//Llamar de la BD la fecha de ingreso

*/
