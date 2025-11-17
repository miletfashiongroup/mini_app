import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import reactSwc from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'));
  const isVitest = mode === 'test' || process.env.VITEST;
  const backendUrl =
    process.env.VITE_BACKEND_URL || env.VITE_BACKEND_URL || 'http://localhost:8000';

  return {
    plugins: [isVitest ? react() : reactSwc()],
    define: {
      __BACKEND_URL__: JSON.stringify(backendUrl),
    },
    server: {
      port: 4173,
      host: '0.0.0.0',
    },
    build: {
      sourcemap: true,
      outDir: 'dist',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
    },
    envDir: path.resolve(__dirname, '../../'),
  };
});
