import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // relative paths, so the build works from any folder (GitHub Pages serves it under /math-interactive/)
  base: './',
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173 },
})
