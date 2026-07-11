import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@doronuma/shared': path.resolve(__dirname, './packages/shared/src'),
    },
  },
});
