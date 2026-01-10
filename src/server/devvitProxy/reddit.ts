/**
 * Reddit API proxy
 *
 * Exports either real Devvit reddit API or official mock (via @devvit/test) based on environment.
 * Services and middleware import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { reddit } from './devvitProxy';
 *   const username = await reddit.getCurrentUsername();
 */

type RedditClient = typeof import('@devvit/web/server')['reddit'];
import { IS_DEV } from './environment';
import { getRedditMock } from './devvitMocks';
import {
    createRedditAdapter,
    type RedditAdapter,
} from './adapters/redditAdapter';

let redditAdapter: RedditAdapter | null = null;
let cachedDevvit: typeof import('@devvit/web/server') | null = null;

function getRedditMock_() {
    if (!redditAdapter) {
        const redditMock = getRedditMock();
        redditAdapter = createRedditAdapter(redditMock);
    }
    return redditAdapter;
}

async function getDevvit() {
    if (!cachedDevvit && !IS_DEV) {
        cachedDevvit = await import('@devvit/web/server');
    }
    return cachedDevvit;
}

export const reddit = {
    async getCurrentUsername() {
        if (IS_DEV) return getRedditMock_().getCurrentUsername();
        const devvit = await getDevvit();
        return devvit!.reddit.getCurrentUsername();
    },

    async getCurrentUser() {
        if (IS_DEV) return getRedditMock_().getCurrentUser();
        const devvit = await getDevvit();
        return devvit!.reddit.getCurrentUser();
    },

    async getCurrentSubreddit() {
        if (IS_DEV) return getRedditMock_().getCurrentSubreddit();
        const devvit = await getDevvit();
        return devvit!.reddit.getCurrentSubreddit();
    },

    async getUserByUsername(username: string) {
        if (IS_DEV) return getRedditMock_().getUserByUsername(username);
        const devvit = await getDevvit();
        return devvit!.reddit.getUserByUsername(username);
    },

    async getUserById(userId: string) {
        if (IS_DEV) return getRedditMock_().getUserById(userId);
        const devvit = await getDevvit();
        return devvit!.reddit.getUserById(userId as any);
    },

    async getPostById(postId: string) {
        if (IS_DEV) return getRedditMock_().getPostById(postId);
        const devvit = await getDevvit();
        return devvit!.reddit.getPostById(postId as any);
    },

    async getCommentById(commentId: string) {
        if (IS_DEV) return getRedditMock_().getCommentById(commentId);
        const devvit = await getDevvit();
        return devvit!.reddit.getCommentById(commentId as any);
    },

    async submitCustomPost(options: any) {
        if (IS_DEV) return getRedditMock_().submitCustomPost(options);
        const devvit = await getDevvit();
        return devvit!.reddit.submitCustomPost(options);
    },

    async submitComment(options: any) {
        if (IS_DEV) return getRedditMock_().submitComment(options);
        const devvit = await getDevvit();
        return devvit!.reddit.submitComment(options);
    },
} as unknown as RedditClient;

/**
 * Initialize reddit (preload devvit module in production)
 */
export async function initializeReddit(): Promise<void> {
    if (!IS_DEV) {
        await getDevvit();
    }
}
