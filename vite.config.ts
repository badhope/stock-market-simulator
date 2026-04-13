import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/stock-market-simulator/' : '/',
  build: {
    outDir: 'docs'
  },
  server: {
    port: 3000,
    open: true
  }
}))
