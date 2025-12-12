import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Playground-specific Vite config
// This serves playground.html as the root entry point
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'playground-root-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Redirect root to playground.html
          if (req.url === '/') {
            req.url = '/playground.html';
          }
          next();
        });
      },
    },
  ],
  root: '.',
  build: {
    outDir: 'dist-playground',
  },
  server: {
    port: 5174,
    strictPort: true,
    open: '/',
  },
});
