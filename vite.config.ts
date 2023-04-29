import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [solidPlugin(), nodePolyfills({
    // Whether to polyfill `node:` protocol imports.
    protocolImports: true,
  }),],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
