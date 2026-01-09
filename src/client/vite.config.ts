import { defineConfig, loadEnv } from 'vite';
import tailwind from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars from .env.dev
  const env = loadEnv(mode, process.cwd(), '');
  const serverPort = env.SERVER_PORT || '3002';
  const clientPort = parseInt(env.CLIENT_PORT || '7474', 10);

  return {
    plugins: [react(), tailwind()],
    logLevel: 'warn',
    server: {
      port: clientPort,
      proxy: {
        '/api': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
        },
      },
    },
    build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        splash: 'splash.html',
        game: 'game.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        sourcemapFileNames: '[name].js.map',
      },
    },
  },
  };
});
