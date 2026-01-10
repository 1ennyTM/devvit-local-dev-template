## Devvit React Starter with Local Development

A starter to build web applications on Reddit's developer platform with fast local development support.

**No playtest waits, no duplicate code, just fast local dev. Write once, run anywhere.**

This template extends the official Devvit React template with environment-aware proxies using Reddit's official `@devvit/test` mocks, eliminating the need to upload to Devvit on every change.

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

```typescript
import { redis, reddit, context } from './devvitProxy';

// Works identically in dev and prod
const count = await redis.get('count');
const username = await reddit.getCurrentUsername();
```

Proxies are type-cast to `@devvit/web/server` types for full IntelliSense.

### Limitations

- **Not all APIs are covered** - coverage is based on `@devvit/test` mocks. See [@devvit/test docs](https://developers.reddit.com/docs/guides/tools/devvit_test) for what's supported.
- Mock Redis resets on restart (in-memory)
- Client-side Devvit APIs need playtest mode
- Always test in playtest before deploying

### Key Files

```
src/server/devvitProxy/
├── index.ts       # Barrel export (mirrors @devvit/web/server)
├── adapters/      # Wrap @devvit/test mocks
└── *.ts           # Proxy files (redis, reddit, context, etc.)
```

## Cursor Integration

Pre-configured cursor environment. [Download cursor](https://www.cursor.com/downloads) and enable `devvit-mcp` when prompted.

## Credits

Based on [reddit/devvit-template-react](https://github.com/reddit/devvit-template-react).

BSD-3-Clause License - Original © 2025 Reddit Inc. | Local dev © 2026 Darrel Len
