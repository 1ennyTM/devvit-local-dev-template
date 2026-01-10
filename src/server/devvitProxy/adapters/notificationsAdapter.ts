/**
 * Notifications Adapter for Official Devvit Mocks
 *
 * Wraps the official NotificationsMock from @devvit/notifications/test to provide
 * a high-level interface matching @devvit/web/server notifications API.
 */

import type { NotificationsMock } from '@devvit/notifications/test';
import { Header } from '@devvit/shared-types/Header.js';

export type T2 = `t2_${string}`;
export type T1 = `t1_${string}`;
export type T3 = `t3_${string}`;

export interface NotificationRecipient {
    userId: T2;
    link: T1 | T3;
    data: Record<string, string>;
}

export interface EnqueueOptions {
    title: string;
    body: string;
    recipients: NotificationRecipient[];
}

export interface EnqueueResponse {
    successCount: number;
    failureCount: number;
    errors: Array<{
        userId: T2 | undefined;
        message: string;
    }>;
}

export interface ListOptedInUsersOptions {
    limit?: number;
    after?: string;
}

export interface ListOptedInUsersResponse {
    userIds: string[];
    next: string | undefined;
}

export interface OptResponse {
    success: boolean;
    message?: string;
}

export interface ShowGamesDrawerBadgeRequest {
    post: T3;
    expiresAt?: Date;
}

function createUserMetadata(userId: T2): Record<string, { values: string[] }> {
    return {
        [Header.User]: { values: [userId] },
    };
}

export function createNotificationsAdapter(notificationsMock: NotificationsMock, userId: T2) {
    const metadata = createUserMetadata(userId);

    return {
        async enqueue(options: EnqueueOptions): Promise<EnqueueResponse> {
            let successCount = 0;
            let failureCount = 0;
            const errors: EnqueueResponse['errors'] = [];

            for (const recipient of options.recipients) {
                try {
                    await notificationsMock.plugin.Enqueue({
                        title: options.title,
                        body: options.body,
                        userId: recipient.userId,
                        link: recipient.link,
                        data: recipient.data,
                    } as any);
                    successCount++;
                } catch (error) {
                    failureCount++;
                    errors.push({
                        userId: recipient.userId,
                        message: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }

            return { successCount, failureCount, errors };
        },

        async optInCurrentUser(): Promise<OptResponse> {
            try {
                await notificationsMock.plugin.OptInCurrentUser({} as any, metadata as any);
                return { success: true };
            } catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },

        async optOutCurrentUser(): Promise<OptResponse> {
            try {
                await notificationsMock.plugin.OptOutCurrentUser({} as any, metadata as any);
                return { success: true };
            } catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },

        async listOptedInUsers(options: ListOptedInUsersOptions = {}): Promise<ListOptedInUsersResponse> {
            const optedInUsers = notificationsMock.getOptedInUsers();
            const limit = options.limit ?? 1000;
            const startIndex = options.after ? parseInt(options.after, 10) : 0;

            const userIds: string[] = optedInUsers.slice(startIndex, startIndex + limit);
            const hasMore = startIndex + limit < optedInUsers.length;

            return {
                userIds,
                next: hasMore ? String(startIndex + limit) : undefined,
            };
        },

        async isOptedIn(userId: T2): Promise<boolean> {
            const optedInUsers = notificationsMock.getOptedInUsers();
            return optedInUsers.includes(userId);
        },

        async *listOptedInUsersIterator(
            options: { after?: string } = {}
        ): AsyncIterableIterator<string> {
            const optedInUsers = notificationsMock.getOptedInUsers();
            const startIndex = options.after ? parseInt(options.after, 10) : 0;

            for (let i = startIndex; i < optedInUsers.length; i++) {
                yield optedInUsers[i] as string;
            }
        },

        async requestShowGamesDrawerBadge(
            options: ShowGamesDrawerBadgeRequest
        ): Promise<{ success: boolean; message?: string }> {
            try {
                await notificationsMock.plugin.ShowGamesDrawerBadge({
                    post: options.post,
                    expiresAt: options.expiresAt?.toISOString(),
                } as any);
                return { success: true };
            } catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        },

        async dismissGamesDrawerBadge(): Promise<{ success: boolean }> {
            try {
                await notificationsMock.plugin.DismissGamesDrawerBadge({} as any);
                return { success: true };
            } catch {
                return { success: false };
            }
        },

        async getGamesDrawerBadgeStatus(): Promise<{ hasActiveBadge: boolean; expiresAt?: Date }> {
            const badge = notificationsMock.getActiveBadge();
            if (badge && badge.expiresAt) {
                return {
                    hasActiveBadge: true,
                    expiresAt: badge.expiresAt,
                };
            }
            if (badge) {
                return { hasActiveBadge: true };
            }
            return { hasActiveBadge: false };
        },

        getSentNotifications() {
            return notificationsMock.getSentNotifications();
        },

        _clear(): void {
            notificationsMock.reset();
        },
    };
}

export type NotificationsAdapter = ReturnType<typeof createNotificationsAdapter>;
