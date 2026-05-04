import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    outDir: 'htdocs/luci-static/glassnova/assets',
    emptyOutDir: false,
    rollupOptions: { input: 'src/main.ts', output: { entryFileNames: 'glassnova.js', assetFileNames: 'glassnova.css' } }
  }
});
