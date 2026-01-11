/** Settings proxy - exports real Devvit settings or official mock based on environment. */

import { settings as devvitSettings } from '@devvit/web/server';

type SettingsClient = typeof devvitSettings;
import { IS_DEV } from './environment';

let cachedSettings: SettingsClient | null = null;

async function getSettings(): Promise<SettingsClient> {
    if (cachedSettings) return cachedSettings;

    if (IS_DEV) {
        // Dynamic import to avoid bundling dev dependencies in production
        const { getSettingsMock } = await import('./devvitMocks');
        const { createSettingsAdapter } = await import('./adapters/settingsAdapter');
        const settingsMock = getSettingsMock();
        cachedSettings = createSettingsAdapter(settingsMock);
    } else {
        cachedSettings = devvitSettings;
    }

    return cachedSettings;
}

export const settings: SettingsClient = new Proxy({} as SettingsClient, {
    get(_target, prop) {
        return getSettings().then((s) => (s as any)[prop]);
    },
});
