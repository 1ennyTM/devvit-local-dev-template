/** Media proxy - exports real Devvit media or official mock based on environment. */

import { media as devvitMedia } from '@devvit/web/server';

type MediaClient = typeof devvitMedia;
import { IS_DEV } from './environment';

let cachedMedia: MediaClient | null = null;

if (!IS_DEV) {
    cachedMedia = devvitMedia;
}

async function getMedia(): Promise<MediaClient> {
    if (cachedMedia) return cachedMedia;

    if (IS_DEV) {
        const { getMediaMock } = await import('./devvitMocks');
        const { createMediaAdapter } = await import('./adapters/mediaAdapter');
        const mediaMock = getMediaMock();
        cachedMedia = createMediaAdapter(mediaMock);
    }

    return cachedMedia!;
}

export const media: MediaClient = new Proxy({} as MediaClient, {
    get(_target, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => {
            if (cachedMedia) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (cachedMedia as any)[prop](...args);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return getMedia().then((m) => (m as any)[prop](...args));
        };
    },
});
