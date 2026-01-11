/**
 * Server environment detection
 *
 * Uses process.env only - safe for server bundling.
 */

export function isDevelopment(): boolean {
    if (process.env.NODE_ENV === 'development') return true;
    if (process.env.DEVVIT_LOCAL === 'true') return true;
    return false;
}

export const IS_DEV = isDevelopment();

if (IS_DEV) {
    console.log('[Environment] Server running in DEVELOPMENT mode');
    console.log('[Environment] Using mock Redis and mock Reddit API');
}
