import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '$lib': path.resolve(__dirname, './src/lib'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5174, // Different from the React app
    host: true,
    proxy: {
      "/ws": {
        target: `http://127.0.0.1:18790`,
        ws: true,
        changeOrigin: true,
      },
      "/v1": {
        target: `http://127.0.0.1:18790`,
        changeOrigin: true,
        timeout: 30000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const auth = proxyReq.getHeader('authorization');
            if (auth) {
              proxyReq.setHeader('authorization', auth);
            }
          });
        },
      },
      "/health": {
        target: `http://127.0.0.1:18790`,
        changeOrigin: true,
      },
    },
  },
});