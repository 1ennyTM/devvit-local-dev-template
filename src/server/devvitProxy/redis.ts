/** Redis storage proxy - exports real Devvit redis or official mock based on environment. */

import { redis as devvitRedis } from '@devvit/web/server';

type RedisClient = typeof devvitRedis;
import { IS_DEV } from './environment';

let cachedRedis: RedisClient | null = null;

if (!IS_DEV) {
    cachedRedis = devvitRedis;
}

async function getRedis(): Promise<RedisClient> {
    if (cachedRedis) return cachedRedis;

    if (IS_DEV) {
        const { getRedisMock } = await import('./devvitMocks');
        const { createRedisAdapter } = await import('./adapters/redisAdapter');
        const redisMock = await getRedisMock();
        cachedRedis = createRedisAdapter(redisMock);
    }

    return cachedRedis!;
}

export const redis: RedisClient = new Proxy({} as RedisClient, {
    get(_target, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => {
            if (cachedRedis) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (cachedRedis as any)[prop](...args);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return getRedis().then((r) => (r as any)[prop](...args));
        };
    },
});
