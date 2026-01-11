/** Wraps MediaMock from @devvit/media/test to match @devvit/web/server media API. */

import type { MediaMock } from '@devvit/media/test';
import type { media as devvitMedia } from '@devvit/web/server';

type Media = typeof devvitMedia;

export type MediaType = 'image' | 'gif' | 'video';

export interface UploadMediaOptions {
    url: string;
    type: MediaType;
}

export interface MediaAsset {
    mediaId: string;
    mediaUrl: string;
}

export function createMediaAdapter(mediaMock: MediaMock): Media {
    return {
        async upload(opts: UploadMediaOptions): Promise<MediaAsset> {
            try {
                const result = await mediaMock.plugin.Upload({
                    url: opts.url,
                    type: opts.type,
                } as any);

                const mediaId = result.mediaId ?? `media-${Date.now()}`;
                const mediaUrl = result.mediaUrl ?? `https://i.redd.it/${mediaId}`;

                return {
                    mediaId,
                    mediaUrl,
                };
            } catch (error) {
                const mediaId = `mock-media-${Date.now()}`;

                return {
                    mediaId,
                    mediaUrl: `https://i.redd.it/${mediaId}`,
                };
            }
        },
    } as unknown as Media;
}

export type MediaAdapter = Media;
