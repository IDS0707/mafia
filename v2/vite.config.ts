import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      $components: fileURLToPath(new URL('./src/components', import.meta.url)),
      $views: fileURLToPath(new URL('./src/views', import.meta.url)),
      $styles: fileURLToPath(new URL('./src/styles', import.meta.url)),
      $types: fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'svelte-runtime': ['svelte', 'svelte/internal'],
        },
      },
    },
  },
});
