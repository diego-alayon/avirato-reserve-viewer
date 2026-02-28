/**
 * Sync Logs Database Service
 *
 * Handles persistence of synchronization logs in Supabase.
 * Replaces the localStorage-based logging system.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { SyncLog, SyncLogInsert } from '@/types/supabase';
import type { SyncLogEntry, SyncOperationResult } from '@/types/sync.types';
import { logger } from '@/utils/logger';

/**
 * Sync Logs Database Service
 */
export const syncDb = {
  /**
   * Get sync logs with filtering
   * @param options - Filter options
   */
  async getLogs(options?: {
    operation?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'failed';
    level?: 'debug' | 'info' | 'warn' | 'error';
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<SyncLog[]> {
    if (!isSupabaseConfigured()) {
      logger.warn('[SyncDB] Supabase not configured, falling back to localStorage');
      return this.getLogsFromLocalStorage();
    }

    try {
      let query = supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.operation) {
        query = query.eq('operation', options.operation);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.level) {
        query = query.eq('level', options.level);
      }

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[SyncDB] Error fetching sync logs:', error);
        // Fallback to localStorage
        return this.getLogsFromLocalStorage();
      }

      return data || [];
    } catch (error) {
      logger.error('[SyncDB] Failed to get sync logs:', error);
      return this.getLogsFromLocalStorage();
    }
  },

  /**
   * Create a new sync log entry
   * @param log - The log entry data
   */
  async createLog(log: SyncLogInsert): Promise<SyncLog | null> {
    // Always save to localStorage as backup
    this.saveLogToLocalStorage(log);

    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .insert(log)
        .select()
        .single();

      if (error) {
        logger.error('[SyncDB] Error creating sync log:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('[SyncDB] Failed to create sync log:', error);
      return null;
    }
  },

  /**
   * Log a sync operation result
   * @param result - The sync operation result
   * @param message - Optional custom message
   */
  async logSyncResult(result: SyncOperationResult, message?: string): Promise<SyncLog | null> {
    const logEntry: SyncLogInsert = {
      id: result.id,
      operation: result.operation,
      status: result.status,
      level: result.status === 'failed' ? 'error' : 'info',
      message: message || `${result.operation}: ${result.itemsSucceeded}/${result.itemsProcessed} items succeeded`,
      items_processed: result.itemsProcessed,
      items_succeeded: result.itemsSucceeded,
      items_failed: result.itemsFailed,
      duration_ms: result.duration || null,
      error_details: result.errors.length > 0 ? result.errors : null,
      metadata: {
        startTime: result.startTime,
        endTime: result.endTime,
      },
    };

    return this.createLog(logEntry);
  },

  /**
   * Update an existing sync log
   * @param id - The log entry ID
   * @param update - The update data
   */
  async updateLog(
    id: string,
    update: Partial<SyncLogInsert>
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('sync_logs')
        .update(update)
        .eq('id', id);

      if (error) {
        logger.error('[SyncDB] Error updating sync log:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[SyncDB] Failed to update sync log:', error);
      return false;
    }
  },

  /**
   * Get the last sync time
   * @param operation - Optional operation type to filter by
   */
  async getLastSyncTime(operation?: string): Promise<Date | null> {
    if (!isSupabaseConfigured()) {
      const savedTime = localStorage.getItem('last_sync_time');
      return savedTime ? new Date(savedTime) : null;
    }

    try {
      let query = supabase
        .from('sync_logs')
        .select('created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (operation) {
        query = query.eq('operation', operation);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[SyncDB] Error fetching last sync time:', error);
        return null;
      }

      if (data && data.length > 0) {
        return new Date(data[0].created_at);
      }

      return null;
    } catch (error) {
      logger.error('[SyncDB] Failed to get last sync time:', error);
      return null;
    }
  },

  /**
   * Clear old sync logs
   * @param olderThan - Delete logs older than this date
   */
  async clearOldLogs(olderThan: Date): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .delete()
        .lt('created_at', olderThan.toISOString())
        .select('id');

      if (error) {
        logger.error('[SyncDB] Error clearing old logs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error('[SyncDB] Failed to clear old logs:', error);
      return 0;
    }
  },

  /**
   * Clear all sync logs
   */
  async clearAllLogs(): Promise<boolean> {
    // Clear localStorage
    localStorage.removeItem('sync_logs');

    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('sync_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        logger.error('[SyncDB] Error clearing all logs:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[SyncDB] Failed to clear all logs:', error);
      return false;
    }
  },

  /**
   * Get sync statistics
   */
  async getStats(): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalItemsSynced: number;
    lastSyncTime: Date | null;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        totalItemsSynced: 0,
        lastSyncTime: null,
      };
    }

    try {
      const [total, successful, failed, lastSync] = await Promise.all([
        supabase.from('sync_logs').select('*', { count: 'exact', head: true }),
        supabase.from('sync_logs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('sync_logs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
        this.getLastSyncTime(),
      ]);

      // Get total items synced
      const { data: itemsData } = await supabase
        .from('sync_logs')
        .select('items_succeeded')
        .eq('status', 'completed');

      const totalItemsSynced = itemsData?.reduce((sum, log) => sum + (log.items_succeeded || 0), 0) || 0;

      return {
        totalSyncs: total.count || 0,
        successfulSyncs: successful.count || 0,
        failedSyncs: failed.count || 0,
        totalItemsSynced,
        lastSyncTime: lastSync,
      };
    } catch (error) {
      logger.error('[SyncDB] Failed to get stats:', error);
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        totalItemsSynced: 0,
        lastSyncTime: null,
      };
    }
  },

  // ============================================================================
  // LOCALSTORAGE FALLBACK METHODS
  // ============================================================================

  /**
   * Get logs from localStorage (fallback)
   */
  getLogsFromLocalStorage(): SyncLog[] {
    try {
      const logsJson = localStorage.getItem('sync_logs');
      if (!logsJson) return [];

      const logs: SyncLogEntry[] = JSON.parse(logsJson);

      // Convert SyncLogEntry to SyncLog format
      return logs.map((log) => ({
        id: log.id,
        operation: log.operation,
        status: log.data?.status || 'completed',
        level: log.level,
        message: log.message,
        items_processed: log.data?.itemsProcessed || 0,
        items_succeeded: log.data?.itemsSucceeded || 0,
        items_failed: log.data?.itemsFailed || 0,
        duration_ms: log.duration || null,
        error_details: log.error ? { message: log.error.message } : null,
        metadata: log.data || null,
        created_at: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
      })) as SyncLog[];
    } catch (error) {
      logger.error('[SyncDB] Error reading logs from localStorage:', error);
      return [];
    }
  },

  /**
   * Save log to localStorage (backup)
   */
  saveLogToLocalStorage(log: SyncLogInsert): void {
    try {
      const logs = this.getLogsFromLocalStorage();

      const newLog: SyncLogEntry = {
        id: log.id || crypto.randomUUID(),
        timestamp: new Date(log.created_at || new Date()),
        level: log.level || 'info',
        operation: log.operation,
        message: log.message,
        data: {
          status: log.status,
          itemsProcessed: log.items_processed,
          itemsSucceeded: log.items_succeeded,
          itemsFailed: log.items_failed,
        },
        duration: log.duration_ms || undefined,
      };

      logs.unshift(newLog as unknown as SyncLog);

      // Keep only last 100 logs
      const trimmed = logs.slice(0, 100);
      localStorage.setItem('sync_logs', JSON.stringify(trimmed));
    } catch (error) {
      logger.error('[SyncDB] Error saving log to localStorage:', error);
    }
  },

  /**
   * Migrate logs from localStorage to Supabase
   */
  async migrateFromLocalStorage(): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    const localLogs = this.getLogsFromLocalStorage();
    if (localLogs.length === 0) {
      return 0;
    }

    try {
      const logsToInsert: SyncLogInsert[] = localLogs.map((log) => ({
        id: log.id,
        operation: log.operation,
        status: log.status,
        level: log.level,
        message: log.message,
        items_processed: log.items_processed,
        items_succeeded: log.items_succeeded,
        items_failed: log.items_failed,
        duration_ms: log.duration_ms,
        error_details: log.error_details,
        metadata: log.metadata,
        created_at: log.created_at,
      }));

      const { error } = await supabase
        .from('sync_logs')
        .upsert(logsToInsert, {
          onConflict: 'id',
          ignoreDuplicates: true,
        });

      if (error) {
        logger.error('[SyncDB] Error migrating logs:', error);
        return 0;
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('sync_logs');
      logger.info(`[SyncDB] Migrated ${localLogs.length} logs from localStorage`);

      return localLogs.length;
    } catch (error) {
      logger.error('[SyncDB] Failed to migrate logs:', error);
      return 0;
    }
  },
};

export default syncDb;
