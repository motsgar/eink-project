import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: '../webDist',
    },
    envDir: '../',
    plugins: [react()],
    server: {
        port: 5000,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
            },
        },
    },
});
