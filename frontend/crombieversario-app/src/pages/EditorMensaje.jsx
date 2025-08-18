// src/pages/EditorMensaje.jsx
import React, { useState, useEffect } from "react";
import useConfig from "../componentes/useConfig";
import { toast } from "react-toastify";
import "./EditorMensaje.css";

function EditorMensaje() {
  const {
    config,
    loading,
    error,
    updateConfigApi,
    uploadImageApi,
    deleteImageApi,
  } = useConfig();
  // Usa el hook de autenticación para acceder a las funciones
  const { getAuthHeader } = useAuth(); 
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [messageTemplate, setMessageTemplate] = useState("");
  const [signedUrls, setSignedUrls] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [anniversaryNumber, setAnniversaryNumber] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (config) {
      setMessageTemplate(config.messageTemplate || "");
    }
  }, [config]);

  useEffect(() => {
    if (config?.imagePaths && config.imagePaths.length > 0) {
      const fetchUrls = async () => {
        const newSignedUrls = {};
        for (const fullPath of config.imagePaths) {
          try {
            const s3Key = fullPath.split(".amazonaws.com/")[1] || fullPath;

            // Haz la petición a la API con los encabezados de autenticación
            const response = await axios.get(
              `${API_BASE_URL}/api/get-signed-image-url/${s3Key}`,
              {
                headers: getAuthHeader(),
              }
            );
            newSignedUrls[fullPath] = response.data.signedUrl;
          } catch (err) {
            console.error(
              `Error al obtener URL firmada para ${fullPath}:`,
              err
            );
            newSignedUrls[fullPath] = null;
          }
        }
        setSignedUrls(newSignedUrls);
      };
      fetchUrls();
    } else {
      setSignedUrls({});
    }
    // Asegúrate de que las dependencias estén correctas.
  }, [config, API_BASE_URL, getAuthHeader]);

    const handleSaveMessage = async () => {
        setLocalError(null); // Limpiar errores previos al guardar
        setSuccessMessage("");
        try {
            await updateConfigApi(messageTemplate, config.imagePaths || []);
            setSuccessMessage(
                "Mensaje y configuración de imágenes guardados exitosamente!"
            );
        } catch (err) {
            setLocalError(
                "Error al guardar la configuración: " +
                    (err.response?.data?.message || err.message)
            );
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
            setLocalError(
                "Por favor, ingresa un número de aniversario válido (entero positivo)."
            );
            return;
        }

        const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
        if (fileExtension !== "png") {
            setLocalError(
                "Solo se permiten imágenes PNG. Por favor, selecciona un archivo .png"
            );
            return;
        }

        try {
            await uploadImageApi(selectedFile, parseInt(anniversaryNumber));
            setSelectedFile(null);
            setAnniversaryNumber("");
            setSuccessMessage("Imagen subida y agregada exitosamente!");
        } catch (err) {
            setLocalError(
            "Error al subir imagen: " + (err.response?.data?.message || err.message)
            );
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
            setLocalError(
                "Error al eliminar imagen: " +
                    (err.response?.data?.message || err.message)
            );
            console.error("Error al eliminar imagen:", err);
        }
    };

  // --- Lógica de renderizado basada en estados de carga y error ---

  // Si hay un error (del hook o local), lo mostramos primero
    if (localError) {
        return (
            <div className="Principal">
                <h2>Error</h2>
                <p style={{ color: "red" }}>{localError}</p>
                <button onClick={() => setLocalError(null)} className="botonCerrar">
                    Cerrar
                </button>
                {/* Considera aquí también un botón para ir al login si el error es 401/403 */}
                {error && error.includes("Sesión expirada") && (
                    <button
                        onClick={() => (window.location.href = "/login")}
                        className="botonLogin"
                    >
                        Ir a Login
                    </button>
                )}
            </div>
        );
    }

    if (loading || !config) {
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
             {successMessage && <p className="success">{successMessage}</p>}{" "}
            </div>

            {/* Sección de Gestión de Imágenes */}
            <div style={{ marginTop: "20px" }}>
                <h3>Imágenes del Mensaje:</h3>

                <div className="divImg">
                    {config.imagePaths?.length === 0 ? (
                        <p style={{ color: "#666" }}>No hay imágenes configuradas.</p>
                    ) : (
                        config.imagePaths.map((path) => {
                            const fileName = path.split("/").pop();
                            const anniversaryNum = fileName.split(".")[0];
                            const urlToDisplay = signedUrls[path];

                            if (!urlToDisplay)
                                return <p key={path}>Cargando imagen...</p>;

                            return (
                                <div key={path} className="img">
                                    <img
                                        src={urlToDisplay}
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
                    <div>
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
                    <div className="elegir">
                        <input
                            type="file"
                            id="file-upload"
                            onChange={handleFileChange}
                            accept="image/png"
                            style={{ display: "none" }}
                        />
                        <label htmlFor="file-upload" className="botonSubir">
                            Elegir archivo
                        </label>
                        {selectedFile && (
                            <p className="select">
                                Archivo seleccionado: {selectedFile.name}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleUploadImage}
                        disabled={loading || !selectedFile || !anniversaryNumber}
                        className="botonSubir"
                    >
                        {loading ? "Subiendo..." : "Subir Imagen"}
                    </button>
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