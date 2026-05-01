import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  publicDir: 'public',
  build: {
    outDir: 'htdocs/luci-static/glassnova',
    emptyOutDir: false,
    copyPublicDir: true,
    target: ['es2020'],
    cssMinify: 'lightningcss',
    minify: 'oxc',
    manifest: 'manifest.json',
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'assets/glassnova.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'assets/glassnova.css';
          return 'assets/[name][extname]';
        }
      }
    }
  }
});
