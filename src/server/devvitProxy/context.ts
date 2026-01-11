/** Context API proxy - exports real Devvit context API or official mock based on environment. */

import { context as devvitContext } from '@devvit/web/server';

type ContextClient = typeof devvitContext;

import { IS_DEV } from './environment';

let cachedContext: ContextClient | null = null;

async function getContext(): Promise<ContextClient> {
    if (cachedContext) return cachedContext;

    if (IS_DEV) {
        // Dynamic import to avoid bundling dev dependencies in production
        const { createContextAdapter } = await import('./adapters/redditAdapter');
        const contextMock = createContextAdapter();
        cachedContext = contextMock as unknown as ContextClient;
    } else {
        cachedContext = devvitContext;
    }

    return cachedContext;
}

export const context: ContextClient = new Proxy({} as ContextClient, {
    get(_target, prop) {
        return getContext().then((c) => (c as any)[prop]);
    },
});
