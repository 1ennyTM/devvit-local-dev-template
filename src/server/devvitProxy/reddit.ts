/** Reddit API proxy - exports real Devvit reddit API or official mock based on environment. */

import { reddit as devvitReddit } from '@devvit/web/server';

type RedditClient = typeof devvitReddit;
import { IS_DEV } from './environment';

let cachedReddit: RedditClient | null = null;

async function getReddit(): Promise<RedditClient> {
    if (cachedReddit) return cachedReddit;

    if (IS_DEV) {
        // Dynamic import to avoid bundling dev dependencies in production
        const { getRedditMock } = await import('./devvitMocks');
        const { createRedditAdapter } = await import('./adapters/redditAdapter');
        const redditMock = getRedditMock();
        cachedReddit = createRedditAdapter(redditMock);
    } else {
        cachedReddit = devvitReddit;
    }

    return cachedReddit;
}

export const reddit: RedditClient = new Proxy({} as RedditClient, {
    get(_target, prop) {
        return (...args: any[]) => {
            return getReddit().then(r => (r as any)[prop](...args));
        };
    },
});
