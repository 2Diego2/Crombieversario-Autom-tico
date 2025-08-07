// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

import LoginForm from './componentes/Login';
import DashboardContent from './componentes/Dashboard'; 
import useAuth from './componentes/useAuth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null); 
  const navigate = useNavigate();

  const { logout: authLogout } = useAuth(); 

  // Inicializar el estado de autenticación y cargar los datos del usuario 
  // desde localStorage al inicio de la aplicación.
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    const profileImage = localStorage.getItem('userProfileImage');

    if (token && email && role) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserRole(role);
      setUserProfileImage(profileImage);
    } else {
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserRole(null);
      setUserProfileImage(null);
      // Solo redirige a /login si no estás ya en esa ruta para evitar bucles
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    authLogout(); // Esto limpiará localStorage y redirigirá al login
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    setUserProfileImage(null);
  };


  if (loading) {
    return <div>Cargando configuración...</div>;
  }

  if (error) {
    return <div>Error al cargar la aplicación: {error}</div>;
  }

  console.log("API Key disponible en App:", localApiKey); // Para verificar que la API Key llega aquí también




  
  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <LoginForm onLoginSuccess={(userData) => {
            localStorage.setItem('jwtToken', userData.token);
            localStorage.setItem('userEmail', userData.email);
            localStorage.setItem('userRole', userData.role);
            // Guarda la imagen de perfil si está disponible
            if (userData.profileImageUrl) {
              localStorage.setItem('userProfileImage', userData.profileImageUrl);
            } else {
              localStorage.removeItem('userProfileImage'); // Asegúrate de limpiar si no hay imagen
            }
            
            // Actualiza los estados de App.jsx
            setIsAuthenticated(true);
            setUserEmail(userData.email);
            setUserRole(userData.role);
            setUserProfileImage(userData.profileImageUrl || null); // Usa null si no hay imagen
            
            navigate('/dashboard', { replace: true });
          }} />
        )
      } />

      <Route
        path="/dashboard/*"
        element={
          isAuthenticated ? (
            <DashboardContent
              onLogout={handleLogout}
              userEmail={userEmail}
              userRole={userRole}
              userProfileImage={userProfileImage} // Pasa la URL de la imagen de perfil
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;