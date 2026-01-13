/** Reddit API proxy - exports real Devvit reddit API or official mock based on environment. */

import { reddit as devvitReddit } from '@devvit/web/server';

type RedditClient = typeof devvitReddit;
import { IS_DEV } from './environment';

let cachedReddit: RedditClient | null = null;

if (!IS_DEV) {
    cachedReddit = devvitReddit;
}

async function getReddit(): Promise<RedditClient> {
    if (cachedReddit) return cachedReddit;

    if (IS_DEV) {
        const { getRedditMock } = await import('./devvitMocks');
        const { createRedditAdapter } = await import('./adapters/redditAdapter');
        const redditMock = await getRedditMock();
        cachedReddit = createRedditAdapter(redditMock);
    }

    return cachedReddit!;
}

export const reddit: RedditClient = new Proxy({} as RedditClient, {
    get(_target, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => {
            if (cachedReddit) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (cachedReddit as any)[prop](...args);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return getReddit().then(r => (r as any)[prop](...args));
        };
    },
});
