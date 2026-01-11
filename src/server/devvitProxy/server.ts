/**
 * Server startup utility
 *
 * Handles environment-specific server startup:
 * - Local dev: Plain Express on port 3XXX + mock Redis seeding
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
export async function startServer(app: Express): Promise<void> {
    if (IS_DEV) {
        await startLocalServer(app);
    } else {
        await startDevvitServer(app);
    }
}

/**
 * Start local Express server (dev mode)
 * Seeds mock Redis with test data after server starts
 */
async function startLocalServer(app: Express): Promise<void> {
    return new Promise((resolve, reject) => {
        const server = app.listen(LOCAL_PORT, async () => {
            console.log(`[Server] Local dev server running on http://localhost:${LOCAL_PORT}`);
            console.log('[Server] Using mock Redis');

            try {
                // Seed mock Redis with test data
                const { seedMockRedis } = await import('../dev/seedMockRedis');
                await seedMockRedis();
            } catch (error) {
                console.warn('[Server] Skipping mock Redis seed (no seed data or error occurred):', error);
            }
            resolve();
        });

        server.on('error', (err: Error) => {
            console.error(`[Server] Error: ${err.stack}`);
            reject(err);
        });
    });
}

/**
 * Start Devvit server (production mode)
 */
async function startDevvitServer(app: Express): Promise<void> {
    // Dynamic import to avoid loading Devvit modules in local dev
    const { createServer, getServerPort } = await import('@devvit/web/server');

    const server = createServer(app);
    server.on('error', (err: Error) => console.error(`[Server] Error: ${err.stack}`));
    server.listen(getServerPort());
}
