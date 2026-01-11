/** Scheduler proxy - exports real Devvit scheduler or official mock based on environment. */

import { scheduler as devvitScheduler } from '@devvit/web/server';

type SchedulerClient = typeof devvitScheduler;
import { IS_DEV } from './environment';

let cachedScheduler: SchedulerClient | null = null;

async function getScheduler(): Promise<SchedulerClient> {
    if (cachedScheduler) return cachedScheduler;

    if (IS_DEV) {
        // Dynamic import to avoid bundling dev dependencies in production
        const { getSchedulerMock } = await import('./devvitMocks');
        const { createSchedulerAdapter } = await import('./adapters/schedulerAdapter');
        const schedulerMock = getSchedulerMock();
        cachedScheduler = createSchedulerAdapter(schedulerMock) as SchedulerClient;
    } else {
        cachedScheduler = devvitScheduler;
    }

    return cachedScheduler;
}

export const scheduler: SchedulerClient = new Proxy({} as SchedulerClient, {
    get(_target, prop) {
        return getScheduler().then((s) => (s as any)[prop]);
    },
});
