/** Realtime proxy - exports real Devvit realtime or official mock based on environment. */

import { realtime as devvitRealtime } from '@devvit/web/server';

type RealtimeClient = typeof devvitRealtime;
import { IS_DEV } from './environment';

let cachedRealtime: RealtimeClient | null = null;

async function getRealtime(): Promise<RealtimeClient> {
    if (cachedRealtime) return cachedRealtime;

    if (IS_DEV) {
        // Dynamic import to avoid bundling dev dependencies in production
        const { getRealtimeMock } = await import('./devvitMocks');
        const { createRealtimeAdapter } = await import('./adapters/realtimeAdapter');
        const realtimeMock = getRealtimeMock();
        cachedRealtime = createRealtimeAdapter(realtimeMock);
    } else {
        cachedRealtime = devvitRealtime;
    }

    return cachedRealtime;
}

export const realtime: RealtimeClient = new Proxy({} as RealtimeClient, {
    get(_target, prop) {
        return getRealtime().then((r) => (r as any)[prop]);
    },
});
