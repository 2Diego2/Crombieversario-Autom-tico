import './EditorMensaje.css';
// src/pages/EditorMensaje.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useConfig from '../componentes/useConfig'; // Asegúrate que la ruta sea correcta


function EditorMensaje() {
    // Usa el custom hook para obtener la configuración y los estados relacionados
    const { 
        config, 
        loading, 
        error, 
        API_BASE_URL,
        localApiKey,
        setConfig, 
        setLoading, 
        setError    
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
    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
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
}

export default EditorMensaje;