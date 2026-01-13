## Devvit React Starter with Local Development [Experimental]

A starter to build web applications on Reddit's developer platform with fast local development support.

**No playtest waits, no duplicate code, just fast local dev. Write once, run anywhere.**

This template extends the official Devvit React template with strongly-typed environment-aware proxies using Reddit's official `@devvit/test` mocks, eliminating the need to upload to Devvit on every change.

- [Devvit](https://developers.reddit.com/): Reddit's developer platform
- [@devvit/test](https://www.npmjs.com/package/@devvit/test): Official Reddit mocks for local development
- [Vite](https://vite.dev/): Fast build tool with hot reload
- [React](https://react.dev/): UI framework
- [Express](https://expressjs.com/): Backend server
- [Tailwind](https://tailwindcss.com/): Utility-first CSS
- [Typescript](https://www.typescriptlang.org/): Type safety

## Getting Started

> Requires Node.js 22+

1. Clone or fork this template:
   ```bash
   git clone https://github.com/1ennyTM/devvit-local-dev-template.git
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

4. Start local development:
   ```bash
   npm run dev:vite
   # Open http://localhost:7474/splash.html or /game.html
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

## How It Works

`devvitProxy/` is an analogue to `@devvit/web/server` - same API, works offline with official `@devvit/test` mocks.

```
Client (localhost:7474) --> Vite --> Server (localhost:3002)
                                         |
                                    devvitProxy
                                         |
                    Dev: @devvit/test mocks | Prod: @devvit/web/server
```

### Usage

**1. Replace `@devvit/web/server` imports with `devvitProxy`:**

```typescript
// Standard Devvit (no local dev)
import { redis, reddit, context } from '@devvit/web/server';

// With devvitProxy (local dev enabled)
import { redis, reddit, context } from './devvitProxy';
```

The APIs are identical - `devvitProxy` exports the same types from `@devvit/web/server`. Your code stays the same, only the import path changes.

**2. Use environment-aware server startup:**

```typescript
// In your server entry point (e.g., src/server/index.ts)
import { startServer } from './devvitProxy/server';

const app = express();
// ... your routes ...

startServer(app);
// Local dev: Express on port 3002 with @devvit/test mocks
// Production: Devvit server wrapper with real APIs
```

**3. Write your code once, run anywhere:**

```typescript
import { redis, reddit, context } from './devvitProxy';

// This exact code works in both local dev AND production
const [count, username] = await Promise.all([
  redis.get('count'),
  reddit.getCurrentUsername(),
]);

await redis.incrBy('count', 1);
const { postId } = context;
```

No conditional imports, no environment checks in your code, no editing files twice. The proxy handles environment switching internally via `NODE_ENV`.

The proxy pattern uses exact `@devvit/web/server` types, ensuring TypeScript sees identical APIs in development and production. This provides full IntelliSense and compile-time type safety. Code that runs successfully locally will work in production, though production supports additional APIs beyond what's mocked locally.

### Limitations

- **Not all APIs are covered** - TypeScript won't catch unsupported method usage. Unmocked methods throw runtime errors in local dev but may work in production. See [@devvit/test docs](https://developers.reddit.com/docs/guides/tools/devvit_test) for supported APIs.
- Mock Redis resets on restart (in-memory)
- `@devvit/client` APIs (like `showForms`, `showToast`) require playtest mode
- Always test in playtest before deploying

### Key Files

```
src/server/devvitProxy/
├── index.ts           # Barrel export (mirrors @devvit/web/server)
├── environment.ts     # IS_DEV flag detection
├── devvitMocks.ts     # Mock initialization (@devvit/test)
├── server.ts          # Environment-aware startup
├── redis.ts           # Redis proxy
├── reddit.ts          # Reddit API proxy
├── context.ts         # Context proxy
├── scheduler.ts       # Scheduler proxy
├── settings.ts        # Settings proxy
├── media.ts           # Media proxy
├── notifications.ts   # Notifications proxy
├── realtime.ts        # Realtime proxy
└── adapters/          # Type-safe wrappers for @devvit/test mocks
    ├── redisAdapter.ts
    ├── redditAdapter.ts
    ├── schedulerAdapter.ts
    ├── settingsAdapter.ts
    ├── mediaAdapter.ts
    ├── notificationsAdapter.ts
    └── realtimeAdapter.ts
```

## Cursor Integration

Pre-configured cursor environment. [Download cursor](https://www.cursor.com/downloads) and enable `devvit-mcp` when prompted.

## Credits

Based on [reddit/devvit-template-react](https://github.com/reddit/devvit-template-react).

BSD-3-Clause License - Original © 2025 Reddit Inc. | Local dev © 2026 Darrel Len
