// src/pages/Mensaje.jsx

import React from 'react';
import EditorMensaje from '../componentes/EditorMensaje.jsx';

const Mensaje = () => { // Asegúrate de que el nombre del componente coincida
  return (
    <div>
      <h2>Gestión de Mensaje y Contenido Visual</h2>
      <EditorMensaje />
      {/* ... tu contenido ... */}
    </div>
  );
};

export default Mensaje;