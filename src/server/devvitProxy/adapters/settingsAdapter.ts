/** Wraps SettingsMock from @devvit/settings/test to match @devvit/web/server settings API. */

import type { SettingsMock } from '@devvit/settings/test';
import type { settings as devvitSettings } from '@devvit/web/server';

type Settings = typeof devvitSettings;

/** Allowed settings value types */
export type SettingsValue = string | string[] | boolean | number | undefined;

export interface SettingsValues {
    [key: string]: SettingsValue;
}

/** Extract value from protobuf FormFieldValue */
function extractFormFieldValue(formField: unknown): SettingsValue {
    if (!formField || typeof formField !== 'object') return undefined;
    const field = formField as Record<string, unknown>;
    if ('stringValue' in field) return field.stringValue as string;
    if ('boolValue' in field) return field.boolValue as boolean;
    if ('numberValue' in field) return field.numberValue as number;
    if ('selectionValue' in field) {
        const sel = field.selectionValue as { values?: string[] };
        return sel?.values ?? [];
    }
    return undefined;
}

export function createSettingsAdapter(settingsMock: SettingsMock): Settings {
    return {
        async get<T extends SettingsValue = SettingsValue>(name: string): Promise<T | undefined> {
            const allSettings = settingsMock.get() as { settings?: Record<string, unknown> };
            const formField = allSettings?.settings?.[name];
            return extractFormFieldValue(formField) as T | undefined;
        },

        async getAll<T extends SettingsValues = SettingsValues>(): Promise<T> {
            const allSettings = settingsMock.get() as { settings?: Record<string, unknown> };
            const result: SettingsValues = {};
            if (allSettings?.settings) {
                for (const [key, formField] of Object.entries(allSettings.settings)) {
                    result[key] = extractFormFieldValue(formField);
                }
            }
            return result as T;
        },

        set(settings: SettingsValues): void {
            settingsMock.set(settings);
        },

        update(settings: SettingsValues): void {
            settingsMock.update(settings);
        },

        put(name: string, value: SettingsValue): void {
            settingsMock.put(name, value);
        },

        remove(name: string): void {
            settingsMock.remove(name);
        },
    } as unknown as Settings;
}

export type SettingsAdapter = Settings;
