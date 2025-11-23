import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Force port 3000 as requested
    port: 3000,
    host: true,
    strictPort: true
  },
  build: {
    outDir: 'dist'
  }
})
