import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const compilerPreset = reactCompilerPreset()
compilerPreset.rolldown.filter.id = {
  include: /[\\/]src[\\/].*\.[jt]sx?$/,
}

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '.vite-cache',
  plugins: [
    react(),
    babel({ presets: [compilerPreset] })
  ],
  optimizeDeps: {
    needsInterop: ['react/compiler-runtime'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/chamsacviet': 'http://localhost:8080',
    },
  },
})
