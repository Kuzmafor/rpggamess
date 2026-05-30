import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// process.cwd() вернёт текущую рабочую директорию (включая junction `now-bof`),
// тогда как import.meta.url раскрывает junction в реальный путь с `!`.
// Привязываемся к cwd, чтобы Rollup/Vite не смешивали реальные и виртуальные пути.
const root = process.cwd()

export default defineConfig({
  plugins: [react()],
  root,
  base: './',
  cacheDir: root + '/node_modules/.vite',
  build: {
    outDir: root + '/dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    fs: { strict: false },
  },
  preserveSymlinks: true,
})
