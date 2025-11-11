import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'));

  return {
    plugins: [react()],
    define: {
      __BACKEND_URL__: JSON.stringify(env.VITE_BACKEND_URL || 'http://localhost:8000'),
    },
    server: {
      port: 4173,
      host: '0.0.0.0',
    },
    build: {
      sourcemap: true,
      outDir: 'dist',
    }, //проверка
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    envDir: path.resolve(__dirname, '../../'),
  };
});
