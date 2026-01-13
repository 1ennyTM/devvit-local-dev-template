/** Notifications proxy - exports real Devvit notifications or official mock based on environment. */

import { notifications as devvitNotifications } from '@devvit/web/server';

type NotificationsClient = typeof devvitNotifications;
import { IS_DEV } from './environment';

let cachedNotifications: NotificationsClient | null = null;

if (!IS_DEV) {
    cachedNotifications = devvitNotifications;
}

async function getNotifications(): Promise<NotificationsClient> {
    if (cachedNotifications) return cachedNotifications;

    if (IS_DEV) {
        const { getNotificationsMock, DEV_CONFIG } = await import('./devvitMocks');
        const { createNotificationsAdapter } = await import('./adapters/notificationsAdapter');
        const notificationsMock = await getNotificationsMock();
        cachedNotifications = createNotificationsAdapter(notificationsMock, DEV_CONFIG.userId);
    }

    return cachedNotifications!;
}

export const notifications: NotificationsClient = new Proxy({} as NotificationsClient, {
    get(_target, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => {
            if (cachedNotifications) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (cachedNotifications as any)[prop](...args);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return getNotifications().then((n) => (n as any)[prop](...args));
        };
    },
});
