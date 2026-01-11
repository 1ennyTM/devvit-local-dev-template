/** Context API proxy - exports real Devvit context API or official mock based on environment. */

import { context as devvitContext } from '@devvit/web/server';

type ContextClient = typeof devvitContext;

import { IS_DEV } from './environment';
import { createContextAdapter } from './adapters/redditAdapter';

let cachedContext: ContextClient | null = null;

function getContext(): ContextClient {
    if (cachedContext) return cachedContext;

    if (IS_DEV) {
        const contextMock = createContextAdapter();
        cachedContext = contextMock as unknown as ContextClient;
    } else {
        cachedContext = devvitContext;
    }

    return cachedContext;
}

export const context: ContextClient = new Proxy({} as ContextClient, {
    get(_target, prop) {
        return (getContext() as any)[prop];
    },
});
