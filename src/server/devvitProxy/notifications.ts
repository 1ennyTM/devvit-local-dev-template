/**
 * Notifications proxy
 *
 * Exports either real Devvit notifications or official mock (via @devvit/test) based on environment.
 * Services import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { notifications } from '../utils/notifications';
 *   await notifications.enqueue({ title: 'Hello', body: 'World', recipients: [...] });
 */

type NotificationsClient = typeof import('@devvit/web/server')['notifications'];
import { IS_DEV } from './environment';
import { getNotificationsMock, DEV_CONFIG } from './devvitMocks';
import { createNotificationsAdapter, type NotificationsAdapter } from './adapters/notificationsAdapter';

let cachedNotifications: NotificationsAdapter | null = null;

function getNotificationsMock_(): NotificationsAdapter {
    if (!cachedNotifications && IS_DEV) {
        const notificationsMock = getNotificationsMock();
        cachedNotifications = createNotificationsAdapter(notificationsMock, DEV_CONFIG.userId);
    }
    return cachedNotifications!;
}

let cachedDevvit: typeof import('@devvit/web/server') | null = null;

async function getDevvit() {
    if (!cachedDevvit && !IS_DEV) {
        cachedDevvit = await import('@devvit/web/server');
    }
    return cachedDevvit;
}

export const notifications = {
    async enqueue(options: any) {
        if (IS_DEV) return getNotificationsMock_().enqueue(options);
        const devvit = await getDevvit();
        return devvit!.notifications.enqueue(options);
    },

    async optInCurrentUser() {
        if (IS_DEV) return getNotificationsMock_().optInCurrentUser();
        const devvit = await getDevvit();
        return devvit!.notifications.optInCurrentUser();
    },

    async optOutCurrentUser() {
        if (IS_DEV) return getNotificationsMock_().optOutCurrentUser();
        const devvit = await getDevvit();
        return devvit!.notifications.optOutCurrentUser();
    },

    async listOptedInUsers(options: any) {
        if (IS_DEV) return getNotificationsMock_().listOptedInUsers(options);
        const devvit = await getDevvit();
        return devvit!.notifications.listOptedInUsers(options);
    },

    async isOptedIn(userId: any) {
        if (IS_DEV) return getNotificationsMock_().isOptedIn(userId);
        const devvit = await getDevvit();
        return devvit!.notifications.isOptedIn(userId);
    },

    async *listOptedInUsersIterator(options?: any) {
        if (IS_DEV) {
            yield* getNotificationsMock_().listOptedInUsersIterator(options);
            return;
        }
        const devvit = await getDevvit();
        yield* devvit!.notifications.listOptedInUsersIterator(options);
    },

    async requestShowGamesDrawerBadge(options: any) {
        if (IS_DEV) return getNotificationsMock_().requestShowGamesDrawerBadge(options);
        const devvit = await getDevvit();
        return devvit!.notifications.requestShowGamesDrawerBadge(options);
    },

    async dismissGamesDrawerBadge() {
        if (IS_DEV) return getNotificationsMock_().dismissGamesDrawerBadge();
        const devvit = await getDevvit();
        return devvit!.notifications.dismissGamesDrawerBadge();
    },

    async getGamesDrawerBadgeStatus() {
        if (IS_DEV) return getNotificationsMock_().getGamesDrawerBadgeStatus();
        const devvit = await getDevvit();
        return devvit!.notifications.getGamesDrawerBadgeStatus();
    },
} as unknown as NotificationsClient;

export async function initializeNotifications(): Promise<void> {
    if (!IS_DEV) {
        await getDevvit();
    }
}
