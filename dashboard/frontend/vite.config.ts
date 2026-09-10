import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy API calls to the dashboard bridge (localhost:4321 by default)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4321',
    },
  },
});
