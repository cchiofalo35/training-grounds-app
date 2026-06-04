import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Per-portal base path (each tenant deploys to its own sub-path / host).
  // Defaults to the single Karuna Pages path for backwards compatibility.
  base: process.env.VITE_BASE || '/training-grounds-app/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Split the bundle into smaller vendor chunks. A single ~840KB JS file was
    // intermittently 404ing on GitHub Pages while smaller assets served fine;
    // splitting keeps every chunk small and is better for caching anyway.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-firebase': ['firebase/app', 'firebase/auth'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
