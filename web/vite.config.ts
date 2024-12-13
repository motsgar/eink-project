import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/* eslint-disable require-unicode-regexp */

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5000,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    envDir: '../',
});
