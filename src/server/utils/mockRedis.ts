/**
 * In-memory Redis mock for local development
 *
 * Implements the subset of Redis commands used by Skyboard services.
 * Data persists only for the duration of the server process.
 */

const hashStorage = new Map<string, Record<string, string>>();
const stringStorage = new Map<string, string>();
const setStorage = new Map<string, Set<string>>();
const listStorage = new Map<string, string[]>();
const zsetStorage = new Map<string, Map<string, number>>();

export const mockRedis = {
    // =================================
    // HASH COMMANDS
    // =================================

    async hGet(key: string, field: string): Promise<string | undefined> {
        const hash = hashStorage.get(key);
        return hash?.[field];
    },

    async hGetAll(key: string): Promise<Record<string, string>> {
        return hashStorage.get(key) ?? {};
    },

    async hSet(key: string, fieldValues: Record<string, string>): Promise<number> {
        const existing = hashStorage.get(key) ?? {};
        const newFields = Object.keys(fieldValues).filter(f => !(f in existing));
        hashStorage.set(key, { ...existing, ...fieldValues });
        return newFields.length;
    },

    async hDel(key: string, fields: string[]): Promise<number> {
        const hash = hashStorage.get(key);
        if (!hash) return 0;

        let deleted = 0;
        for (const field of fields) {
            if (field in hash) {
                delete hash[field];
                deleted++;
            }
        }
        return deleted;
    },

    async hIncrBy(key: string, field: string, increment: number): Promise<number> {
        const hash = hashStorage.get(key) ?? {};
        const current = parseInt(hash[field] ?? '0', 10);
        const newValue = current + increment;
        hash[field] = newValue.toString();
        hashStorage.set(key, hash);
        return newValue;
    },

    // =================================
    // STRING COMMANDS
    // =================================

    async get(key: string): Promise<string | undefined> {
        return stringStorage.get(key);
    },

    async set(key: string, value: string): Promise<void> {
        stringStorage.set(key, value);
    },

    async incrBy(key: string, increment: number): Promise<number> {
        const current = parseInt(stringStorage.get(key) ?? '0', 10);
        const newValue = current + increment;
        stringStorage.set(key, newValue.toString());
        return newValue;
    },

    // =================================
    // KEY COMMANDS
    // =================================

    async del(key: string): Promise<number> {
        let deleted = 0;
        if (hashStorage.delete(key)) deleted++;
        if (stringStorage.delete(key)) deleted++;
        if (setStorage.delete(key)) deleted++;
        if (listStorage.delete(key)) deleted++;
        if (zsetStorage.delete(key)) deleted++;
        return deleted > 0 ? 1 : 0;
    },

    async exists(key: string): Promise<boolean> {
        return (
            hashStorage.has(key) ||
            stringStorage.has(key) ||
            setStorage.has(key) ||
            listStorage.has(key) ||
            zsetStorage.has(key)
        );
    },

    // =================================
    // SET COMMANDS
    // =================================

    async sAdd(key: string, members: string[]): Promise<number> {
        const set = setStorage.get(key) ?? new Set();
        let added = 0;
        for (const member of members) {
            if (!set.has(member)) {
                set.add(member);
                added++;
            }
        }
        setStorage.set(key, set);
        return added;
    },

    async sMembers(key: string): Promise<string[]> {
        const set = setStorage.get(key);
        return set ? Array.from(set) : [];
    },

    async sIsMember(key: string, member: string): Promise<boolean> {
        const set = setStorage.get(key);
        return set?.has(member) ?? false;
    },

    async sRem(key: string, members: string[]): Promise<number> {
        const set = setStorage.get(key);
        if (!set) return 0;

        let removed = 0;
        for (const member of members) {
            if (set.delete(member)) removed++;
        }
        return removed;
    },

    // =================================
    // SORTED SET COMMANDS
    // =================================

    async zAdd(key: string, ...members: { score: number; member: string }[]): Promise<number> {
        const zset = zsetStorage.get(key) ?? new Map();
        let added = 0;
        for (const { score, member } of members) {
            if (!zset.has(member)) added++;
            zset.set(member, score);
        }
        zsetStorage.set(key, zset);
        return added;
    },

    async zRange(
        key: string,
        start: number,
        stop: number
    ): Promise<{ member: string; score: number }[]> {
        const zset = zsetStorage.get(key);
        if (!zset) return [];

        const sorted = Array.from(zset.entries())
            .sort((a, b) => a[1] - b[1])
            .map(([member, score]) => ({ member, score }));

        // Handle negative indices
        const len = sorted.length;
        const startIdx = start < 0 ? Math.max(0, len + start) : start;
        const stopIdx = stop < 0 ? len + stop + 1 : stop + 1;

        return sorted.slice(startIdx, stopIdx);
    },

    async zScore(key: string, member: string): Promise<number | undefined> {
        const zset = zsetStorage.get(key);
        return zset?.get(member);
    },

    async zRem(key: string, members: string[]): Promise<number> {
        const zset = zsetStorage.get(key);
        if (!zset) return 0;

        let removed = 0;
        for (const member of members) {
            if (zset.delete(member)) removed++;
        }
        return removed;
    },

    // =================================
    // LIST COMMANDS
    // =================================

    async lPush(key: string, elements: string[]): Promise<number> {
        const list = listStorage.get(key) ?? [];
        list.unshift(...elements);
        listStorage.set(key, list);
        return list.length;
    },

    async rPush(key: string, elements: string[]): Promise<number> {
        const list = listStorage.get(key) ?? [];
        list.push(...elements);
        listStorage.set(key, list);
        return list.length;
    },

    async lRange(key: string, start: number, stop: number): Promise<string[]> {
        const list = listStorage.get(key) ?? [];
        const len = list.length;
        const startIdx = start < 0 ? Math.max(0, len + start) : start;
        const stopIdx = stop < 0 ? len + stop + 1 : stop + 1;
        return list.slice(startIdx, stopIdx);
    },

    // =================================
    // DEV UTILITIES
    // =================================

    /** Clear all mock data (useful for tests) */
    _clear(): void {
        hashStorage.clear();
        stringStorage.clear();
        setStorage.clear();
        listStorage.clear();
        zsetStorage.clear();
        console.log('[MockRedis] All data cleared');
    },

    /** Get storage stats for debugging */
    _stats(): Record<string, number> {
        return {
            hashes: hashStorage.size,
            strings: stringStorage.size,
            sets: setStorage.size,
            lists: listStorage.size,
            zsets: zsetStorage.size,
        };
    },
};

export type MockRedis = typeof mockRedis;
