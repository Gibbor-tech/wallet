// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://fade-overstep-grievous.ngrok-free.dev', // Your ngrok URL
    
        secure: true, // Allows self-signed or invalid certificates (often needed for ngrok)
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})