/** Wraps RedisMock from @devvit/redis/test to match @devvit/web/server redis API. */

import type { RedisMock } from '@devvit/redis/test';
import type { redis as devvitRedis } from '@devvit/web/server';
import { RedisKeyScope } from '@devvit/protos/json/devvit/plugin/redis/redisapi.js';

type Redis = typeof devvitRedis;
type RedisWithoutGlobal = Omit<Redis, 'global'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRedisMethods(plugin: any, redisMock: RedisMock, scope: RedisKeyScope): RedisWithoutGlobal {
    return {
        async hGet(key: string, field: string): Promise<string | undefined> {
            const result = await plugin.HGet({ key, field, scope });
            return result.value || undefined;
        },

        async hGetAll(key: string): Promise<Record<string, string>> {
            const result = await plugin.HGetAll({ key, scope });

            // RedisMock (non-transaction) returns { fieldValues: { field1: value1, field2: value2, ... } }
            // This is because _queueOrRun returns operation() directly without applying mapper
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fieldValuesObj = (result as any)?.fieldValues;
            if (
                fieldValuesObj &&
                typeof fieldValuesObj === 'object' &&
                !Array.isArray(fieldValuesObj)
            ) {
                return fieldValuesObj as Record<string, string>;
            }

            // Fallback: Handle { values: { values: [field1, value1, ...] } } format (transaction mode)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const flatArray = (result as any)?.values?.values;
            if (Array.isArray(flatArray)) {
                const fieldValues: Record<string, string> = {};
                for (let i = 0; i < flatArray.length; i += 2) {
                    const field = flatArray[i];
                    const value = flatArray[i + 1];
                    if (field && value !== undefined) {
                        fieldValues[field] = value;
                    }
                }
                return fieldValues;
            }

            return {};
        },

        async hSet(key: string, fieldValues: Record<string, string>): Promise<number> {
            // Convert Record to fv array format expected by RedisMock protobuf API
            const fv = Object.entries(fieldValues).map(([field, value]) => ({ field, value }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.HSet({ key, fv, scope } as any);
            return Number(result.value ?? 0);
        },

        async hDel(key: string, fields: string[]): Promise<number> {
            const result = await plugin.HDel({ key, fields, scope });
            return Number(result.value ?? 0);
        },

        async hIncrBy(key: string, field: string, increment: number): Promise<number> {
            const result = await plugin.HIncrBy({ key, field, value: increment, scope });
            return Number(result.value ?? 0);
        },

        async hMGet(key: string, fields: string[]): Promise<(string | undefined)[]> {
            const result = await plugin.HMGet({ key, fields, scope });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (result.values || []).map((v: any) => v || undefined);
        },

        async hScan(
            key: string,
            cursor: number,
            options?: { match?: string; count?: number }
        ): Promise<{ cursor: number; fieldValues: { field: string; value: string }[] }> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.HScan({
                key,
                cursor,
                pattern: options?.match,
                count: options?.count,
                scope,
            } as any);
            return {
                cursor: Number(result.cursor ?? 0),
                fieldValues: result.fieldValues || [],
            };
        },

        async hKeys(key: string): Promise<string[]> {
            const result = await plugin.HKeys({ key, scope });
            return result.keys || [];
        },

        async hLen(key: string): Promise<number> {
            const result = await plugin.HLen({ key, scope });
            return Number(result.value ?? 0);
        },

        async hSetNX(key: string, field: string, value: string): Promise<boolean> {
            const result = await plugin.HSetNX({ key, field, value, scope });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (result as any).success === 1;
        },

        async get(key: string): Promise<string | undefined> {
            const result = await plugin.Get({ key, scope });
            return result.value || undefined;
        },

        async set(key: string, value: string, options?: { expiration?: Date }): Promise<void> {
            // Convert Date to TTL (seconds from now), matching production behavior
            let expiration = 0;
            if (options?.expiration) {
                expiration = Math.floor((options.expiration.getTime() - Date.now()) / 1000);
                if (expiration < 1) {
                    expiration = 1; // minimum 1 second per production
                }
            }
            await plugin.Set({ key, value, expiration, nx: false, xx: false, scope });
        },

        async incrBy(key: string, increment: number): Promise<number> {
            const result = await plugin.IncrBy({ key, value: increment, scope });
            return Number(result.value ?? 0);
        },

        async getBytes(key: string): Promise<Uint8Array | undefined> {
            const result = await plugin.GetBytes({ key, scope });
            return result.value || undefined;
        },

        async getBuffer(key: string): Promise<Buffer | undefined> {
            const result = await plugin.GetBytes({ key, scope });
            if (!result.value) return undefined;
            return Buffer.from(result.value);
        },

        async getRange(key: string, start: number, end: number): Promise<string> {
            const result = await plugin.GetRange({ key, start, end, scope });
            return result.value || '';
        },

        async setRange(key: string, offset: number, value: string): Promise<number> {
            const result = await plugin.SetRange({ key, offset, value, scope });
            return Number(result.value ?? 0);
        },

        async strlen(key: string): Promise<number> {
            const result = await plugin.Strlen({ key, scope });
            return Number(result.value ?? 0);
        },

        async mGet(keys: string[]): Promise<(string | null)[]> {
            const result = await plugin.MGet({ keys, scope });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (result.values || []).map((v: any) => v || null);
        },

        async mSet(keyValues: Record<string, string>): Promise<void> {
            // Convert Record to kv array format expected by RedisMock protobuf API
            const kv = Object.entries(keyValues).map(([key, value]) => ({ key, value }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await plugin.MSet({ kv, scope } as any);
        },

        async del(key: string): Promise<number> {
            const result = await plugin.Del({ keys: [key], scope });
            return Number(result.value ?? 0);
        },

        async exists(key: string): Promise<boolean> {
            const result = await plugin.Exists({ keys: [key], scope });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return ((result as any).existingKeys || 0) > 0;
        },

        async type(key: string): Promise<string> {
            const result = await plugin.Type({ key, scope });
            return result.value || 'none';
        },

        async rename(key: string, newKey: string): Promise<void> {
            await plugin.Rename({ key, newKey, scope });
        },

        async expire(key: string, seconds: number): Promise<boolean> {
            await plugin.Expire({ key, seconds, scope });
            return true;
        },

        async expireTime(key: string): Promise<number> {
            const result = await plugin.ExpireTime({ key, scope });
            return Number(result.value ?? -1);
        },

        async zAdd(key: string, ...members: { score: number; member: string }[]): Promise<number> {
            const result = await plugin.ZAdd({ key, members, scope });
            return Number(result.value ?? 0);
        },

        async zRange(
            key: string,
            start: number | string,
            stop: number | string,
            options?: { by?: 'rank' | 'score' | 'lex'; reverse?: boolean; limit?: { offset: number; count: number } }
        ): Promise<{ member: string; score: number }[]> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.ZRange({
                key: { key, scope },
                start: start.toString(),
                stop: stop.toString(),
                rev: options?.reverse ?? false,
                byScore: options?.by === 'score',
                byLex: options?.by === 'lex',
                offset: options?.limit?.offset,
                count: options?.limit?.count,
            } as any);
            return result.members ?? [];
        },

        async zScore(key: string, member: string): Promise<number | undefined> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.ZScore({ key: { key, scope }, member } as any);
            return result.value !== undefined ? result.value : undefined;
        },

        async zRem(key: string, members: string[]): Promise<number> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.ZRem({ key: { key, scope }, members } as any);
            return Number(result.value ?? 0);
        },

        async zCard(key: string): Promise<number> {
            const result = await plugin.ZCard({ key, scope });
            return Number(result.value ?? 0);
        },

        async zRank(key: string, member: string): Promise<number | undefined> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.ZRank({ key: { key, scope }, member } as any);
            return result.value !== undefined ? Number(result.value) : undefined;
        },

        async zIncrBy(key: string, member: string, increment: number): Promise<number> {
            const result = await plugin.ZIncrBy({ key, member, value: increment, scope });
            return Number(result.value ?? 0);
        },

        async zScan(
            key: string,
            cursor: number,
            options?: { match?: string; count?: number }
        ): Promise<{ cursor: number; members: { member: string; score: number }[] }> {
            const result = await plugin.ZScan({
                key,
                cursor,
                pattern: options?.match,
                count: options?.count,
                scope,
            });
            return {
                cursor: Number(result.cursor ?? 0),
                members: result.members || [],
            };
        },

        async zRemRangeByLex(key: string, min: string, max: string): Promise<number> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.ZRemRangeByLex({ key: { key, scope }, min, max } as any);
            return Number(result.value ?? 0);
        },

        async zRemRangeByRank(key: string, start: number, stop: number): Promise<number> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.ZRemRangeByRank({ key: { key, scope }, start, stop } as any);
            return Number(result.value ?? 0);
        },

        async zRemRangeByScore(key: string, min: number, max: number): Promise<number> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.ZRemRangeByScore({ key: { key, scope }, min, max } as any);
            return Number(result.value ?? 0);
        },

        async watch(...keys: string[]): Promise<RedisTransaction> {
            const watchResult = await plugin.Watch({ keys, scope });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transactionId = (watchResult as any).id || (watchResult as any).transactionId;

            return createRedisTransaction(plugin, transactionId, scope);
        },

        async bitfield(
            key: string,
            commands: Array<{
                command: 'GET' | 'SET' | 'INCRBY' | 'OVERFLOW';
                encoding?: string;
                offset?: number;
                value?: number;
                overflow?: 'WRAP' | 'SAT' | 'FAIL';
            }>
        ): Promise<number[]> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await plugin.Bitfield({ key, commands, scope } as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (result.results || []).map((v: any) => Number(v ?? 0));
        },

        async _clear(): Promise<void> {
            await redisMock.clear();
        },

        _stats(): Record<string, number> {
            return {
                hashes: 0,
                strings: 0,
                zsets: 0,
            };
        },
    } as unknown as RedisWithoutGlobal;
}

