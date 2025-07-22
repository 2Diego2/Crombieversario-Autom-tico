// src/pages/EditorMensaje.jsx
import React, { useState, useEffect } from "react";
import useConfig from "../componentes/useConfig";
import "./EditorMensaje.css";

function EditorMensaje() {
  const {
    config,
    loading,
    error,
    updateConfigApi,
    uploadImageApi,
    deleteImageApi,
    // No necesitamos refetchConfig directamente aquí a menos que quieras un botón de recarga manual
  } = useConfig();

  // Estados internos para cambios locales antes de guardar, y para la selección de archivos
  const [messageTemplate, setMessageTemplate] = useState("");
  const [imagePaths, setImagePaths] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [anniversaryNumber, setAnniversaryNumber] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState(null); // Usaremos un error local para mensajes específicos de la UI

  // Inicializa los estados locales una vez que la configuración se carga desde el hook
  useEffect(() => {
    if (config) {
      setMessageTemplate(config.messageTemplate || "");
      setImagePaths(config.imagePaths || []); // Actualiza imagePaths cuando config cambia
    }
  }, [config]); // Depende de 'config'

  // Sincroniza el error del hook con el error local
  useEffect(() => {
    if (error) {
      setLocalError(error);
    } else {
      setLocalError(null);
    }
  }, [error]);

  const handleSaveMessage = async () => {
    setLocalError(null); // Limpiar errores previos al guardar
    setSuccessMessage("");
    try {
      await updateConfigApi(messageTemplate, imagePaths);
      setSuccessMessage("Mensaje y configuración de imágenes guardados exitosamente!");
    } catch (err) {
      setLocalError("Error al guardar la configuración: " + (err.response?.data?.message || err.message));
      console.error("Error al guardar configuración:", err);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleAnniversaryNumberChange = (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setAnniversaryNumber(value);
    }
  };

  const handleUploadImage = async () => {
    setLocalError(null);
    setSuccessMessage("");

    if (!selectedFile) {
      setLocalError("Por favor, selecciona una imagen para subir.");
      return;
    }
    if (!anniversaryNumber || parseInt(anniversaryNumber) <= 0) {
      setLocalError("Por favor, ingresa un número de aniversario válido (entero positivo).");
      return;
    }

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (fileExtension !== "png") {
      setLocalError("Solo se permiten imágenes PNG. Por favor, selecciona un archivo .png");
      return;
    }

    try {
      await uploadImageApi(selectedFile, parseInt(anniversaryNumber));
      setSelectedFile(null);
      setAnniversaryNumber("");
      setSuccessMessage("Imagen subida y agregada exitosamente!");
    } catch (err) {
      setLocalError("Error al subir imagen: " + (err.response?.data?.message || err.message));
      console.error("Error detallado al subir imagen:", err.response || err);
    }
  };

  const handleDeleteImage = async (imageUrlToDelete) => {
    setLocalError(null);
    setSuccessMessage("");

    try {
      await deleteImageApi(imageUrlToDelete);
      setSuccessMessage("Imagen eliminada exitosamente!");
    } catch (err) {
      setLocalError("Error al eliminar imagen: " + (err.response?.data?.message || err.message));
      console.error("Error al eliminar imagen:", err);
    }
  };

  // --- Lógica de renderizado basada en estados de carga y error ---

  // Si hay un error (del hook o local), lo mostramos primero
  if (localError) {
    return (
      <div className="Principal">
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{localError}</p>
        <button onClick={() => setLocalError(null)} className="botonCerrar">Cerrar</button>
        {/* Considera aquí también un botón para ir al login si el error es 401/403 */}
        {error && error.includes("Sesión expirada") && (
            <button onClick={() => window.location.href = '/login'} className="botonLogin">Ir a Login</button>
        )}
      </div>
    );
  }

  // Si está cargando O el objeto config aún no está disponible (puede ser la primera carga)
  if (loading || !config || (Object.keys(config).length === 0 && !messageTemplate && imagePaths.length === 0)) {
    return <p>Cargando configuración...</p>;
  }

  // --- Fin de la lógica de renderizado inicial ---

  return (
    <div className="Principal">
      <h2>Página de Mensaje Editable</h2>

      {/* Sección de Edición del Mensaje */}
      <div style={{ marginBottom: "30px" }}>
        <label htmlFor="messageTemplate" className="mensaje">
          Mensaje del Crombieversario:
        </label>
        <textarea
          id="messageTemplate"
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          rows="15"
          className="mensajeTemplate"
        />
        <button
          onClick={handleSaveMessage}
          disabled={loading}
          className="botonGuardar"
        >
          {loading ? "Guardando Mensaje..." : "Guardar Mensaje"}
        </button>
        {successMessage && (
          <p className='success'>{successMessage}</p>
        )}
      </div>

      {/* Sección de Gestión de Imágenes */}
      <div style={{ marginTop: "20px" }}>
        <h3>Imágenes del Mensaje:</h3>

        <div className="divImg">
          {imagePaths.length === 0 ? (
            <p style={{ color: "#666" }}>No hay imágenes configuradas.</p>
          ) : (
            imagePaths.map((path, index) => {
              const fileName = path.substring(path.lastIndexOf("/") + 1);
              const anniversaryNum = fileName.split(".")[0];
              return (
                <div
                  key={path}
                  className="img"
                >
                  <img
                    src={path}
                    alt={`Aniversario ${anniversaryNum}`}
                    className="imagenes"
                  />
                  <button
                    onClick={() => handleDeleteImage(path)}
                    className="botonDelete"
                    title={`Eliminar imagen de ${anniversaryNum} años`}
                  >
                    &times;
                  </button>
                  <p className="etiqueta">{anniversaryNum} años</p>
                </div>
              );
            })
          )}
        </div>

        <div className="divSubir">
          <h4>Subir nueva imagen para aniversario:</h4>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="anniversaryNumber">Número de aniversario:</label>
            <input
              type="number"
              id="anniversaryNumber"
              value={anniversaryNumber}
              onChange={handleAnniversaryNumberChange}
              min="1"
              placeholder="Ej: 5"
              className="numero"
            />
          </div>
          <input type="file" onChange={handleFileChange} accept="image/png" />
          <button
            onClick={handleUploadImage}
            disabled={loading || !selectedFile || !anniversaryNumber}
            className="botonSubir"
          >
            {loading ? "Subiendo..." : "Subir Imagen"}
          </button>
          {selectedFile && (
            <p className="select">Archivo seleccionado: {selectedFile.name}</p>
          )}
          {/* El mensaje de error local se muestra aquí */}
          {localError && (
            <div className="error">
              {localError}
              <button
                onClick={() => setLocalError(null)}
                className="botonCerrar"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorMensaje;