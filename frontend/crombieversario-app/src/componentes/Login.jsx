// src/componentes/LoginForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Ajusta la URL de la API según sea necesario
      const response = await axios.post('http://localhost:3033/api/login', {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('jwtToken', token);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);

      onLoginSuccess();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error de inicio de sesión:', err);
      if (err.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        setError(err.response.data.message || 'Error de autenticación. Verifica tus credenciales.');
      } else if (err.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        setError('No hay respuesta del servidor. Intenta de nuevo más tarde.');
      } else {
        // Algo más causó el error
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;