/* eslint-disable @typescript-eslint/no-explicit-any */
/** Wraps RedisMock from @devvit/redis/test to match @devvit/web/server redis API. */

import type { RedisMock } from '@devvit/redis/test';
import type { redis as devvitRedis } from '@devvit/web/server';

type Redis = typeof devvitRedis;

export function createRedisAdapter(redisMock: RedisMock): Redis {
    const plugin = redisMock.plugin;

    const adapter = {
        async hGet(key: string, field: string): Promise<string | undefined> {
            const result = await plugin.HGet({ key, field });
            return result.value || undefined;
        },

        async hGetAll(key: string): Promise<Record<string, string>> {
            const result = await plugin.HGetAll({ key });

            // RedisMock (non-transaction) returns { fieldValues: { field1: value1, field2: value2, ... } }
            // This is because _queueOrRun returns operation() directly without applying mapper

            const fieldValuesObj = (result as any)?.fieldValues;
            if (
                fieldValuesObj &&
                typeof fieldValuesObj === 'object' &&
                !Array.isArray(fieldValuesObj)
            ) {
                return fieldValuesObj as Record<string, string>;
            }

            // Fallback: Handle { values: { values: [field1, value1, ...] } } format (transaction mode)

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

            const result = await plugin.HSet({ key, fv } as any);
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

        async hMGet(key: string, fields: string[]): Promise<(string | null)[]> {
            const result = await plugin.HMGet({ key, fields });

            return (result.values || []).map((v: any) => v || null);
        },

        async hScan(
            key: string,
            cursor: number,
            pattern?: string,
            count?: number
        ): Promise<{ cursor: number; fieldValues: { field: string; value: string }[] }> {
            const result = await plugin.HScan({
                key,
                cursor,
                pattern,
                count,
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

        async hSetNX(key: string, field: string, value: string): Promise<number> {
            const result = await plugin.HSetNX({ key, field, value });

            return (result as any).success === 1 ? 1 : 0;
        },

        async get(key: string): Promise<string | undefined> {
            const result = await plugin.Get({ key });
            return result.value || undefined;
        },

        async getBuffer(key: string): Promise<Buffer | undefined> {
            const result = await plugin.GetBytes({ key });
            if (!result.value) return undefined;
            return Buffer.from(result.value);
        },

        async set(
            key: string,
            value: string,
            options?: { nx?: boolean; xx?: boolean; expiration?: Date }
        ): Promise<string> {
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
                nx: options?.nx ?? false,
                xx: options?.xx ?? false,
            });
            return 'OK';
        },

        async incrBy(key: string, increment: number): Promise<number> {
            const result = await plugin.IncrBy({ key, value: increment });
            return Number(result.value ?? 0);
        },

        async getRange(key: string, start: number, end: number): Promise<string> {
            const result = await plugin.GetRange({ key, start, end });
            return result.value || '';
        },

        async setRange(key: string, offset: number, value: string): Promise<number> {
            const result = await plugin.SetRange({ key, offset, value });
            return Number(result.value ?? 0);
        },

        async strLen(key: string): Promise<number> {
            const result = await plugin.Strlen({ key });
            return Number(result.value ?? 0);
        },

        async mGet(keys: string[]): Promise<(string | null)[]> {
            const result = await plugin.MGet({ keys });

            return (result.values || []).map((v: any) => v || null);
        },

        async mSet(keyValues: Record<string, string>): Promise<void> {
            // Convert Record to kv array format expected by RedisMock protobuf API
            const kv = Object.entries(keyValues).map(([key, value]) => ({ key, value }));

            await plugin.MSet({ kv } as any);
        },

        async del(...keys: string[]): Promise<void> {
            await plugin.Del({ keys });
        },

        async exists(...keys: string[]): Promise<number> {
            let count = 0;
            for (const key of keys) {
                const result = await plugin.Exists({ keys: [key] });
                if (((result as any).existingKeys || 0) > 0) {
                    count++;
                }
            }
            return count;
        },

        async type(key: string): Promise<string> {
            const result = await plugin.Type({ key });
            return result.value || 'none';
        },

        async rename(key: string, newKey: string): Promise<string> {
            await plugin.Rename({ key, newKey });
            return 'OK';
        },

        async expire(key: string, seconds: number): Promise<void> {
            await plugin.Expire({ key, seconds });
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
            start: number | string,
            stop: number | string,
            options?: {
                reverse?: boolean;
                by?: 'score' | 'lex' | 'rank';
                limit?: { offset: number; count: number };
            }
        ): Promise<{ member: string; score: number }[]> {
            const result = await plugin.ZRange({
                key: { key },
                start: start.toString(),
                stop: stop.toString(),
                by: options?.by,
                reverse: options?.reverse,
                limit: options?.limit,
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
            const result = await plugin.ZIncrBy({ key, member, value: increment });
            return Number(result.value ?? 0);
        },

        async zScan(
            key: string,
            cursor: number,
            pattern?: string,
            count?: number
        ): Promise<{ cursor: number; members: { member: string; score: number }[] }> {
            const result = await plugin.ZScan({
                key,
                cursor,
                pattern,
                count,
            });
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

        async watch(...keys: string[]): Promise<any> {
            const watchResult = await plugin.Watch({ keys });

            const transactionId = (watchResult as any).id || (watchResult as any).transactionId;

            return createRedisTransaction(plugin, transactionId);
        },

        bitfield(key: string, ...cmds: any[]): Promise<number[]> {
            // Convert tuple-based commands to plugin format
            // Package format: ['get', 'u4', 0], ['set', 'u8', 0, 255], ['incrBy', 'i5', 100, 1], ['overflow', 'sat']
            const commands: any[] = [];
            const flatArgs = cmds.flat();

            let i = 0;
            while (i < flatArgs.length) {
                const op = String(flatArgs[i]).toLowerCase();
                if (op === 'get') {
                    commands.push({
                        command: 'GET',
                        encoding: flatArgs[i + 1],
                        offset: flatArgs[i + 2],
                    });
                    i += 3;
                } else if (op === 'set') {
                    commands.push({
                        command: 'SET',
                        encoding: flatArgs[i + 1],
                        offset: flatArgs[i + 2],
                        value: flatArgs[i + 3],
                    });
                    i += 4;
                } else if (op === 'incrby') {
                    commands.push({
                        command: 'INCRBY',
                        encoding: flatArgs[i + 1],
                        offset: flatArgs[i + 2],
                        value: flatArgs[i + 3],
                    });
                    i += 4;
                } else if (op === 'overflow') {
                    commands.push({
                        command: 'OVERFLOW',
                        overflow: String(flatArgs[i + 1]).toUpperCase(),
                    });
                    i += 2;
                } else {
                    i++;
                }
            }

            return plugin
                .Bitfield({ key, commands } as any)
                .then((result: any) => (result.results || []).map((v: any) => Number(v ?? 0)));
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
    } as any;

    // global: in dev mode, point back to the same adapter (single-tenant)
    adapter.global = adapter;

    return adapter as unknown as Redis;
}

function createRedisTransaction(plugin: any, transactionId: string): any {
    const txId = { id: transactionId };

    const tx: any = {
        async exec(): Promise<any[]> {
            const result = await plugin.Exec({ id: transactionId });
            const response = result.response || [];

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

        async multi(): Promise<any> {
            await plugin.Multi({ id: transactionId });
            return tx;
        },

        async discard(): Promise<void> {
            await plugin.Discard({ id: transactionId });
        },

        async watch(...keys: string[]): Promise<any> {
            await plugin.Watch({ keys, transactionId: txId });
            return tx;
        },

        async unwatch(): Promise<any> {
            await plugin.Unwatch({ id: transactionId });
            return tx;
        },

        // String commands
        async get(key: string): Promise<any> {
            await plugin.Get({ key, transactionId: txId });
            return tx;
        },

        async set(
            key: string,
            value: string,
            options?: { nx?: boolean; xx?: boolean; expiration?: Date }
        ): Promise<any> {
            let expiration = 0;
            if (options?.expiration) {
                expiration = Math.floor((options.expiration.getTime() - Date.now()) / 1000);
                if (expiration < 1) expiration = 1;
            }
            await plugin.Set({
                key,
                value,
                expiration,
                nx: options?.nx ?? false,
                xx: options?.xx ?? false,
                transactionId: txId,
            });
            return tx;
        },

        async del(...keys: string[]): Promise<any> {
            await plugin.Del({ keys, transactionId: txId });
            return tx;
        },

        async incrBy(key: string, value: number): Promise<any> {
            await plugin.IncrBy({ key, value, transactionId: txId });
            return tx;
        },

        async type(key: string): Promise<any> {
            await plugin.Type({ key, transactionId: txId });
            return tx;
        },

        async getRange(key: string, start: number, end: number): Promise<any> {
            await plugin.GetRange({ key, start, end, transactionId: txId });
            return tx;
        },

        async setRange(key: string, offset: number, value: string): Promise<any> {
            await plugin.SetRange({ key, offset, value, transactionId: txId });
            return tx;
        },

        async strLen(key: string): Promise<any> {
            await plugin.Strlen({ key, transactionId: txId });
            return tx;
        },

        async mGet(keys: string[]): Promise<any> {
            await plugin.MGet({ keys, transactionId: txId });
            return tx;
        },

        async mSet(keyValues: Record<string, string>): Promise<any> {
            const kv = Object.entries(keyValues).map(([key, value]) => ({ key, value }));
            await plugin.MSet({ kv, transactionId: txId } as any);
            return tx;
        },

        async expire(key: string, seconds: number): Promise<any> {
            await plugin.Expire({ key, seconds, transactionId: txId });
            return tx;
        },

        async expireTime(key: string): Promise<any> {
            await plugin.ExpireTime({ key, transactionId: txId });
            return tx;
        },

        // Hash commands
        async hSet(key: string, fieldValues: Record<string, string>): Promise<any> {
            const fv = Object.entries(fieldValues).map(([field, value]) => ({ field, value }));
            await plugin.HSet({ key, fv, transactionId: txId } as any);
            return tx;
        },

        async hGet(key: string, field: string): Promise<any> {
            await plugin.HGet({ key, field, transactionId: txId });
            return tx;
        },

        async hMGet(key: string, fields: string[]): Promise<any> {
            await plugin.HMGet({ key, fields, transactionId: txId });
            return tx;
        },

        async hGetAll(key: string): Promise<any> {
            await plugin.HGetAll({ key, transactionId: txId });
            return tx;
        },

        async hDel(key: string, fields: string[]): Promise<any> {
            await plugin.HDel({ key, fields, transactionId: txId });
            return tx;
        },

        async hScan(key: string, cursor: number, pattern?: string, count?: number): Promise<any> {
            await plugin.HScan({ key, cursor, pattern, count, transactionId: txId } as any);
            return tx;
        },

        async hKeys(key: string): Promise<any> {
            await plugin.HKeys({ key, transactionId: txId });
            return tx;
        },

        async hIncrBy(key: string, field: string, value: number): Promise<any> {
            await plugin.HIncrBy({ key, field, value, transactionId: txId });
            return tx;
        },

        async hLen(key: string): Promise<any> {
            await plugin.HLen({ key, transactionId: txId });
            return tx;
        },

        // Sorted set commands
        async zAdd(key: string, ...members: { score: number; member: string }[]): Promise<any> {
            await plugin.ZAdd({ key, members, transactionId: txId });
            return tx;
        },

        async zRange(
            key: string,
            start: number | string,
            stop: number | string,
            options?: any
        ): Promise<any> {
            await plugin.ZRange({
                key: { key },
                start: start.toString(),
                stop: stop.toString(),
                by: options?.by,
                reverse: options?.reverse,
                limit: options?.limit,
                transactionId: txId,
            } as any);
            return tx;
        },

        async zRem(key: string, members: string[]): Promise<any> {
            await plugin.ZRem({ key: { key }, members, transactionId: txId } as any);
            return tx;
        },

        async zScore(key: string, member: string): Promise<any> {
            await plugin.ZScore({ key: { key }, member, transactionId: txId } as any);
            return tx;
        },

        async zRank(key: string, member: string): Promise<any> {
            await plugin.ZRank({ key: { key }, member, transactionId: txId } as any);
            return tx;
        },

        async zIncrBy(key: string, member: string, value: number): Promise<any> {
            await plugin.ZIncrBy({ key, member, value, transactionId: txId });
            return tx;
        },

        async zCard(key: string): Promise<any> {
            await plugin.ZCard({ key, transactionId: txId });
            return tx;
        },

        async zScan(key: string, cursor: number, pattern?: string, count?: number): Promise<any> {
            await plugin.ZScan({ key, cursor, pattern, count, transactionId: txId });
            return tx;
        },

        async zRemRangeByLex(key: string, min: string, max: string): Promise<any> {
            await plugin.ZRemRangeByLex({ key: { key }, min, max, transactionId: txId } as any);
            return tx;
        },

        async zRemRangeByRank(key: string, start: number, stop: number): Promise<any> {
            await plugin.ZRemRangeByRank({ key: { key }, start, stop, transactionId: txId } as any);
            return tx;
        },

        async zRemRangeByScore(key: string, min: number, max: number): Promise<any> {
            await plugin.ZRemRangeByScore({ key: { key }, min, max, transactionId: txId } as any);
            return tx;
        },
    };

    return tx;
}

export type RedisAdapter = Redis;
