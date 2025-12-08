import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true,
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand', '@tanstack/react-query'],
  },
})
