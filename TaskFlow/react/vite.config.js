import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../js/react-build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/main.jsx',
        todo: './src/components/TodoList.jsx'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost/TaskFlow',
        changeOrigin: true
      }
    }
  }
})
