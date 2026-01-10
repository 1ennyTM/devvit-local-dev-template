/**
 * Official Devvit Mock Initialization
 *
 * Initializes official @devvit/test mocks for local development.
 * These are the same mocks used by Reddit's testing framework, providing
 * simulation of production Devvit behavior.
 *
 * Available mocks:
 * - Redis (with redis-memory-server)
 * - Reddit API (users, posts, comments, subreddits)
 * - Scheduler (job scheduling)
 * - Settings (app settings)
 * - Notifications (push notifications)
 * - Media (file uploads)
 * - Realtime (websocket messaging)
 */

import { RedisMock } from '@devvit/redis/test';
import { RedditPluginMock } from '@devvit/reddit/test';
import { SchedulerMock } from '@devvit/scheduler/test';
import { SettingsMock } from '@devvit/settings/test';
import { NotificationsMock } from '@devvit/notifications/test';
import { MediaMock } from '@devvit/media/test';
import { RealtimeMock } from '@devvit/realtime/server/test';
import { Redis } from 'ioredis';
import { RedisMemoryServer } from 'redis-memory-server';

/** Development configuration */
export const DEV_CONFIG = {
    /** Default username for development */
    username: 'u/dev-user123',
    /** Default user ID for development */
    userId: 't2_dev123' as const,
    /** Default subreddit name for development */
    subredditName: 'dev-subreddit',
    /** Default subreddit ID for development */
    subredditId: 't5_dev456' as const,
    /** Default post ID for development */
    postId: 't3_devpost123' as const,
} as const;

/** Default app settings for development */
const DEFAULT_SETTINGS: Record<string, string | number | boolean> = {};

/**
 * Singleton instances - initialized once and reused
 */
let redisServer: RedisMemoryServer | null = null;
let redisConnection: Redis | null = null;
let redisMockInstance: RedisMock | null = null;
let redditMockInstance: RedditPluginMock | null = null;
let schedulerMockInstance: SchedulerMock | null = null;
let settingsMockInstance: SettingsMock | null = null;
let notificationsMockInstance: NotificationsMock | null = null;
let mediaMockInstance: MediaMock | null = null;
let realtimeMockInstance: RealtimeMock | null = null;

// ============================================================================
// REDIS MOCK
// ============================================================================

/**
 * Initialize Redis memory server and mock
 */
async function initializeRedisMock(): Promise<RedisMock> {
    if (redisMockInstance) return redisMockInstance;

    // Start in-memory Redis server
    redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();

    // Connect to Redis
    redisConnection = new Redis({ host, port });

    // Create official Redis mock
    redisMockInstance = new RedisMock(redisConnection, 'dev-local');

    return redisMockInstance;
}

/**
 * Get or create Redis mock instance
 */
export async function getRedisMock(): Promise<RedisMock> {
    return await initializeRedisMock();
}

// ============================================================================
// REDDIT MOCK
// ============================================================================

/**
 * Initialize Reddit plugin mock with seed data
 */
function initializeRedditMock(): RedditPluginMock {
    if (redditMockInstance) return redditMockInstance;

    // Create official Reddit mock
    redditMockInstance = new RedditPluginMock();

    // Seed default user
    redditMockInstance.users.addUser({
        id: DEV_CONFIG.userId,
        name: DEV_CONFIG.username,
    });

    // Seed default subreddit
    redditMockInstance.subreddits.addSubreddit({
        id: DEV_CONFIG.subredditId,
        displayName: DEV_CONFIG.subredditName,
        title: DEV_CONFIG.subredditName,
    });

    return redditMockInstance;
}

/**
 * Get or create Reddit mock instance
 */
export function getRedditMock(): RedditPluginMock {
    return initializeRedditMock();
}

// ============================================================================
// SCHEDULER MOCK
// ============================================================================

/**
 * Initialize Scheduler mock
 */
function initializeSchedulerMock(): SchedulerMock {
    if (schedulerMockInstance) return schedulerMockInstance;

    schedulerMockInstance = new SchedulerMock();
    return schedulerMockInstance;
}

/**
 * Get or create Scheduler mock instance
 */
export function getSchedulerMock(): SchedulerMock {
    return initializeSchedulerMock();
}

// ============================================================================
// SETTINGS MOCK
// ============================================================================

/**
 * Initialize Settings mock with default values
 */
function initializeSettingsMock(): SettingsMock {
    if (settingsMockInstance) return settingsMockInstance;

    settingsMockInstance = new SettingsMock(DEFAULT_SETTINGS);
    return settingsMockInstance;
}

/**
 * Get or create Settings mock instance
 */
export function getSettingsMock(): SettingsMock {
    return initializeSettingsMock();
}

// ============================================================================
// NOTIFICATIONS MOCK
// ============================================================================

/**
 * Initialize Notifications mock
 */
function initializeNotificationsMock(): NotificationsMock {
    if (notificationsMockInstance) return notificationsMockInstance;

    notificationsMockInstance = new NotificationsMock();
    return notificationsMockInstance;
}

/**
 * Get or create Notifications mock instance
 */
export function getNotificationsMock(): NotificationsMock {
    return initializeNotificationsMock();
}

// ============================================================================
// MEDIA MOCK
// ============================================================================

/**
 * Initialize Media mock
 */
function initializeMediaMock(): MediaMock {
    if (mediaMockInstance) return mediaMockInstance;

    mediaMockInstance = new MediaMock();
    return mediaMockInstance;
}

/**
 * Get or create Media mock instance
 */
export function getMediaMock(): MediaMock {
    return initializeMediaMock();
}

// ============================================================================
// REALTIME MOCK
// ============================================================================

/**
 * Initialize Realtime mock
 */
function initializeRealtimeMock(): RealtimeMock {
    if (realtimeMockInstance) return realtimeMockInstance;

    realtimeMockInstance = new RealtimeMock();
    return realtimeMockInstance;
}

/**
 * Get or create Realtime mock instance
 */
export function getRealtimeMock(): RealtimeMock {
    return initializeRealtimeMock();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get development context values
 */
export function getDevContext() {
    return DEV_CONFIG;
}

/**
 * Initialize all mocks at once (call during server startup)
 */
export async function initializeAllMocks(): Promise<void> {
    await getRedisMock();
    getRedditMock();
    getSchedulerMock();
    getSettingsMock();
    getNotificationsMock();
    getMediaMock();
    getRealtimeMock();
}

/**
 * Cleanup function for graceful shutdown
 */
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
