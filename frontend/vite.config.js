import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ react(), tailwindcss() ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      // Stabilise HMR — prevents reloads triggered by unrelated socket errors.
      clientPort: 5173,
    },
    proxy: {
      // REST API — forwarded to the backend/ingress
      "/api": {
        // Connect over IPv4 (the docker/nginx ingress binds 0.0.0.0:80, not
        // ::1), but force the Host header to exactly `localhost` — the only
        // value the ingress matches the host-less /api rules against.
        target: "http://127.0.0.1:80",
        changeOrigin: false,
        headers: { Host: "localhost" },
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('proxy error', err))
          proxy.on('proxyReq', (_, req) => console.log('proxying:', req.method, req.url))
          proxy.on('proxyRes', (res, req) => console.log('got response:', res.statusCode, req.url))
        }
      }
    }
  }
})