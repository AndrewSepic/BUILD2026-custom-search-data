import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/adsb-api': {
        target: 'https://api.adsb.lol',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adsb-api/, ''),
      },
      // trace files are served from the globe frontend's host, not api.adsb.lol
      '/adsb-globe': {
        target: 'https://adsb.lol',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adsb-globe/, ''),
      },
    },
  }
})
