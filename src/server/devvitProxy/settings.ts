/**
 * Settings proxy
 *
 * Exports either real Devvit settings or official mock (via @devvit/test) based on environment.
 * Services import from here instead of @devvit/web/server directly.
 *
 * Usage:
 *   import { settings } from '../utils/settings';
 *   const value = await settings.get('mySetting');
 */

type SettingsClient = typeof import('@devvit/web/server')['settings'];
import { IS_DEV } from './environment';
import { getSettingsMock } from './devvitMocks';
import { createSettingsAdapter, type SettingsAdapter } from './adapters/settingsAdapter';

let cachedSettings: SettingsAdapter | null = null;

function getSettingsMock_(): SettingsAdapter {
    if (!cachedSettings && IS_DEV) {
        const settingsMock = getSettingsMock();
        cachedSettings = createSettingsAdapter(settingsMock);
    }
    return cachedSettings!;
}

let cachedDevvit: typeof import('@devvit/web/server') | null = null;

async function getDevvit() {
    if (!cachedDevvit && !IS_DEV) {
        cachedDevvit = await import('@devvit/web/server');
    }
    return cachedDevvit;
}

export const settings = {
    async get(name: string) {
        if (IS_DEV) return getSettingsMock_().get(name);
        const devvit = await getDevvit();
        return devvit!.settings.get(name);
    },

    async getAll() {
        if (IS_DEV) return getSettingsMock_().getAll();
        const devvit = await getDevvit();
        return devvit!.settings.getAll();
    },
} as unknown as SettingsClient;

export async function initializeSettings(): Promise<void> {
    if (!IS_DEV) {
        await getDevvit();
    }
}
