import { defineConfig } from 'vite'

export default defineConfig({
  base: '/clipboard2markdown/',
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.js'],
  },
})
