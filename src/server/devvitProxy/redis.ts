/** Redis storage proxy - exports real Devvit redis or official mock based on environment. */

import { redis as devvitRedis } from '@devvit/web/server';

type RedisClient = typeof devvitRedis;
import { IS_DEV } from './environment';

let cachedRedis: RedisClient | null = null;

async function getRedis(): Promise<RedisClient> {
    if (cachedRedis) return cachedRedis;

    if (IS_DEV) {
        // Dynamic import to avoid bundling dev dependencies in production
        const { getRedisMock } = await import('./devvitMocks');
        const { createRedisAdapter } = await import('./adapters/redisAdapter');
        const redisMock = await getRedisMock();
        cachedRedis = createRedisAdapter(redisMock);
    } else {
        cachedRedis = devvitRedis;
    }

    return cachedRedis;
}

export const redis: RedisClient = new Proxy({} as RedisClient, {
    get(_target, prop) {
        return (...args: any[]) => {
            return getRedis().then((r) => (r as any)[prop](...args));
        };
    },
});
