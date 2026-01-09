/**
 * Redis storage proxy
 *
 * Exports either real Devvit redis or mock redis based on environment.
 * Services import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { redis } from '../utils/storage';
 *   const data = await redis.hGetAll(key);
 */

import { mockRedis, type MockRedis } from './mockRedis';
import { IS_DEV } from './environment';

/**
 * Redis instance - mock in dev, lazy devvit import in production
 *
 * Uses lazy getter pattern to avoid top-level await.
 * Dynamic import avoids loading @devvit/web/server in local dev,
 * which would crash because Devvit runtime isn't available.
 *
 * Type safety note: Devvit's RedisClient has a different API surface than our mock.
 * We cast to MockRedis interface which represents the subset of methods we actually use.
 * If we attempt to use unsupported methods, TypeScript will catch it at the call site.
 */
let cachedRedis: MockRedis | null = null;

async function getRedis(): Promise<MockRedis> {
    if (cachedRedis) return cachedRedis;

    if (IS_DEV) {
        cachedRedis = mockRedis;
    } else {
        const devvit = await import('@devvit/web/server');
        cachedRedis = devvit.redis as unknown as MockRedis;
    }

    return cachedRedis;
}

export const redis: MockRedis = {
    async hGet(key: string, field: string) {
        return (await getRedis()).hGet(key, field);
    },
    async hGetAll(key: string) {
        return (await getRedis()).hGetAll(key);
    },
    async hSet(key: string, fieldValues: Record<string, string>) {
        return (await getRedis()).hSet(key, fieldValues);
    },
    async hDel(key: string, fields: string[]) {
        return (await getRedis()).hDel(key, fields);
    },
    async hIncrBy(key: string, field: string, increment: number) {
        return (await getRedis()).hIncrBy(key, field, increment);
    },
    async get(key: string) {
        return (await getRedis()).get(key);
    },
    async set(key: string, value: string) {
        return (await getRedis()).set(key, value);
    },
    async incrBy(key: string, increment: number) {
        return (await getRedis()).incrBy(key, increment);
    },
    async del(key: string) {
        return (await getRedis()).del(key);
    },
    async exists(key: string) {
        return (await getRedis()).exists(key);
    },
    async sAdd(key: string, members: string[]) {
        return (await getRedis()).sAdd(key, members);
    },
    async sMembers(key: string) {
        return (await getRedis()).sMembers(key);
    },
    async sIsMember(key: string, member: string) {
        return (await getRedis()).sIsMember(key, member);
    },
    async sRem(key: string, members: string[]) {
        return (await getRedis()).sRem(key, members);
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
    async lPush(key: string, elements: string[]) {
        return (await getRedis()).lPush(key, elements);
    },
    async rPush(key: string, elements: string[]) {
        return (await getRedis()).rPush(key, elements);
    },
    async lRange(key: string, start: number, stop: number) {
        return (await getRedis()).lRange(key, start, stop);
    },
    _clear() {
        if (IS_DEV) mockRedis._clear();
    },
    _stats() {
        return IS_DEV ? mockRedis._stats() : { hashes: 0, strings: 0, sets: 0, lists: 0, zsets: 0 };
    },
};

export type Redis = MockRedis;
