// src/pages/MailsErrorPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import useConfig from '../componentes/useConfig';
import './MailsErrorPage.css';
import axios from 'axios';

const MailsErrorPage = () => {
    const { API_BASE_URL, currentAuthToken, handleAuthError: useConfigHandleAuthError } = useConfig();
    const [mailsConError, setMailsConError] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleLocalError = useCallback((err) => {
        if (useConfigHandleAuthError) {
            useConfigHandleAuthError(err);
        } else {
            if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userEmail');
                setError("Sesión expirada o no autorizado. Por favor, inicia sesión de nuevo.");
                window.location.href = '/login';
            } else {
                setError("Error en la petición: " + (err.response?.data?.message || err.message || err.toString()));
            }
        }
    }, [useConfigHandleAuthError]);


    const fetchMails = useCallback(async () => {
        if (!currentAuthToken) {
            setLoading(false);
            setError("No autenticado. Por favor, inicie sesión.");
            return;
        }

        // Aquí también agregamos el log, para ver el valor justo antes de la petición
        console.log('DEBUG fetchMails: API_BASE_URL antes de la petición:', API_BASE_URL);
        console.log('➡️ lanzando fetch a', `${API_BASE_URL}/api/aniversarios-error`);
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/aniversarios-error`,
                {
                    headers: {
                        'Authorization': `Bearer ${currentAuthToken}`
                    }
                }
            );

            console.log('<< datos recibidos:', response.data);
            setMailsConError(response.data);
        } catch (err) {
            console.error('❌ fallo fetchMails:', err);
            handleLocalError(err);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, currentAuthToken, handleLocalError]);


    useEffect(() => {
        fetchMails();
    }, [fetchMails]);


    return (
        <div className="MailsErrorPage">
            <h2 className="mails">Mails no enviados</h2>

            {loading ? (
                <p>Cargando...</p>
            ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
            ) : mailsConError.length === 0 ? (
                <p>¡Excelente! No hay registros de correos que hayan fallado.</p>
            ) : (
                <div className='table'><table className="tablaMails">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Email</th>
                            <th>Años</th>
                            <th>Fecha del Intento</th>
                            <th>Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mailsConError.map((mail) => (
                            <tr key={mail._id}>
                                <td>{mail.nombre}</td>
                                <td>{mail.apellido}</td>
                                <td>{mail.email}</td>
                                <td>{mail.years}</td>
                                <td>
                                    {mail.sentDate
                                        ? new Date(mail.sentDate).toLocaleString('es-ES')
                                        : '—'}
                                </td>
                                <td>{mail.errorMessage || 'No especificado'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table></div>
            )}
        </div>
    );
};

export default MailsErrorPage;