export function createRedisAdapter(redisMock: RedisMock): Redis {
    const plugin = redisMock.plugin;
    const methods = createRedisMethods(plugin, redisMock, RedisKeyScope.INSTALLATION);

    return {
        ...methods,
        // Global redis for cross-subreddit data persistence
        global: createRedisMethods(plugin, redisMock, RedisKeyScope.GLOBAL),
    } as unknown as Redis;
}

export interface RedisTransaction {
    multi(): Promise<void>;
    exec(): Promise<any[]>;
    discard(): Promise<void>;
    unwatch(): Promise<void>;
    incrBy(key: string, increment: number): Promise<void>;
    set(key: string, value: string): Promise<void>;
    get(key: string): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRedisTransaction(plugin: any, transactionId: string, scope: RedisKeyScope): RedisTransaction {
    return {
        async multi(): Promise<void> {
            await plugin.Multi({ id: transactionId });
        },

        async exec(): Promise<any[]> {
            const result = await plugin.Exec({ id: transactionId });
            const response = result.response || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response.map((r: any) => {
                if (r.members !== undefined) return r.members;
                if (r.nil !== undefined) return null;
                if (r.num !== undefined) return r.num;
                if (r.values !== undefined) return r.values.values;
                if (r.str !== undefined) return r.str;
                if (r.dbl !== undefined) return r.dbl;
                return r;
            });
        },

        async discard(): Promise<void> {
            await plugin.Discard({ id: transactionId });
        },

        async unwatch(): Promise<void> {
            await plugin.Unwatch({ id: transactionId });
        },

        async incrBy(key: string, increment: number): Promise<void> {
            await plugin.IncrBy({ key, value: increment, scope, transactionId: { id: transactionId } });
        },

        async set(key: string, value: string, options?: { expiration?: Date }): Promise<void> {
            // Convert Date to TTL (seconds from now), matching production behavior
            let expiration = 0;
            if (options?.expiration) {
                expiration = Math.floor((options.expiration.getTime() - Date.now()) / 1000);
                if (expiration < 1) {
                    expiration = 1; // minimum 1 second per production
                }
            }
            await plugin.Set({
                key,
                value,
                expiration,
                nx: false,
                xx: false,
                scope,
                transactionId: { id: transactionId },
            });
        },

        async get(key: string): Promise<void> {
            await plugin.Get({ key, scope, transactionId: { id: transactionId } });
        },
    };
}

export type RedisAdapter = Redis;
