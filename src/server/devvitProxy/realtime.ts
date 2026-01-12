/** Realtime proxy - exports real Devvit realtime or official mock based on environment. */

import { realtime as devvitRealtime } from '@devvit/web/server';

type RealtimeClient = typeof devvitRealtime;
import { IS_DEV } from './environment';

let cachedRealtime: RealtimeClient | null = null;

if (!IS_DEV) {
    cachedRealtime = devvitRealtime;
}

async function getRealtime(): Promise<RealtimeClient> {
    if (cachedRealtime) return cachedRealtime;

    if (IS_DEV) {
        const { getRealtimeMock } = await import('./devvitMocks');
        const { createRealtimeAdapter } = await import('./adapters/realtimeAdapter');
        const realtimeMock = getRealtimeMock();
        cachedRealtime = createRealtimeAdapter(realtimeMock);
    }

    return cachedRealtime!;
}

export const realtime: RealtimeClient = new Proxy({} as RealtimeClient, {
    get(_target, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => {
            if (cachedRealtime) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (cachedRealtime as any)[prop](...args);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return getRealtime().then((r) => (r as any)[prop](...args));
        };
    },
});
