import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  base: '/islands/', // Set base path for Netlify subdirectory deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
