/**
 * Settings Database Service
 *
 * Handles application settings persistence in Supabase.
 * Provides a key-value store for configuration options.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AppSetting, AppSettingInsert, Json } from '@/types/supabase';
import { logger } from '@/utils/logger';

// Known settings keys
export type SettingKey =
  | 'sync_interval'
  | 'auto_sync_enabled'
  | 'notification_enabled'
  | 'notification_check_in_hours_before'
  | 'notification_payment_reminder_days'
  | 'whatsapp_api_configured'
  | 'default_date_range_days';

// Settings with their default values
const DEFAULT_SETTINGS: Record<SettingKey, Json> = {
  sync_interval: 300000, // 5 minutes
  auto_sync_enabled: false,
  notification_enabled: false,
  notification_check_in_hours_before: 24,
  notification_payment_reminder_days: 3,
  whatsapp_api_configured: false,
  default_date_range_days: 30,
};

/**
 * Settings Database Service
 */
export const settingsDb = {
  /**
   * Get a setting value
   * @param key - The setting key
   * @param defaultValue - Default value if setting not found
   */
  async get<T = Json>(key: SettingKey, defaultValue?: T): Promise<T> {
    const fallbackValue = defaultValue ?? (DEFAULT_SETTINGS[key] as T);

    // First check localStorage
    const localValue = localStorage.getItem(`setting_${key}`);
    if (localValue !== null) {
      try {
        return JSON.parse(localValue) as T;
      } catch {
        return localValue as T;
      }
    }

    if (!isSupabaseConfigured()) {
      return fallbackValue;
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error(`[SettingsDB] Error fetching setting ${key}:`, error);
        return fallbackValue;
      }

      if (data) {
        // Cache in localStorage
        localStorage.setItem(`setting_${key}`, JSON.stringify(data.value));
        return data.value as T;
      }

      return fallbackValue;
    } catch (error) {
      logger.error(`[SettingsDB] Failed to get setting ${key}:`, error);
      return fallbackValue;
    }
  },

  /**
   * Set a setting value
   * @param key - The setting key
   * @param value - The value to store
   * @param description - Optional description
   */
  async set(key: SettingKey, value: Json, description?: string): Promise<boolean> {
    // Always save to localStorage
    localStorage.setItem(`setting_${key}`, JSON.stringify(value));

    if (!isSupabaseConfigured()) {
      return true;
    }

    const setting: AppSettingInsert = {
      key,
      value,
      description: description || null,
    };

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(setting, {
          onConflict: 'key',
        });

      if (error) {
        logger.error(`[SettingsDB] Error setting ${key}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`[SettingsDB] Failed to set setting ${key}:`, error);
      return false;
    }
  },

  /**
   * Get all settings
   */
  async getAll(): Promise<Record<string, Json>> {
    const settings: Record<string, Json> = { ...DEFAULT_SETTINGS };

    // Load from localStorage first
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      const localValue = localStorage.getItem(`setting_${key}`);
      if (localValue !== null) {
        try {
          settings[key] = JSON.parse(localValue);
        } catch {
          settings[key] = localValue;
        }
      }
    }

    if (!isSupabaseConfigured()) {
      return settings;
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (error) {
        logger.error('[SettingsDB] Error fetching all settings:', error);
        return settings;
      }

      if (data) {
        for (const setting of data) {
          settings[setting.key] = setting.value;
          // Cache in localStorage
          localStorage.setItem(`setting_${setting.key}`, JSON.stringify(setting.value));
        }
      }

      return settings;
    } catch (error) {
      logger.error('[SettingsDB] Failed to get all settings:', error);
      return settings;
    }
  },

  /**
   * Delete a setting
   * @param key - The setting key
   */
  async delete(key: SettingKey): Promise<boolean> {
    localStorage.removeItem(`setting_${key}`);

    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('key', key);

      if (error) {
        logger.error(`[SettingsDB] Error deleting setting ${key}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`[SettingsDB] Failed to delete setting ${key}:`, error);
      return false;
    }
  },

  /**
   * Reset a setting to its default value
   * @param key - The setting key
   */
  async reset(key: SettingKey): Promise<boolean> {
    const defaultValue = DEFAULT_SETTINGS[key];
    return this.set(key, defaultValue);
  },

  /**
   * Reset all settings to default values
   */
  async resetAll(): Promise<boolean> {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await this.set(key as SettingKey, value);
    }
    return true;
  },

  /**
   * Migrate settings from localStorage to Supabase
   */
  async migrateFromLocalStorage(): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    let migrated = 0;

    // Known localStorage keys to migrate
    const keysToMigrate: Array<{ localStorage: string; setting: SettingKey }> = [
      { localStorage: 'sync_interval', setting: 'sync_interval' },
      { localStorage: 'auto_sync_enabled', setting: 'auto_sync_enabled' },
    ];

    for (const { localStorage: localKey, setting } of keysToMigrate) {
      const localValue = localStorage.getItem(localKey);
      if (localValue !== null) {
        try {
          const value = localKey === 'auto_sync_enabled'
            ? localValue === 'true'
            : JSON.parse(localValue);

          await this.set(setting, value);
          migrated++;
        } catch (error) {
          logger.warn(`[SettingsDB] Failed to migrate setting ${localKey}:`, error);
        }
      }
    }

    logger.info(`[SettingsDB] Migrated ${migrated} settings from localStorage`);
    return migrated;
  },
};

export default settingsDb;
