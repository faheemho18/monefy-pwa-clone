import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/services': resolve(__dirname, './src/services'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/assets': resolve(__dirname, './src/assets'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
})