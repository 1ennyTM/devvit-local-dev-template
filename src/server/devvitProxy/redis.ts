/** Redis storage proxy - exports real Devvit redis or official mock based on environment. */

import { redis as devvitRedis } from '@devvit/web/server';

type RedisClient = typeof devvitRedis;
import { IS_DEV } from './environment';
import { getRedisMock } from './devvitMocks';
import { createRedisAdapter } from './adapters/redisAdapter';

let cachedRedis: RedisClient | null = null;

async function getRedis(): Promise<RedisClient> {
    if (cachedRedis) return cachedRedis;

    if (IS_DEV) {
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
