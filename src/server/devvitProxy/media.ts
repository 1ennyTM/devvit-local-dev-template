/** Media proxy - exports real Devvit media or official mock based on environment. */

import { media as devvitMedia } from '@devvit/web/server';

type MediaClient = typeof devvitMedia;
import { IS_DEV } from './environment';
import { getMediaMock } from './devvitMocks';
import { createMediaAdapter } from './adapters/mediaAdapter';

let cachedMedia: MediaClient | null = null;

function getMedia(): MediaClient {
    if (cachedMedia) return cachedMedia;

    if (IS_DEV) {
        const mediaMock = getMediaMock();
        cachedMedia = createMediaAdapter(mediaMock);
    } else {
        cachedMedia = devvitMedia;
    }

    return cachedMedia;
}

export const media: MediaClient = new Proxy({} as MediaClient, {
    get(_target, prop) {
        return (getMedia() as any)[prop];
    },
});
