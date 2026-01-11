/** Settings proxy - exports real Devvit settings or official mock based on environment. */

import { settings as devvitSettings } from '@devvit/web/server';

type SettingsClient = typeof devvitSettings;
import { IS_DEV } from './environment';
import { getSettingsMock } from './devvitMocks';
import { createSettingsAdapter } from './adapters/settingsAdapter';

let cachedSettings: SettingsClient | null = null;

function getSettings(): SettingsClient {
    if (cachedSettings) return cachedSettings;

    if (IS_DEV) {
        const settingsMock = getSettingsMock();
        cachedSettings = createSettingsAdapter(settingsMock);
    } else {
        cachedSettings = devvitSettings;
    }

    return cachedSettings;
}

export const settings: SettingsClient = new Proxy({} as SettingsClient, {
    get(_target, prop) {
        return (getSettings() as any)[prop];
    },
});
