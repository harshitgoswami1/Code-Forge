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
  // Vite 8 guards the HMR WebSocket with a per-server token (anti-hijack). The
  // token can't round-trip reliably through the ingress → router proxy chain,
  // so vite rejects every browser HMR socket (browsers always send an Origin)
  // and the client falls into a reconnect → location.reload() loop. The router
  // is a trusted internal proxy, so skip the token check; allowedHosts:true
  // already disables the companion Host check.
  legacy: {
    skipWebSocketTokenCheck: true,
  },
})
