import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactSwc from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isVitest = mode === 'test' || process.env.VITEST;

  return {
    plugins: [isVitest ? react() : reactSwc()],
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
