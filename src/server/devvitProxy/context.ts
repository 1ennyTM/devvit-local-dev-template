/**
 * Context API proxy
 *
 * Exports either real Devvit context API or official mock (via @devvit/test) based on environment.
 * Services and middleware import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { context } from './devvitProxy';
 *   const postId = context.postId;
 */

type ContextClient = typeof import('@devvit/web/server')['context'];
import { IS_DEV } from './environment';
import {
    createContextAdapter,
    type ContextAdapter,
} from './adapters/redditAdapter';

let contextAdapter: ContextAdapter | null = null;
let cachedDevvit: typeof import('@devvit/web/server') | null = null;

function getContextMock_() {
    if (!contextAdapter) {
        contextAdapter = createContextAdapter();
    }
    return contextAdapter;
}

async function getDevvit() {
    if (!cachedDevvit && !IS_DEV) {
        cachedDevvit = await import('@devvit/web/server');
    }
    return cachedDevvit;
}

function getContextValue(key: 'postId' | 'subredditName' | 'subredditId' | 'userId') {
    if (IS_DEV) {
        return getContextMock_()[key];
    }
    if (cachedDevvit) {
        return (cachedDevvit.context as any)[key] || '';
    }
    return '';
}

export const context = {
    get postId() {
        return getContextValue('postId');
    },
    get subredditName() {
        return getContextValue('subredditName');
    },
    get subredditId() {
        return getContextValue('subredditId');
    },
    get userId() {
        return getContextValue('userId');
    },
} as unknown as ContextClient;

/**
 * Initialize context (preload devvit module in production)
 */
export async function initializeContext(): Promise<void> {
    if (!IS_DEV) {
        await getDevvit();
    }
}
