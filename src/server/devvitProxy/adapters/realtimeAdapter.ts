/**
 * Realtime Adapter for Official Devvit Mocks
 *
 * Wraps the official RealtimeMock from @devvit/realtime/server/test to provide
 * a high-level interface matching @devvit/web/server realtime API.
 */

import type { RealtimeMock } from '@devvit/realtime/server/test';

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

export function createRealtimeAdapter(realtimeMock: RealtimeMock) {
    return {
        async send<Msg extends JsonValue>(channel: string, msg: Msg): Promise<void> {
            await realtimeMock.plugin.Send({
                channel,
                data: JSON.stringify(msg),
            } as any);
        },

        getSentMessages() {
            return realtimeMock.getSentMessages();
        },

        getSentMessagesForChannel(channel: string) {
            return realtimeMock.getSentMessagesForChannel(channel);
        },

        getReceivedMessages() {
            return realtimeMock.getReceivedMessages();
        },

        getReceivedMessagesForChannel(channel: string) {
            return realtimeMock.getReceivedMessagesForChannel(channel);
        },

        clearSentMessages(): void {
            realtimeMock.clearSentMessages();
        },

        clearSentMessagesForChannel(channel: string): void {
            realtimeMock.clearSentMessagesForChannel(channel);
        },

        clearReceivedMessages(): void {
            realtimeMock.clearReceivedMessages();
        },

        clearReceivedMessagesForChannel(channel: string): void {
            realtimeMock.clearReceivedMessagesForChannel(channel);
        },

        _clear(): void {
            realtimeMock.reset();
        },
    };
}

export type RealtimeAdapter = ReturnType<typeof createRealtimeAdapter>;
