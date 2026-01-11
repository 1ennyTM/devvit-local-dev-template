/** Wraps RealtimeMock from @devvit/realtime/server/test to match @devvit/web/server realtime API. */

import type { RealtimeMock } from '@devvit/realtime/server/test';
import type { realtime as devvitRealtime } from '@devvit/web/server';

type Realtime = typeof devvitRealtime;

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

export function createRealtimeAdapter(realtimeMock: RealtimeMock): Realtime {
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
    } as unknown as Realtime;
}

export type RealtimeAdapter = Realtime;
