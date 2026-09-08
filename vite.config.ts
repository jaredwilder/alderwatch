import {defineConfig} from 'vite';

// Production Caddy routes /api/* to the loopback NPC service. Mirror that locally.
export default defineConfig({server:{proxy:{'/api':{target:'http://127.0.0.1:5011',changeOrigin:false}}}});
