import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // e-Cidadania has no CORS headers; the dev server mirrors the nginx
      // reverse proxy used in production.
      "/api/ecidadania": {
        target: "https://www12.senado.leg.br/ecidadania",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ecidadania/, ""),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
