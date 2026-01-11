/** Media proxy - exports real Devvit media or official mock based on environment. */

import { media as devvitMedia } from '@devvit/web/server';

type MediaClient = typeof devvitMedia;
import { IS_DEV } from './environment';

let cachedMedia: MediaClient | null = null;

async function getMedia(): Promise<MediaClient> {
    if (cachedMedia) return cachedMedia;

    if (IS_DEV) {
        // Dynamic import to avoid bundling dev dependencies in production
        const { getMediaMock } = await import('./devvitMocks');
        const { createMediaAdapter } = await import('./adapters/mediaAdapter');
        const mediaMock = getMediaMock();
        cachedMedia = createMediaAdapter(mediaMock);
    } else {
        cachedMedia = devvitMedia;
    }

    return cachedMedia;
}

export const media: MediaClient = new Proxy({} as MediaClient, {
    get(_target, prop) {
        return getMedia().then((m) => (m as any)[prop]);
    },
});
