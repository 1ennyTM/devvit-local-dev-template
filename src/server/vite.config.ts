import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

// Dev-only dependencies that should NOT be bundled in production
// These are only used via dynamic imports in IS_DEV branches
const devOnlyExternals = [
  '@devvit/redis/test',
  '@devvit/reddit/test',
  '@devvit/scheduler/test',
  '@devvit/settings/test',
  '@devvit/notifications/test',
  '@devvit/media/test',
  '@devvit/realtime/server/test',
  'ioredis',
  'redis-memory-server',
];

export default defineConfig({
  ssr: {
    noExternal: true,
    external: devOnlyExternals,
  },
  logLevel: 'warn',
  build: {
    ssr: 'index.ts',
    outDir: '../../dist/server',
    emptyOutDir: true,
    target: 'node22',
    sourcemap: true,
    rollupOptions: {
      external: [...builtinModules, ...devOnlyExternals],

      output: {
        format: 'cjs',
        entryFileNames: 'index.cjs',
        inlineDynamicImports: true,
      },
    },
  },
});
