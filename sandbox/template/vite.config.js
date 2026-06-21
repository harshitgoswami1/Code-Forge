import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    // The preview is reached through the ingress/router on port 80, not 5173.
    // Tell the HMR client to open its WebSocket on the public port so it can
    // actually connect (otherwise it retries forever and reload-loops).
    hmr: {
      clientPort: 80,
    },
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
  },
})
