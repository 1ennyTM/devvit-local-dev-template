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
    async hSetNX(key: string, field: string, value: string) {
        return (await getRedis()).hSetNX(key, field, value);
    },
    async hLen(key: string) {
        return (await getRedis()).hLen(key);
    },
    async expireTime(key: string) {
        return (await getRedis()).expireTime(key);
    },
    async zRemRangeByScore(key: string, min: number, max: number) {
        return (await getRedis()).zRemRangeByScore(key, min, max);
    },
    // Hash commands
    async hIncrBy(key: string, field: string, increment: number) {
        return (await getRedis()).hIncrBy(key, field, increment);
    },
    async hMGet(key: string, fields: string[]) {
        return (await getRedis()).hMGet(key, fields);
    },
    async hScan(key: string, cursor: number, options?: { match?: string; count?: number }) {
        return (await getRedis()).hScan(key, cursor, options);
    },
    async hKeys(key: string) {
        return (await getRedis()).hKeys(key);
    },
    // String commands
    async getBytes(key: string) {
        return (await getRedis()).getBytes(key);
    },
    async getRange(key: string, start: number, end: number) {
        return (await getRedis()).getRange(key, start, end);
    },
    async setRange(key: string, offset: number, value: string) {
        return (await getRedis()).setRange(key, offset, value);
    },
    async strlen(key: string) {
        return (await getRedis()).strlen(key);
    },
    async mGet(keys: string[]) {
        return (await getRedis()).mGet(keys);
    },
    async mSet(keyValues: Record<string, string>) {
        return (await getRedis()).mSet(keyValues);
    },
    // Key commands
    async rename(key: string, newKey: string) {
        return (await getRedis()).rename(key, newKey);
    },
    // Sorted set commands
    async zScan(key: string, cursor: number, options?: { match?: string; count?: number }) {
        return (await getRedis()).zScan(key, cursor, options);
    },
    async zRemRangeByLex(key: string, min: string, max: string) {
        return (await getRedis()).zRemRangeByLex(key, min, max);
    },
    async zRemRangeByRank(key: string, start: number, stop: number) {
        return (await getRedis()).zRemRangeByRank(key, start, stop);
    },
    // Transaction commands
    async watch(...keys: string[]) {
        return (await getRedis()).watch(...keys);
    },
    // Bitfield commands
    async bitfield(
        key: string,
        commands: Array<{
            command: 'GET' | 'SET' | 'INCRBY' | 'OVERFLOW';
            encoding?: string;
            offset?: number;
            value?: number;
            overflow?: 'WRAP' | 'SAT' | 'FAIL';
        }>
    ) {
        return (await getRedis()).bitfield(key, commands);
    },
} as unknown as RedisClient;
