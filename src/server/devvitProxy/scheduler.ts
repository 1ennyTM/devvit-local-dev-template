/** Scheduler proxy - exports real Devvit scheduler or official mock based on environment. */

import { scheduler as devvitScheduler } from '@devvit/web/server';

type SchedulerClient = typeof devvitScheduler;
import { IS_DEV } from './environment';

let cachedScheduler: SchedulerClient | null = null;

if (!IS_DEV) {
    cachedScheduler = devvitScheduler;
}

async function getScheduler(): Promise<SchedulerClient> {
    if (cachedScheduler) return cachedScheduler;

    if (IS_DEV) {
        const { getSchedulerMock } = await import('./devvitMocks');
        const { createSchedulerAdapter } = await import('./adapters/schedulerAdapter');
        const schedulerMock = getSchedulerMock();
        cachedScheduler = createSchedulerAdapter(schedulerMock) as SchedulerClient;
    }

    return cachedScheduler!;
}

export const scheduler: SchedulerClient = new Proxy({} as SchedulerClient, {
    get(_target, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => {
            if (cachedScheduler) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (cachedScheduler as any)[prop](...args);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return getScheduler().then((s) => (s as any)[prop](...args));
        };
    },
});
