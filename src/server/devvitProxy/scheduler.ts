/**
 * Scheduler proxy
 *
 * Exports either real Devvit scheduler or official mock (via @devvit/test) based on environment.
 * Services import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { scheduler } from '../utils/scheduler';
 *   await scheduler.runJob({ name: 'myJob', runAt: new Date() });
 */

type SchedulerClient = typeof import('@devvit/web/server')['scheduler'];
import { IS_DEV } from './environment';
import { getSchedulerMock } from './devvitMocks';
import { createSchedulerAdapter, type SchedulerAdapter } from './adapters/schedulerAdapter';

let cachedScheduler: SchedulerAdapter | null = null;

function getSchedulerMock_(): SchedulerAdapter {
    if (!cachedScheduler && IS_DEV) {
        const schedulerMock = getSchedulerMock();
        cachedScheduler = createSchedulerAdapter(schedulerMock);
    }
    return cachedScheduler!;
}

let cachedDevvit: typeof import('@devvit/web/server') | null = null;

async function getDevvit() {
    if (!cachedDevvit && !IS_DEV) {
        cachedDevvit = await import('@devvit/web/server');
    }
    return cachedDevvit;
}

export const scheduler = {
    async runJob(job: any) {
        if (IS_DEV) return getSchedulerMock_().runJob(job);
        const devvit = await getDevvit();
        return devvit!.scheduler.runJob(job);
    },

    async cancelJob(jobId: string) {
        if (IS_DEV) return getSchedulerMock_().cancelJob(jobId);
        const devvit = await getDevvit();
        return devvit!.scheduler.cancelJob(jobId);
    },

    async listJobs() {
        if (IS_DEV) return getSchedulerMock_().listJobs();
        const devvit = await getDevvit();
        return devvit!.scheduler.listJobs();
    },
} as unknown as SchedulerClient;

export async function initializeScheduler(): Promise<void> {
    if (!IS_DEV) {
        await getDevvit();
    }
}
