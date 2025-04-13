import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

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
      },
      // Prevent loading of native modules
      external: [
        '@rollup/rollup-linux-x64-gnu',
        '@rollup/rollup-linux-x64-musl',
        '@rollup/rollup-darwin-x64',
        '@rollup/rollup-darwin-arm64'
      ]
    }
  },
  // Force disable native modules in the build
  define: {
    'process.env.ROLLUP_NATIVE_MODULES': JSON.stringify('no')
  }
})
