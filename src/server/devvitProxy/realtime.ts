/** Realtime proxy - exports real Devvit realtime or official mock based on environment. */

import { realtime as devvitRealtime } from '@devvit/web/server';

type RealtimeClient = typeof devvitRealtime;
import { IS_DEV } from './environment';
import { getRealtimeMock } from './devvitMocks';
import { createRealtimeAdapter } from './adapters/realtimeAdapter';

let cachedRealtime: RealtimeClient | null = null;

function getRealtime(): RealtimeClient {
    if (cachedRealtime) return cachedRealtime;

    if (IS_DEV) {
        const realtimeMock = getRealtimeMock();
        cachedRealtime = createRealtimeAdapter(realtimeMock);
    } else {
        cachedRealtime = devvitRealtime;
    }

    return cachedRealtime;
}

export const realtime: RealtimeClient = new Proxy({} as RealtimeClient, {
    get(_target, prop) {
        return (getRealtime() as any)[prop];
    },
});
