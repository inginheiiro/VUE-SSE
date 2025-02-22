import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// Suprime os logs do Vite
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('http proxy error')) return;
  originalConsoleError(...args);
};

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => {})
        }
      }
    }
  }
})
