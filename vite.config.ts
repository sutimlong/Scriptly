import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/slate') || id.includes('node_modules/framer-motion')) {
            return 'vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
        }
      }
    }
  }
})
