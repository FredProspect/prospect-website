import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Client bundle lands in /assets/home so the existing static server and Docker image serve it unchanged.
export default defineConfig({
  root: __dirname,
  base: '/assets/home/',
  plugins: [react()],
  build: { outDir: '../assets/home', emptyOutDir: true, manifest: true, rollupOptions: { input: __dirname + '/src/main.tsx' } }
});
