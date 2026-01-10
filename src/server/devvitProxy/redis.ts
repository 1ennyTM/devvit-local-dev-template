/**
 * Redis storage proxy
 *
 * Exports either real Devvit redis or official mock redis (via @devvit/test) based on environment.
 * Services import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { redis } from '../utils/redis';
 *   const data = await redis.hGetAll(key);
 */

type RedisClient = typeof import('@devvit/web/server')['redis'];
import { IS_DEV } from './environment';
import { getRedisMock } from './devvitMocks';
import { createRedisAdapter, type RedisAdapter } from './adapters/redisAdapter';

let cachedRedis: RedisAdapter | null = null;

async function getRedis(): Promise<RedisAdapter> {
    if (cachedRedis) return cachedRedis;

    if (IS_DEV) {
        const redisMock = await getRedisMock();
        cachedRedis = createRedisAdapter(redisMock);
    } else {
        const devvit = await import('@devvit/web/server');
        cachedRedis = devvit.redis as unknown as RedisAdapter;
    }

    return cachedRedis;
}

export const redis = {
    async get(key: string) {
        return (await getRedis()).get(key);
    },
    async set(key: string, value: string) {
        return (await getRedis()).set(key, value);
    },
    async del(key: string) {
        return (await getRedis()).del(key);
    },
    async hGet(key: string, field: string) {
        return (await getRedis()).hGet(key, field);
    },
    async hSet(key: string, fieldValues: Record<string, string>) {
        return (await getRedis()).hSet(key, fieldValues);
    },
    async hGetAll(key: string) {
        return (await getRedis()).hGetAll(key);
    },
    async hDel(key: string, fields: string[]) {
        return (await getRedis()).hDel(key, fields);
    },
    async incrBy(key: string, increment: number) {
        return (await getRedis()).incrBy(key, increment);
    },
    async zAdd(key: string, ...members: { score: number; member: string }[]) {
        return (await getRedis()).zAdd(key, ...members);
    },
    async zRange(key: string, start: number, stop: number) {
        return (await getRedis()).zRange(key, start, stop);
    },
    async zScore(key: string, member: string) {
        return (await getRedis()).zScore(key, member);
    },
    async zRem(key: string, members: string[]) {
        return (await getRedis()).zRem(key, members);
    },
    async zCard(key: string) {
        return (await getRedis()).zCard(key);
    },
    async zRank(key: string, member: string) {
        return (await getRedis()).zRank(key, member);
    },
    async zIncrBy(key: string, member: string, increment: number) {
        return (await getRedis()).zIncrBy(key, member, increment);
    },
    async exists(key: string) {
        return (await getRedis()).exists(key);
    },
    async expire(key: string, seconds: number) {
        return (await getRedis()).expire(key, seconds);
    },
    async type(key: string) {
        return (await getRedis()).type(key);
    },
} as unknown as RedisClient;
