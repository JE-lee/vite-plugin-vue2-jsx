import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import vue2Jsx from '@vitejs/plugin-vue2-jsx'

export default defineConfig({
  resolve: {
    alias: {
      '@': __dirname
    }
  },
  build: {
    sourcemap: false,
    minify: false,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  plugins: [
    vue2(),
    vue2Jsx({ useWorkerThreads: false })
  ]
})
