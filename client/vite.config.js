import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ticket-system/',
  server: {
    hmr: {
      // Fix: When using a base path, HMR WebSocket must connect to root
      // without the base prefix to avoid ERR_CONNECTION_REFUSED
      path: '/__hmr',
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
})
