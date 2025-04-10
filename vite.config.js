import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add Rollup configuration to fix Linux deployment issue
  build: {
    rollupOptions: {
      context: 'globalThis',
      onwarn(warning, warn) {
        // Suppress warnings about optional dependencies
        if (warning.code === 'MISSING_OPTIONAL_DEPENDENCY') {
          return;
        }
        warn(warning);
      }
    }
  }
})
