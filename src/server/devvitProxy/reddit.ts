/** Reddit API proxy - exports real Devvit reddit API or official mock based on environment. */

import { reddit as devvitReddit } from '@devvit/web/server';

type RedditClient = typeof devvitReddit;
import { IS_DEV } from './environment';
import { getRedditMock } from './devvitMocks';
import { createRedditAdapter } from './adapters/redditAdapter';

let cachedReddit: RedditClient | null = null;

function getReddit(): RedditClient {
    if (cachedReddit) return cachedReddit;

    if (IS_DEV) {
        const redditMock = getRedditMock();
        cachedReddit = createRedditAdapter(redditMock);
    } else {
        cachedReddit = devvitReddit;
    }

    return cachedReddit;
}

export const reddit: RedditClient = new Proxy({} as RedditClient, {
    get(_target, prop) {
        return (getReddit() as any)[prop];
    },
});
