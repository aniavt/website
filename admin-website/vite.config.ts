import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
    base: '/admin',
    plugins: [
        preact(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@pages': '/src/pages',
            '@config': '/src/config',
            '@utils': '/src/utils',
            '@store': '/src/store',
            '@components': '/src/components',
        }
    },
    server: {
        host: '0.0.0.0',
        port: 80,
        hmr: {
            clientPort: 80,
        }
    },
})
