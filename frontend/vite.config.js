import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [
        ["babel-plugin-react-compiler", { target: '18' }]
      ]
    }
  })],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/data': 'http://localhost:3000'
    }
  }
});