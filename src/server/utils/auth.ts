/**
 * Reddit API proxy
 *
 * Exports either real Devvit reddit API or mock implementation based on environment.
 * Services and middleware import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { reddit } from '../utils/auth';
 *   const username = await reddit.getCurrentUsername();
 */

import { IS_DEV } from './environment';

/** Dev mode configuration */
const DEV_CONFIG = {
    /** Default username for development */
    username: 'dev-user',
    /** Default subreddit name for development */
    subredditName: 'dev-subreddit',
    /** Default post ID for development */
    postId: 'dev-post-123',
} as const;

/**
 * Mock Reddit API for development
 */
const mockReddit = {
    async getCurrentUsername(): Promise<string | null> {
        return DEV_CONFIG.username;
    },

    async getCurrentUser(): Promise<{ username: string; id: string } | null> {
        return {
            username: DEV_CONFIG.username,
            id: 't2_dev123',
        };
    },

    async submitCustomPost(options: {
        entry: string;
        subredditName: string;
        title: string;
        postData?: Record<string, unknown>;
    }): Promise<{ id: string; url: string }> {
        console.log('[MockReddit] submitCustomPost:', options.title);
        return {
            id: DEV_CONFIG.postId,
            url: `https://reddit.com/r/${options.subredditName}/comments/${DEV_CONFIG.postId}`,
        };
    },

    async submitComment(options: { id: string; text: string }): Promise<{ id: string }> {
        console.log('[MockReddit] submitComment:', options.text.substring(0, 50));
        return { id: 't1_devcomment123' };
    },
};

/**
 * Mock Devvit context for development
 */
const mockContext = {
    postId: DEV_CONFIG.postId,
    subredditName: DEV_CONFIG.subredditName,
    subredditId: 't5_dev456',
    userId: 't2_dev123',
};

/**
 * Lazy-load devvit to avoid top-level await
 */
let cachedDevvit: typeof import('@devvit/web/server') | null = null;

async function getDevvit() {
    if (!cachedDevvit && !IS_DEV) {
        cachedDevvit = await import('@devvit/web/server');
    }
    return cachedDevvit;
}

/**
 * Reddit API instance - mock in dev, lazy-loaded in production
 */
export const reddit = {
    async getCurrentUsername() {
        if (IS_DEV) return mockReddit.getCurrentUsername();
        const devvit = await getDevvit();
        return devvit!.reddit.getCurrentUsername();
    },

    async getCurrentUser() {
        if (IS_DEV) return mockReddit.getCurrentUser();
        const devvit = await getDevvit();
        return devvit!.reddit.getCurrentUser();
    },

    async submitCustomPost(options: Parameters<typeof mockReddit.submitCustomPost>[0]) {
        if (IS_DEV) return mockReddit.submitCustomPost(options);
        const devvit = await getDevvit();
        return devvit!.reddit.submitCustomPost(options as never);
    },

    async submitComment(options: Parameters<typeof mockReddit.submitComment>[0]) {
        if (IS_DEV) return mockReddit.submitComment(options);
        const devvit = await getDevvit();
        return devvit!.reddit.submitComment(options as never);
    },
};

/**
 * Devvit context - mock in dev, dynamically accessed in production
 *
 * In production, context is request-scoped from @devvit/web/server
 * We need to access it dynamically for each request
 */
function getContextValue(key: keyof typeof mockContext) {
    if (IS_DEV) {
        return mockContext[key];
    }

    // In production, access the real Devvit context
    // This must be synchronous, so we use a cached import
    if (cachedDevvit) {
        return (cachedDevvit.context as any)[key] || '';
    }

    // Context not yet loaded - this should not happen in Devvit
    return '';
}

export const context = {
    get postId() {
        return getContextValue('postId');
    },
    get subredditName() {
        return getContextValue('subredditName');
    },
    get subredditId() {
        return getContextValue('subredditId');
    },
    get userId() {
        return getContextValue('userId');
    },
};

export type Reddit = typeof reddit;
export type Context = typeof context;

/**
 * Initialize the auth module (load Devvit in production)
 * Call this during server startup before accepting requests
 */
export async function initializeAuth(): Promise<void> {
    if (!IS_DEV) {
        await getDevvit();
    }
}
