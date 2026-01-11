/** Scheduler proxy - exports real Devvit scheduler or official mock based on environment. */

import { scheduler as devvitScheduler } from '@devvit/web/server';

type SchedulerClient = typeof devvitScheduler;
import { IS_DEV } from './environment';
import { getSchedulerMock } from './devvitMocks';
import { createSchedulerAdapter } from './adapters/schedulerAdapter';

let cachedScheduler: SchedulerClient | null = null;

function getScheduler(): SchedulerClient {
    if (cachedScheduler) return cachedScheduler;

    if (IS_DEV) {
        const schedulerMock = getSchedulerMock();
        cachedScheduler = createSchedulerAdapter(schedulerMock) as SchedulerClient;
    } else {
        cachedScheduler = devvitScheduler;
    }

    return cachedScheduler;
}

export const scheduler: SchedulerClient = new Proxy({} as SchedulerClient, {
    get(_target, prop) {
        return (getScheduler() as any)[prop];
    },
});
