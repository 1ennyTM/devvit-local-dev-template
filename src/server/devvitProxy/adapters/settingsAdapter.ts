/**
 * Settings Adapter for Official Devvit Mocks
 *
 * Wraps the official SettingsMock from @devvit/settings/test to provide
 * a high-level interface matching @devvit/web/server settings API.
 *
 * Official API: https://developers.reddit.com/docs/api/redditapi/interfaces/SettingsClient
 */

import type { SettingsMock } from '@devvit/settings/test';

/** Allowed settings value types */
export type SettingsValue = string | string[] | boolean | number | undefined;

/** Settings values object */
export interface SettingsValues {
    [key: string]: SettingsValue;
}

/**
 * Extract value from protobuf FormFieldValue
 */
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

/**
 * Creates a Settings adapter that wraps the official SettingsMock
 * Matches the official @devvit/web/server settings API
 */
export function createSettingsAdapter(settingsMock: SettingsMock) {
    return {
        /**
         * Get a single setting value by name
         * @param name - The setting name
         * @returns The setting value or undefined
         */
        async get<T extends SettingsValue = SettingsValue>(name: string): Promise<T | undefined> {
            const allSettings = settingsMock.get() as { settings?: Record<string, unknown> };
            const formField = allSettings?.settings?.[name];
            return extractFormFieldValue(formField) as T | undefined;
        },

        /**
         * Get all settings as an object
         * @returns All settings values
         */
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

        /**
         * Set all settings (dev utility - replaces all)
         * @param settings - Object with setting name/value pairs
         */
        set(settings: SettingsValues): void {
            settingsMock.set(settings);
        },

        /**
         * Update settings (dev utility - merges with existing)
         * @param settings - Object with setting name/value pairs
         */
        update(settings: SettingsValues): void {
            settingsMock.update(settings);
        },

        /**
         * Set a single setting value (dev utility)
         * @param name - The setting name
         * @param value - The setting value
         */
        put(name: string, value: SettingsValue): void {
            settingsMock.put(name, value);
        },

        /**
         * Remove a setting (dev utility)
         * @param name - The setting name to remove
         */
        remove(name: string): void {
            settingsMock.remove(name);
        },
    };
}

export type SettingsAdapter = ReturnType<typeof createSettingsAdapter>;
