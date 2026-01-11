/** Initializes official @devvit/test mocks for local development. */

import { RedisMock } from '@devvit/redis/test';
import { RedditPluginMock } from '@devvit/reddit/test';
import { SchedulerMock } from '@devvit/scheduler/test';
import { SettingsMock } from '@devvit/settings/test';
import { NotificationsMock } from '@devvit/notifications/test';
import { MediaMock } from '@devvit/media/test';
import { RealtimeMock } from '@devvit/realtime/server/test';
import { Redis } from 'ioredis';
import { RedisMemoryServer } from 'redis-memory-server';

export const DEV_CONFIG = {
    username: 'u/dev-user123',
    userId: 't2_dev123' as const,
    subredditName: 'dev-subreddit',
    subredditId: 't5_dev456' as const,
    postId: 't3_devpost123' as const,
} as const;

const DEFAULT_SETTINGS: Record<string, string | number | boolean> = {};
let redisServer: RedisMemoryServer | null = null;
let redisConnection: Redis | null = null;
let redisMockInstance: RedisMock | null = null;
let redditMockInstance: RedditPluginMock | null = null;
let schedulerMockInstance: SchedulerMock | null = null;
let settingsMockInstance: SettingsMock | null = null;
let notificationsMockInstance: NotificationsMock | null = null;
let mediaMockInstance: MediaMock | null = null;
let realtimeMockInstance: RealtimeMock | null = null;

async function initializeRedisMock(): Promise<RedisMock> {
    if (redisMockInstance) return redisMockInstance;

    redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();

    redisConnection = new Redis({ host, port });
    redisMockInstance = new RedisMock(redisConnection, 'dev-local');

    return redisMockInstance;
}

export async function getRedisMock(): Promise<RedisMock> {
    return await initializeRedisMock();
}

function initializeRedditMock(): RedditPluginMock {
    if (redditMockInstance) return redditMockInstance;

    redditMockInstance = new RedditPluginMock();

    redditMockInstance.users.addUser({
        id: DEV_CONFIG.userId,
        name: DEV_CONFIG.username,
    });

    redditMockInstance.subreddits.addSubreddit({
        id: DEV_CONFIG.subredditId,
        displayName: DEV_CONFIG.subredditName,
        title: DEV_CONFIG.subredditName,
    });

    return redditMockInstance;
}

export function getRedditMock(): RedditPluginMock {
    return initializeRedditMock();
}

function initializeSchedulerMock(): SchedulerMock {
    if (schedulerMockInstance) return schedulerMockInstance;

    schedulerMockInstance = new SchedulerMock();
    return schedulerMockInstance;
}

export function getSchedulerMock(): SchedulerMock {
    return initializeSchedulerMock();
}

function initializeSettingsMock(): SettingsMock {
    if (settingsMockInstance) return settingsMockInstance;

    settingsMockInstance = new SettingsMock(DEFAULT_SETTINGS);
    return settingsMockInstance;
}

export function getSettingsMock(): SettingsMock {
    return initializeSettingsMock();
}

function initializeNotificationsMock(): NotificationsMock {
    if (notificationsMockInstance) return notificationsMockInstance;

    notificationsMockInstance = new NotificationsMock();
    return notificationsMockInstance;
}

export function getNotificationsMock(): NotificationsMock {
    return initializeNotificationsMock();
}

function initializeMediaMock(): MediaMock {
    if (mediaMockInstance) return mediaMockInstance;

    mediaMockInstance = new MediaMock();
    return mediaMockInstance;
}

export function getMediaMock(): MediaMock {
    return initializeMediaMock();
}

function initializeRealtimeMock(): RealtimeMock {
    if (realtimeMockInstance) return realtimeMockInstance;

    realtimeMockInstance = new RealtimeMock();
    return realtimeMockInstance;
}

export function getRealtimeMock(): RealtimeMock {
    return initializeRealtimeMock();
}

export function getDevContext() {
    return DEV_CONFIG;
}

export async function initializeAllMocks(): Promise<void> {
    await getRedisMock();
    getRedditMock();
    getSchedulerMock();
    getSettingsMock();
    getNotificationsMock();
    getMediaMock();
    getRealtimeMock();
}

export async function cleanupMocks(): Promise<void> {
    if (redisConnection) {
        await redisConnection.quit();
        redisConnection = null;
    }
    if (redisServer) {
        await redisServer.stop();
        redisServer = null;
    }
    redisMockInstance = null;
    redditMockInstance = null;
    schedulerMockInstance = null;
    settingsMockInstance = null;
    notificationsMockInstance = null;
    mediaMockInstance = null;
    realtimeMockInstance = null;
}
