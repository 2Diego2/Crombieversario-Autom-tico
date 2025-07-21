import './EditorMensaje.css';
// src/pages/EditorMensaje.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import useConfig from "../componentes/useConfig";
import "./EditorMensaje.css";


function EditorMensaje() {
  // Obtener la configuración y los estados relacionados
  const {
    config,
    loading,
    error,
    API_BASE_URL,
    localApiKey,
    setConfig,
    setLoading,
    setError,
  } = useConfig();

    // Estados internos para cambios locales antes de guardar, y para la selección de archivos
    const [messageTemplate, setMessageTemplate] = useState('');
    const [imagePaths, setImagePaths] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    

    // Inicializa los estados locales una vez que la configuración se carga desde el hook
    useEffect(() => {
        if (config) {
            setMessageTemplate(config.messageTemplate || '');
            setImagePaths(config.imagePaths || []);
        }
    }, [config]);

    const handleSaveMessage = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            await axios.put(`${API_BASE_URL}/api/config`, { messageTemplate, imagePaths }, {
                headers: { 'x-api-key': localApiKey, 'Content-Type': 'application/json' }
            });
            // Si guardas correctamente, actualiza la configuración en el estado del hook
            setConfig(prevConfig => ({ ...prevConfig, messageTemplate, imagePaths }));
            setSuccessMessage('¡Mensaje y configuración de imágenes guardados exitosamente!');
        } catch (err) {
            setError('Error al guardar la configuración: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUploadImage = async () => {
        if (!selectedFile) {
            setError('Por favor, selecciona una imagen para subir.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage('');

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/upload-image`, formData, {
                headers: {
                    'x-api-key': localApiKey,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Si subes correctamente, actualiza la configuración en el estado del hook
            setConfig(response.data.updatedConfig);
            setSelectedFile(null);
            setSuccessMessage('¡Imagen subida y agregada!');
        } catch (err) {
            setError('Error al subir imagen: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteImage = async (imageUrlToDelete) => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            await axios.delete(`${API_BASE_URL}/api/delete-image`, {
                headers: {
                    'x-api-key': localApiKey,
                    'Content-Type': 'application/json'
                },
                data: { imageUrl: imageUrlToDelete }
            });
            // Si eliminas correctamente, actualiza la configuración en el estado del hook
            setConfig(prevConfig => ({
                ...prevConfig,
                imagePaths: prevConfig.imagePaths.filter(path => path !== imageUrlToDelete)
            }));
            setSuccessMessage('¡Imagen eliminada!');
        } catch (err) {
            setError('Error al eliminar imagen: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Muestra un mensaje de carga o error si es necesario.
    // Solo muestra "Cargando..." si realmente no hay datos de configuración aún.
    if (loading && (!config.messageTemplate && imagePaths.length === 0 && !error)) {
        return <p>Cargando configuración...</p>;
    }
  } [config];

  const handleSaveMessage = async () => {
    setLoading(true);
    setError(null); // Limpiar errores previos al guardar
    setSuccessMessage("");
    try {
      await axios.put(
        `${API_BASE_URL}/api/config`,
        { messageTemplate, imagePaths },
        {
          headers: {
            "x-api-key": localApiKey,
            "Content-Type": "application/json",
          },
        }
      );
      // Al guardar, actualizamos el estado de config con las rutas actuales de imagePaths
      setConfig((prevConfig) => ({
        ...prevConfig,
        messageTemplate,
        imagePaths,
      }));
      setSuccessMessage(
        "Mensaje y configuración de imágenes guardados exitosamente!"
      );
    } catch (err) {
      setError(
        "Error al guardar la configuración: " +
          (err.response?.data?.error || err.message)
      );
      console.error("Error al guardar configuración:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Función para manejar el cambio en el número de aniversario
  const handleAnniversaryNumberChange = (event) => {
    const value = event.target.value;
    // Permite solo números y asegura que sea un entero positivo
    if (/^\d*$/.test(value)) {
      setAnniversaryNumber(value);
    }
  };

  const handleUploadImage = async () => {
    setError(null);
    setSuccessMessage("");

    if (!selectedFile) {
      setError("Por favor, selecciona una imagen para subir.");
      return;
    }
    if (!anniversaryNumber || parseInt(anniversaryNumber) <= 0) {
      setError(
        "Por favor, ingresa un número de aniversario válido (entero positivo)."
      );
      return;
    }

    return (
        <div className='mensaje-editable'>
            <h2>Mensaje editable</h2>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            {/* Sección de Edición del Mensaje */}
            <div className='edicion-mensaje'>
                <label htmlFor="messageTemplate" className='mensaje-crombieversario'>
                    Mensaje de Crombieversario:
                </label>
                <textarea
                    id="messageTemplate"
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)} className='message-template'
                    rows="15"
                />
                <button
                    onClick={handleSaveMessage}
                    disabled={loading} className='guardar-mensaje'
                >
                    {loading ? 'Guardando Mensaje...' : 'Guardar Mensaje'}
                </button>
            </div>

            {/* Sección de Gestión de Imágenes */}
            <div className='gestion-imagenes'>
                <h3>Imágenes del mensaje:</h3>

                <div className='caja-imagenes'>
                    {imagePaths.length === 0 ? (
                        <p style={{ color: '#666' }}>No hay imágenes configuradas.</p>
                    ) : (
                        imagePaths.map((path, index) => (
                            <div className='disposicion-imagenes'>
                                <img
                                    src={`${API_BASE_URL}${path}`} // URL completa de la imagen, usa API_BASE_URL del hook
                                    alt={`Aniversario ${index + 1}`}
                                    style={{ width: '100px', height: '100px', objectFit: 'cover', display: 'block' }}
                                />
                                <button className='boton-eliminar-imagen' onClick={() => handleDeleteImage(path)}
                                >
                                    &times;
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className='subir-imagen'>
                    <h4>Subir nueva imagen:</h4>
                    <input
                         type="file"
                         id="fileInput"
                         style={{ display: 'none' }}
                         onChange={handleFileChange}
                        accept="image/*"
                    />
                    <button
                        className='boton-subir-imagen'
                        onClick={() => document.getElementById('fileInput').click()}
                        disabled={loading}
                    >
                        {loading ? 'Subiendo...' : 'Subir Imagen'}
                    </button>
                    {selectedFile && (
                        <p style={{ fontSize: '0.9em', color: '#555', marginTop: '5px' }}>
                            Archivo seleccionado: {selectedFile.name}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
    console.log("   Número de Aniversario enviado en URL:", anniversaryNumber); // <--- New log

    try {
      const response = await axios.post(uploadUrl, formData, {
        // <--- Use the new URL here
        headers: {
          "x-api-key": localApiKey,
        },
      });
      setConfig(response.data.updatedConfig);
      setImagePaths(response.data.updatedConfig.imagePaths);
      setSelectedFile(null);
      setAnniversaryNumber("");
      setSuccessMessage("Imagen subida y agregada exitosamente!");
    } catch (err) {
      setError(
        "Error al subir imagen: " + (err.response?.data?.error || err.message)
      );
      console.error("Error detallado al subir imagen:", err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageUrlToDelete) => {
    setLoading(true);
    setError(null); // Limpiar errores previos al eliminar
    setSuccessMessage("");

    try {
      await axios.delete(`${API_BASE_URL}/api/delete-image`, {
        headers: {
          "x-api-key": localApiKey,
          "Content-Type": "application/json",
        },
        data: { imageUrl: imageUrlToDelete }, // El cuerpo de la petición DELETE
      });
      // El backend ya debería haber eliminado el archivo y actualizado la DB.
      // Aquí, actualizamos el estado local de imagePaths y la configuración global.
      setConfig((prevConfig) => ({
        ...prevConfig,
        imagePaths: prevConfig.imagePaths.filter(
          (path) => path !== imageUrlToDelete
        ),
      }));
      setImagePaths((prevImagePaths) =>
        prevImagePaths.filter((path) => path !== imageUrlToDelete)
      );
      setSuccessMessage("Imagen eliminada exitosamente!");
    } catch (err) {
      setError(
        "Error al eliminar imagen: " +
          (err.response?.data?.error || err.message)
      );
      console.error("Error al eliminar imagen:", err);
    } finally {
      setLoading(false);
    }
  };

  // La lógica de carga inicial se mantiene similar, pero sin el retorno completo del componente
  if (loading && (!config || (imagePaths.length === 0 && !error))) {
    return <p>Cargando configuración...</p>;
  }

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
              // Extrae el número del aniversario del nombre del archivo para mostrarlo
              const fileName = path.substring(path.lastIndexOf("/") + 1);
              const anniversaryNum = fileName.split(".")[0]; // Asume "X.png"
              return (
                <div
                  key={path}
                  className="img"
                >
                  <img
                    src={`${API_BASE_URL}${path}`}
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
          {error && (
            <div className="error">
              {error}
              <button
                onClick={() => setError(null)} // Botón para cerrar el mensaje de error
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

export default EditorMensaje;
