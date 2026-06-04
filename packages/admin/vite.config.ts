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
    // GitHub Pages on this account does not serve newly-deployed /assets/* files
    // (only the root index.html serves reliably). So emit ONE JS chunk + one CSS
    // file and inline them into index.html post-build (see scripts/inline.mjs) so
    // the whole app ships in the single file that always serves.
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 5173,
  },
});
