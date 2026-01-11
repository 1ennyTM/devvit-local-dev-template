/** Notifications proxy - exports real Devvit notifications or official mock based on environment. */

import { notifications as devvitNotifications } from '@devvit/web/server';

type NotificationsClient = typeof devvitNotifications;
import { IS_DEV } from './environment';

let cachedNotifications: NotificationsClient | null = null;

async function getNotifications(): Promise<NotificationsClient> {
    if (cachedNotifications) return cachedNotifications;

    if (IS_DEV) {
        // Dynamic import to avoid bundling dev dependencies in production
        const { getNotificationsMock, DEV_CONFIG } = await import('./devvitMocks');
        const { createNotificationsAdapter } = await import('./adapters/notificationsAdapter');
        const notificationsMock = getNotificationsMock();
        cachedNotifications = createNotificationsAdapter(notificationsMock, DEV_CONFIG.userId);
    } else {
        cachedNotifications = devvitNotifications;
    }

    return cachedNotifications;
}

export const notifications: NotificationsClient = new Proxy({} as NotificationsClient, {
    get(_target, prop) {
        return getNotifications().then((n) => (n as any)[prop]);
    },
});
