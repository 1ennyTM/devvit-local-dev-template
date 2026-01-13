/** Initializes official @devvit/test mocks for local development. */

export const DEV_CONFIG = {
    username: 'dev-user123',
    userId: 't2_dev123' as const,
    subredditName: 'dev-subreddit',
    subredditId: 't5_dev456' as const,
    postId: 't3_devpost123' as const,
    postData: undefined as any,
};

const DEFAULT_SETTINGS: Record<string, string | number | boolean> = {};
let redisServer: any | null = null;
let redisConnection: any | null = null;
let redisMockInstance: any | null = null;
let redditMockInstance: any | null = null;
let schedulerMockInstance: any | null = null;
let settingsMockInstance: any | null = null;
let notificationsMockInstance: any | null = null;
let mediaMockInstance: any | null = null;
let realtimeMockInstance: any | null = null;

async function initializeRedisMock(): Promise<any> {
    if (redisMockInstance) return redisMockInstance;

    const { RedisMemoryServer } = await import('redis-memory-server');
    const { Redis } = await import('ioredis');
    const { RedisMock } = await import('@devvit/redis/test');

    redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();

    redisConnection = new Redis({ host, port });
    redisMockInstance = new RedisMock(redisConnection, 'dev-local');

    return redisMockInstance;
}

export async function getRedisMock(): Promise<any> {
    return await initializeRedisMock();
}

async function initializeRedditMock(): Promise<any> {
    if (redditMockInstance) return redditMockInstance;

    const { RedditPluginMock } = await import('@devvit/reddit/test');

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

export async function getRedditMock(): Promise<any> {
    return await initializeRedditMock();
}

async function initializeSchedulerMock(): Promise<any> {
    if (schedulerMockInstance) return schedulerMockInstance;

    const { SchedulerMock } = await import('@devvit/scheduler/test');

    schedulerMockInstance = new SchedulerMock();
    return schedulerMockInstance;
}

export async function getSchedulerMock(): Promise<any> {
    return await initializeSchedulerMock();
}

async function initializeSettingsMock(): Promise<any> {
    if (settingsMockInstance) return settingsMockInstance;

    const { SettingsMock } = await import('@devvit/settings/test');

    settingsMockInstance = new SettingsMock(DEFAULT_SETTINGS);
    return settingsMockInstance;
}

export async function getSettingsMock(): Promise<any> {
    return await initializeSettingsMock();
}

async function initializeNotificationsMock(): Promise<any> {
    if (notificationsMockInstance) return notificationsMockInstance;

    const { NotificationsMock } = await import('@devvit/notifications/test');

    notificationsMockInstance = new NotificationsMock();
    return notificationsMockInstance;
}

export async function getNotificationsMock(): Promise<any> {
    return await initializeNotificationsMock();
}

async function initializeMediaMock(): Promise<any> {
    if (mediaMockInstance) return mediaMockInstance;

    const { MediaMock } = await import('@devvit/media/test');

    mediaMockInstance = new MediaMock();
    return mediaMockInstance;
}

export async function getMediaMock(): Promise<any> {
    return await initializeMediaMock();
}

async function initializeRealtimeMock(): Promise<any> {
    if (realtimeMockInstance) return realtimeMockInstance;

    const { RealtimeMock } = await import('@devvit/realtime/server/test');

    realtimeMockInstance = new RealtimeMock();
    return realtimeMockInstance;
}

export async function getRealtimeMock(): Promise<any> {
    return await initializeRealtimeMock();
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
