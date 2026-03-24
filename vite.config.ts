import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite設定ファイル
export default defineConfig({
  base: '/service-now-csa/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
