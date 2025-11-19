import path from 'path';

import reactSwc from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';


export default defineConfig({
  plugins: [reactSwc()],
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
  envDir: path.resolve(__dirname, '../../'),
});
