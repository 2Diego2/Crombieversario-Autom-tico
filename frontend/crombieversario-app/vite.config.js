import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // El proxy para las imágenes ya no es necesario
    proxy: {
      '/api': {
        target: 'http://localhost:3033',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/track': {
        target: 'http://localhost:3033',
        changeOrigin: true,
      },
      '/trabajadores': {
        target: 'http://localhost:3033',
        changeOrigin: true,
      }
    },
  },
});