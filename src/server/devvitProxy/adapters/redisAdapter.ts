/** Wraps RedisMock from @devvit/redis/test to match @devvit/web/server redis API. */

import type { RedisMock } from '@devvit/redis/test';
import type { redis as devvitRedis } from '@devvit/web/server';

type Redis = typeof devvitRedis;

export function createRedisAdapter(redisMock: RedisMock): Redis {
    const plugin = redisMock.plugin;

    return {
        async hGet(key: string, field: string): Promise<string | undefined> {
            const result = await plugin.HGet({ key, field });
            return result.value || undefined;
        },

        async hGetAll(key: string): Promise<Record<string, string>> {
            const result = await plugin.HGetAll({ key });
            const fieldValues: Record<string, string> = {};
            if (result.fieldValues && Array.isArray(result.fieldValues)) {
                for (const fv of result.fieldValues) {
                    if (fv && typeof fv === 'object' && 'field' in fv && 'value' in fv) {
                        const field = fv.field;
                        const value = fv.value;
                        if (field && value) {
                            fieldValues[field] = value;
                        }
                    }
                }
            }
            return fieldValues;
        },

        async hSet(key: string, fieldValues: Record<string, string>): Promise<number> {
            const result = await plugin.HSet({ key, ...fieldValues } as any);
            return Number(result.value ?? 0);
        },

        async hDel(key: string, fields: string[]): Promise<number> {
            const result = await plugin.HDel({ key, fields });
            return Number(result.value ?? 0);
        },

        async hIncrBy(key: string, field: string, increment: number): Promise<number> {
            const result = await plugin.HIncrBy({ key, field, value: increment });
            return Number(result.value ?? 0);
        },

        async hMGet(key: string, fields: string[]): Promise<(string | undefined)[]> {
            const result = await plugin.HMGet({ key, fields });
            return (result.values || []).map((v: any) => v || undefined);
        },

        async hScan(
            key: string,
            cursor: number,
            options?: { match?: string; count?: number }
        ): Promise<{ cursor: number; fieldValues: { field: string; value: string }[] }> {
            const result = await plugin.HScan({
                key,
                cursor,
                pattern: options?.match,
                count: options?.count,
            } as any);
            return {
                cursor: Number(result.cursor ?? 0),
                fieldValues: result.fieldValues || [],
            };
        },

        async hKeys(key: string): Promise<string[]> {
            const result = await plugin.HKeys({ key });
            return result.keys || [];
        },

        async hLen(key: string): Promise<number> {
            const result = await plugin.HLen({ key });
            return Number(result.value ?? 0);
        },

        async hSetNX(key: string, field: string, value: string): Promise<boolean> {
            const result = await plugin.HSetNX({ key, field, value });
            return (result as any).success === 1;
        },

        async get(key: string): Promise<string | undefined> {
            const result = await plugin.Get({ key });
            return result.value || undefined;
        },

        async set(key: string, value: string): Promise<void> {
            await plugin.Set({ key, value, expiration: 0, nx: false, xx: false });
        },

        async incrBy(key: string, increment: number): Promise<number> {
            const result = await plugin.IncrBy({ key, value: increment });
            return Number(result.value ?? 0);
        },

        async getBytes(key: string): Promise<Uint8Array | undefined> {
            const result = await plugin.GetBytes({ key });
            return result.value || undefined;
        },

        async getRange(key: string, start: number, end: number): Promise<string> {
            const result = await plugin.GetRange({ key, start, end });
            return result.value || '';
        },

        async setRange(key: string, offset: number, value: string): Promise<number> {
            const result = await plugin.SetRange({ key, offset, value });
            return Number(result.value ?? 0);
        },

        async strlen(key: string): Promise<number> {
            const result = await plugin.Strlen({ key });
            return Number(result.value ?? 0);
        },

        async mGet(keys: string[]): Promise<(string | null)[]> {
            const result = await plugin.MGet({ keys });
            return (result.values || []).map((v: any) => v || null);
        },

        async mSet(keyValues: Record<string, string>): Promise<void> {
            await plugin.MSet({ keyValues } as any);
        },

        async del(key: string): Promise<number> {
            const result = await plugin.Del({ keys: [key] });
            return Number(result.value ?? 0);
        },

        async exists(key: string): Promise<boolean> {
            const result = await plugin.Exists({ keys: [key] });
            return ((result as any).count || (result as any).exists || 0) > 0;
        },

        async type(key: string): Promise<string> {
            const result = await plugin.Type({ key });
            return result.value || 'none';
        },

        async rename(key: string, newKey: string): Promise<void> {
            await plugin.Rename({ key, newKey });
        },

        async expire(key: string, seconds: number): Promise<boolean> {
            await plugin.Expire({ key, seconds });
            return true;
        },

        async expireTime(key: string): Promise<number> {
            const result = await plugin.ExpireTime({ key });
            return Number(result.value ?? -1);
        },

        async zAdd(key: string, ...members: { score: number; member: string }[]): Promise<number> {
            const result = await plugin.ZAdd({ key, members });
            return Number(result.value ?? 0);
        },

        async zRange(
            key: string,
            start: number,
            stop: number
        ): Promise<{ member: string; score: number }[]> {
            const result = await plugin.ZRange({
                key: { key },
                start: start.toString(),
                stop: stop.toString(),
            } as any);
            return result.members ?? [];
        },

        async zScore(key: string, member: string): Promise<number | undefined> {
            const result = await plugin.ZScore({ key: { key }, member } as any);
            return result.value !== undefined ? result.value : undefined;
        },

        async zRem(key: string, members: string[]): Promise<number> {
            const result = await plugin.ZRem({ key: { key }, members } as any);
            return Number(result.value ?? 0);
        },

        async zCard(key: string): Promise<number> {
            const result = await plugin.ZCard({ key });
            return Number(result.value ?? 0);
        },

        async zRank(key: string, member: string): Promise<number | undefined> {
            const result = await plugin.ZRank({ key: { key }, member } as any);
            return result.value !== undefined ? Number(result.value) : undefined;
        },

        async zIncrBy(key: string, member: string, increment: number): Promise<number> {
            const result = await plugin.ZIncrBy({ key: { key }, member, value: increment } as any);
            return Number(result.value ?? 0);
        },

        async zScan(
            key: string,
            cursor: number,
            options?: { match?: string; count?: number }
        ): Promise<{ cursor: number; members: { member: string; score: number }[] }> {
            const result = await plugin.ZScan({
                key: { key },
                cursor,
                pattern: options?.match,
                count: options?.count,
            } as any);
            return {
                cursor: Number(result.cursor ?? 0),
                members: result.members || [],
            };
        },

        async zRemRangeByLex(key: string, min: string, max: string): Promise<number> {
            const result = await plugin.ZRemRangeByLex({ key: { key }, min, max } as any);
            return Number(result.value ?? 0);
        },

        async zRemRangeByRank(key: string, start: number, stop: number): Promise<number> {
            const result = await plugin.ZRemRangeByRank({ key: { key }, start, stop } as any);
            return Number(result.value ?? 0);
        },

        async zRemRangeByScore(key: string, min: number, max: number): Promise<number> {
            const result = await plugin.ZRemRangeByScore({ key: { key }, min, max } as any);
            return Number(result.value ?? 0);
        },

        async watch(...keys: string[]): Promise<RedisTransaction> {
            const watchResult = await plugin.Watch({ keys });
            const transactionId = (watchResult as any).id || (watchResult as any).transactionId;

            return createRedisTransaction(plugin, transactionId);
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
            const result = await plugin.Bitfield({ key, commands } as any);
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
    } as unknown as Redis;
}

export interface RedisTransaction {
    multi(): Promise<void>;
    exec(): Promise<number[]>;
    discard(): Promise<void>;
    unwatch(): Promise<void>;
    incrBy(key: string, increment: number): Promise<void>;
    set(key: string, value: string): Promise<void>;
    get(key: string): Promise<void>;
}

function createRedisTransaction(plugin: any, transactionId: string): RedisTransaction {
    return {
        async multi(): Promise<void> {
            await plugin.Multi({ id: transactionId });
        },

        async exec(): Promise<number[]> {
            const result = await plugin.Exec({ id: transactionId });
            const responses = result.responses || [];
            return responses.map((r: any) => {
                if (r.int64Value !== undefined) return Number(r.int64Value.value || r.int64Value);
                if (r.stringValue !== undefined) return r.stringValue.value || r.stringValue;
                if (r.doubleValue !== undefined) return Number(r.doubleValue.value || r.doubleValue);
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
            await plugin.IncrBy({ key, value: increment, transactionId: { id: transactionId } });
        },

        async set(key: string, value: string): Promise<void> {
            await plugin.Set({ key, value, expiration: 0, nx: false, xx: false, transactionId: { id: transactionId } });
        },

        async get(key: string): Promise<void> {
            await plugin.Get({ key, transactionId: { id: transactionId } });
        },
    };
}

export type RedisAdapter = Redis;
