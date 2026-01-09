/**
 * Server environment detection
 *
 * Centralizes dev mode detection for server-side code.
 * Used by storage and auth proxies to switch implementations.
 */

/**
 * Check if running in development environment
 *
 * Detection methods:
 * - NODE_ENV === 'development' (standard)
 * - DEVVIT_LOCAL env var (Devvit local development)
 * - Localhost detection via request headers (set by Vite dev server)
 */
export const IS_DEV =
    process.env.NODE_ENV === 'development' ||
    process.env.DEVVIT_LOCAL === 'true' ||
    process.env.VITE_DEV === 'true';

/**
 * Log environment on server startup (only in dev to reduce noise)
 */
if (IS_DEV) {
    console.log('[Environment] Server running in DEVELOPMENT mode');
    console.log('[Environment] Using mock Redis and mock Reddit API');
}
