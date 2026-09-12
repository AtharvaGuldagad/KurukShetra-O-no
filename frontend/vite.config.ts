import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/zones': { target: 'http://localhost:8000', changeOrigin: true },
      '/reports': { target: 'http://localhost:8000', changeOrigin: true },
      '/inventory': { target: 'http://localhost:8000', changeOrigin: true },
      '/allocations': { target: 'http://localhost:8000', changeOrigin: true },
      '/agency-tasks': { target: 'http://localhost:8000', changeOrigin: true },
      '/audit-log': { target: 'http://localhost:8000', changeOrigin: true },
      '/simulation': { target: 'http://localhost:8000', changeOrigin: true },
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/live': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
