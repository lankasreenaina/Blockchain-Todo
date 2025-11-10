import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    hmr: {
      host: 'localhost'
    }
  },
  build: {
    target: 'esnext' // This helps with some CSP issues
  },
  define: {
    global: 'globalThis', // Fix for ethers.js and global object
  },
  optimizeDeps: {
    esbuildOptions: {
      // Define global this for development
      define: {
        global: 'globalThis'
      }
    }
  }
})