/** Notifications proxy - exports real Devvit notifications or official mock based on environment. */

import { notifications as devvitNotifications } from '@devvit/web/server';

type NotificationsClient = typeof devvitNotifications;
import { IS_DEV } from './environment';
import { getNotificationsMock, DEV_CONFIG } from './devvitMocks';
import { createNotificationsAdapter } from './adapters/notificationsAdapter';

let cachedNotifications: NotificationsClient | null = null;

function getNotifications(): NotificationsClient {
    if (cachedNotifications) return cachedNotifications;

    if (IS_DEV) {
        const notificationsMock = getNotificationsMock();
        cachedNotifications = createNotificationsAdapter(notificationsMock, DEV_CONFIG.userId);
    } else {
        cachedNotifications = devvitNotifications;
    }

    return cachedNotifications;
}

export const notifications: NotificationsClient = new Proxy({} as NotificationsClient, {
    get(_target, prop) {
        return (getNotifications() as any)[prop];
    },
});
