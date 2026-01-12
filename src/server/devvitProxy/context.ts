/** Context API proxy - exports real Devvit context API or official mock based on environment. */

import { context as devvitContext } from '@devvit/web/server';

type ContextClient = typeof devvitContext;

import { IS_DEV } from './environment';

let cachedContext: ContextClient | null = null;

if (!IS_DEV) {
    cachedContext = devvitContext;
}

async function getContext(): Promise<ContextClient> {
    if (cachedContext) return cachedContext;

    if (IS_DEV) {
        const { createContextAdapter } = await import('./adapters/redditAdapter');
        const contextMock = createContextAdapter();
        cachedContext = contextMock as unknown as ContextClient;
    }

    return cachedContext!;
}

/**
 * Pre-initialize context for dev mode.
 * Must be called at server startup before handling requests.
 */
export async function initializeContext(): Promise<void> {
    await getContext();
}

export const context: ContextClient = new Proxy({} as ContextClient, {
    get(_target, prop) {
        if (cachedContext) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (cachedContext as any)[prop];
        }
        // In dev mode before initialization, this returns a Promise
        // Server startup should call initializeContext() to prevent this
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return getContext().then((c) => (c as any)[prop]);
    },
});
