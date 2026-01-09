/**
 * Server startup utility
 *
 * Handles environment-specific server startup:
 * - Local dev: Plain Express on port 3XXX
 * - Production: Devvit server wrapper
 *
 * Server code is agnostic - this is the only place that checks environment.
 */

import type { Express } from 'express';
import { IS_DEV } from './environment';

/** Local dev server port (from .env.dev or default) */
const LOCAL_PORT = parseInt(process.env.SERVER_PORT || '3002', 10);

/**
 * Start the server based on environment
 *
 * @param app - Express application instance
 */
export function startServer(app: Express): void {
    if (IS_DEV) {
        startLocalServer(app);
    } else {
        startDevvitServer(app);
    }
}

/**
 * Start local Express server (dev mode)
 */
function startLocalServer(app: Express): void {
    const server = app.listen(LOCAL_PORT, () => {
        console.log(`[Server] Local dev server running on http://localhost:${LOCAL_PORT}`);
        console.log('[Server] Using mock Redis');
    });

    server.on('error', (err: Error) => {
        console.error(`[Server] Error: ${err.stack}`);
        process.exit(1);
    });
}

/**
 * Start Devvit server (production mode)
 */
async function startDevvitServer(app: Express): Promise<void> {
    // Dynamic import to avoid loading Devvit modules in local dev
    const { initializeAuth } = await import('./auth');
    const { createServer, getServerPort } = await import('@devvit/web/server');

    // Initialize auth/context before accepting requests
    await initializeAuth();

    const server = createServer(app);
    server.on('error', (err: Error) => console.error(`[Server] Error: ${err.stack}`));
    server.listen(getServerPort());
}
