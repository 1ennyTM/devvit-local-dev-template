## Devvit React Starter with Local Development

A starter to build web applications on Reddit's developer platform with fast local development support.

This template extends the official Devvit React template with environment-aware proxies, eliminating the need to upload to Devvit on every change.

- [Devvit](https://developers.reddit.com/): Reddit's developer platform
- [Vite](https://vite.dev/): Fast build tool with hot reload
- [React](https://react.dev/): UI framework
- [Express](https://expressjs.com/): Backend server
- [Tailwind](https://tailwindcss.com/): Utility-first CSS
- [Typescript](https://www.typescriptlang.org/): Type safety

## Getting Started

> Requires Node.js 22+

1. Clone or fork this template:
   ```bash
   git clone https://github.com/yourusername/devvit-local-dev-template.git
   cd devvit-local-dev-template
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Login to Devvit (first time only):
   ```bash
   npm run login
   ```
   Follow the wizard to connect your Reddit account.

4. Start local development:
   ```bash
   npm run dev:vite
   # Open http://localhost:7474/splash.html or /game.html
   # Edit code with hot reload
   ```

5. When ready, test in Devvit sandbox:
   ```bash
   npm run dev
   ```

## Commands

**Local Development:**
- `npm run dev:vite`: Local dev mode

**Devvit Development:**
- `npm run dev`: Devvit playtest (uploads to Reddit on change)
- `npm run build`: Build client + server
- `npm run deploy`: Upload new version to Devvit
- `npm run launch`: Publish app for review
- `npm run login`: Login to Reddit
- `npm run check`: Type check + lint + format

## How Local Development Works

### The Proxy Pattern

```
Client (localhost:7474)
    ↓ Vite proxy
Server (localhost:3002)
    ↓ Environment detection
    ├─ Development → Mock Redis + Mock Auth
    └─ Production  → Real Devvit services
```
Instead of importing directly from `@devvit/web/server`, the template uses environment-aware proxies:

```typescript
// Instead of this (crashes locally):
import { redis, reddit } from '@devvit/web/server';

// Use this (works in both environments):
import { redis } from './utils/storage';        // Redis proxy
import { reddit, context } from './utils/auth'; // Reddit API proxy

// Routes work identically in dev and prod:
router.get('/api/init', async (_req, res) => {
  const count = await redis.get('count');           // Mock in dev, real in prod
  const username = await reddit.getCurrentUsername(); // Mock in dev, real in prod

  res.json({
    postId: context.postId,  // 'dev-post-123' in dev, real ID in prod
    count: count ? parseInt(count) : 0,
    username: username ?? 'anonymous',
  });
});
```

### Limitations in Local Mode

- Client-side Devvit APIs (`navigateTo`, `requestExpandedMode`) require production environment
- Mock Redis state resets on server restart (not persisted)

### Key Files

- `src/server/utils/environment.ts` - Dev mode detection (NODE_ENV, DEVVIT_LOCAL, VITE_DEV)
- `src/server/utils/storage.ts` - Redis proxy implementation
- `src/server/utils/mockRedis.ts` - Complete in-memory Redis with all data structures
- `src/server/utils/auth.ts` - Reddit API proxy (mock user: 'dev-user', post: 'dev-post-123')
- `src/server/utils/server.ts` - Environment-specific server startup
- `.env.dev` - Development environment variables

## Cursor Integration

This template comes with a pre-configured cursor environment. To get started, [download cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` when prompted.

## Credits

Based on the official [reddit/devvit](https://github.com/reddit/devvit) React template.

BSD-3-Clause License - Original template © 2025 Reddit Inc. | Local development enhancements © 2026 Darrel Len
