/** Settings proxy - exports real Devvit settings or official mock based on environment. */

import { settings as devvitSettings } from '@devvit/web/server';

type SettingsClient = typeof devvitSettings;
import { IS_DEV } from './environment';

let cachedSettings: SettingsClient | null = null;

if (!IS_DEV) {
    cachedSettings = devvitSettings;
}

async function getSettings(): Promise<SettingsClient> {
    if (cachedSettings) return cachedSettings;

    if (IS_DEV) {
        const { getSettingsMock } = await import('./devvitMocks');
        const { createSettingsAdapter } = await import('./adapters/settingsAdapter');
        const settingsMock = getSettingsMock();
        cachedSettings = createSettingsAdapter(settingsMock);
    }

    return cachedSettings!;
}

export const settings: SettingsClient = new Proxy({} as SettingsClient, {
    get(_target, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => {
            if (cachedSettings) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (cachedSettings as any)[prop](...args);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return getSettings().then((s) => (s as any)[prop](...args));
        };
    },
});
