import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api ke backend agar tidak ada masalah CORS saat pengembangan.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
