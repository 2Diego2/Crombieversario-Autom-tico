import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Configura el proxy para tus rutas de API
    proxy: {
      '/api': { // Prefijo de las rutas de tu API
        target: 'http://localhost:3033', // URL de tu servidor Express
        changeOrigin: true, // Cambia el origen para que el backend piense que la petición viene del mismo origen
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Asegura que la ruta /api se mantenga
      },
      '/uploads': { // Para tus imágenes subidas
        target: 'http://localhost:3033',
        changeOrigin: true,
      },
      '/track': { // Para el pixel de seguimiento
        target: 'http://localhost:3033',
        changeOrigin: true,
      },
      '/trabajadores': { // Si tu frontend necesita acceder a esto directamente
        target: 'http://localhost:3033',
        changeOrigin: true,
      }
    },
  },
});