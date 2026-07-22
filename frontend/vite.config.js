import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Some dependencies (e.g. sockjs-client) still assume a Node-ish `global`.
    global: 'globalThis',
    'process.env': {},
  },
})
