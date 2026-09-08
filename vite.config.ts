import {defineConfig} from 'vite';

// In production Caddy routes /api/* to the NPC service. Locally, Vite does the
// same job so the game talks to one origin in both places and the OpenRouter key
// never has to exist in the browser.
export default defineConfig({
  server: {proxy: {'/api': {target: 'http://127.0.0.1:5011', changeOrigin: false}}},
});
