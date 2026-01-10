/**
 * Media Adapter for Official Devvit Mocks
 *
 * Wraps the official MediaMock from @devvit/media/test to provide
 * a high-level interface matching @devvit/web/server media API.
 */

import type { MediaMock } from '@devvit/media/test';

export type MediaType = 'image' | 'gif' | 'video';

export interface UploadMediaOptions {
    url: string;
    type: MediaType;
}

export interface MediaAsset {
    mediaId: string;
    mediaUrl: string;
}

export function createMediaAdapter(mediaMock: MediaMock) {
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

        getUploads() {
            return mediaMock.uploads;
        },

        _clear(): void {
            mediaMock.clear();
        },
    };
}

export type MediaAdapter = ReturnType<typeof createMediaAdapter>;
