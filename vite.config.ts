
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga variables de entorno desde archivo .env si existe
  // Fix: Remove explicit process.cwd() as loadEnv defaults to it, avoiding potential type errors.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: './', // Ensure relative paths for Electron build
    server: {
      port: 5173,
    },
    define: {
      // Expone la API Key al cliente de manera segura si está definida en el entorno
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ""),
      'process.env': process.env // Fallback para otras variables
    }
  };
});