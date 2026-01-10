/**
 * Realtime proxy
 *
 * Exports either real Devvit realtime or official mock (via @devvit/test) based on environment.
 * Services import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { realtime } from '../utils/realtime';
 *   await realtime.send('channel', { message: 'hello' });
 */

type RealtimeClient = typeof import('@devvit/web/server')['realtime'];
import { IS_DEV } from './environment';
import { getRealtimeMock } from './devvitMocks';
import { createRealtimeAdapter, type RealtimeAdapter } from './adapters/realtimeAdapter';

let cachedRealtime: RealtimeAdapter | null = null;

function getRealtimeMock_(): RealtimeAdapter {
    if (!cachedRealtime && IS_DEV) {
        const realtimeMock = getRealtimeMock();
        cachedRealtime = createRealtimeAdapter(realtimeMock);
    }
    return cachedRealtime!;
}

let cachedDevvit: typeof import('@devvit/web/server') | null = null;

async function getDevvit() {
    if (!cachedDevvit && !IS_DEV) {
        cachedDevvit = await import('@devvit/web/server');
    }
    return cachedDevvit;
}

export const realtime = {
    async send(channel: string, msg: any) {
        if (IS_DEV) return getRealtimeMock_().send(channel, msg);
        const devvit = await getDevvit();
        return devvit!.realtime.send(channel, msg);
    },
} as unknown as RealtimeClient;

export async function initializeRealtime(): Promise<void> {
    if (!IS_DEV) {
        await getDevvit();
    }
}
