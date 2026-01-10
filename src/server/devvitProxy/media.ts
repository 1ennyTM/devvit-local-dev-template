/**
 * Media proxy
 *
 * Exports either real Devvit media or official mock (via @devvit/test) based on environment.
 * Services import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { media } from '../utils/media';
 *   const asset = await media.upload({ url: 'https://...', type: 'image' });
 */

type MediaClient = typeof import('@devvit/web/server')['media'];
import { IS_DEV } from './environment';
import { getMediaMock } from './devvitMocks';
import { createMediaAdapter, type MediaAdapter } from './adapters/mediaAdapter';

let cachedMedia: MediaAdapter | null = null;

function getMediaMock_(): MediaAdapter {
    if (!cachedMedia && IS_DEV) {
        const mediaMock = getMediaMock();
        cachedMedia = createMediaAdapter(mediaMock);
    }
    return cachedMedia!;
}

let cachedDevvit: typeof import('@devvit/web/server') | null = null;

async function getDevvit() {
    if (!cachedDevvit && !IS_DEV) {
        cachedDevvit = await import('@devvit/web/server');
    }
    return cachedDevvit;
}

export const media = {
    async upload(opts: any) {
        if (IS_DEV) return getMediaMock_().upload(opts);
        const devvit = await getDevvit();
        return devvit!.media.upload(opts);
    },
} as unknown as MediaClient;

export async function initializeMedia(): Promise<void> {
    if (!IS_DEV) {
        await getDevvit();
    }
}
