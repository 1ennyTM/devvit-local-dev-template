/** Wraps SchedulerMock from @devvit/scheduler/test to match @devvit/web/server scheduler API. */

import type { SchedulerMock } from '@devvit/scheduler/test';
import type { scheduler as devvitScheduler } from '@devvit/web/server';

type Scheduler = typeof devvitScheduler;

export interface ScheduledJobOptions {
    name: string;
    data?: Record<string, unknown>;
    runAt: Date;
}

export interface ScheduledCronJobOptions {
    name: string;
    data?: Record<string, unknown>;
    cron: string;
}

export interface ScheduledJob {
    id: string;
    name: string;
    data?: Record<string, unknown>;
    runAt: Date;
}

export interface ScheduledCronJob {
    id: string;
    name: string;
    data?: Record<string, unknown>;
    cron: string;
}

export function createSchedulerAdapter(schedulerMock: SchedulerMock): Scheduler {
    return {
        async runJob(job: ScheduledJobOptions | ScheduledCronJobOptions): Promise<string> {
            const isCron = 'cron' in job;

            const result = await schedulerMock.plugin.Schedule({
                action: {
                    type: job.name,
                    data: job.data ? JSON.stringify(job.data) : undefined,
                },
                ...(isCron
                    ? { cron: (job as ScheduledCronJobOptions).cron }
                    : { when: (job as ScheduledJobOptions).runAt }),
            } as any);

            return result.id ?? `job-${Date.now()}`;
        },

        async cancelJob(jobId: string): Promise<void> {
            await schedulerMock.plugin.Cancel({ id: jobId });
        },

        async listJobs(): Promise<(ScheduledJob | ScheduledCronJob)[]> {
            const actions = schedulerMock.getScheduledActions();
            return actions.map((action) => {
                const actionData = action.request.action;
                const rawData = actionData?.data;
                const base = {
                    id: action.id,
                    name: actionData?.type ?? 'unknown',
                    data: rawData
                        ? typeof rawData === 'string'
                            ? JSON.parse(rawData)
                            : rawData
                        : undefined,
                };

                if (action.request.cron) {
                    return { ...base, cron: action.request.cron } as ScheduledCronJob;
                } else {
                    return {
                        ...base,
                        runAt: action.request.when ?? new Date(),
                    } as ScheduledJob;
                }
            });
        },
    } as Scheduler;
}

export type SchedulerAdapter = Scheduler;
