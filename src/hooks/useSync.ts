/**
 * useSync Hook
 *
 * React hook for managing customer synchronization state and operations.
 * Now integrated with Supabase for persistent storage of sync logs and settings.
 */

import { useState, useCallback, useEffect } from 'react';
import { customerSyncService } from '@/services/sync';
import { settingsDb, syncDb, isSupabaseConfigured } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import type { SyncOperationResult, SyncLogEntry } from '@/types/sync.types';
import type { SyncLog } from '@/types/supabase';

// Convert SyncLog to SyncLogEntry format
const convertToSyncLogEntry = (log: SyncLog): SyncLogEntry => ({
  id: log.id,
  timestamp: new Date(log.created_at),
  level: log.level,
  operation: log.operation,
  message: log.message,
  data: {
    itemsProcessed: log.items_processed,
    itemsSucceeded: log.items_succeeded,
    itemsFailed: log.items_failed,
    status: log.status,
    ...(log.metadata as object || {}),
  },
  error: log.error_details ? new Error(JSON.stringify(log.error_details)) : undefined,
  duration: log.duration_ms || undefined,
});

export const useSync = () => {
  const { toast } = useToast();

  // Estados
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncStats, setSyncStats] = useState<SyncOperationResult | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(300000); // 5 minutes default
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration from database/localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured()) {
          // Load from database
          const [interval, autoSync, logs, lastSync] = await Promise.all([
            settingsDb.get('sync_interval', 300000),
            settingsDb.get('auto_sync_enabled', false),
            syncDb.getLogs({ limit: 100 }),
            syncDb.getLastSyncTime('sync_customers'),
          ]);

          setSyncInterval(interval as number);
          setIsAutoSyncEnabled(autoSync as boolean);
          setSyncLogs(logs.map(convertToSyncLogEntry));
          setLastSyncTime(lastSync);
        } else {
          // Fallback to localStorage
          const savedInterval = localStorage.getItem('sync_interval');
          if (savedInterval) {
            setSyncInterval(parseInt(savedInterval));
          }

          const autoSyncEnabled = localStorage.getItem('auto_sync_enabled') === 'true';
          setIsAutoSyncEnabled(autoSyncEnabled);

          // Load logs from service
          setSyncLogs(customerSyncService.getSyncLogs());

          // Load last sync time
          const lastSync = customerSyncService.getLastSyncTime();
          setLastSyncTime(lastSync);
        }
      } catch (error) {
        console.error('[useSync] Failed to load settings:', error);
        // Fallback to localStorage
        const savedInterval = localStorage.getItem('sync_interval');
        if (savedInterval) {
          setSyncInterval(parseInt(savedInterval));
        }

        const autoSyncEnabled = localStorage.getItem('auto_sync_enabled') === 'true';
        setIsAutoSyncEnabled(autoSyncEnabled);
        setSyncLogs(customerSyncService.getSyncLogs());
        setLastSyncTime(customerSyncService.getLastSyncTime());
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  /**
   * Start manual synchronization
   */
  const startSync = useCallback(async (
    startDate: Date,
    endDate: Date
  ): Promise<SyncOperationResult | null> => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncMessage('Iniciando sincronización...');
    setSyncStats(null);

    try {
      const result = await customerSyncService.syncCustomersToLastApp(
        startDate,
        endDate,
        (progress, message) => {
          setSyncProgress(progress);
          setSyncMessage(message);
        }
      );

      setSyncStats(result);
      setLastSyncTime(new Date());

      // Refresh logs from database
      await refreshLogs();

      // Show success toast
      toast({
        title: 'Sincronización completada',
        description: `${result.itemsSucceeded}/${result.itemsProcessed} clientes sincronizados correctamente`,
      });

      return result;

    } catch (error: any) {
      toast({
        title: 'Error en sincronización',
        description: error.message || 'Ocurrió un error durante la sincronización',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
      setSyncMessage('');
    }
  }, [toast]);

  /**
   * Configure synchronization interval
   */
  const configureSyncInterval = useCallback(async (intervalMs: number) => {
    setSyncInterval(intervalMs);

    // Save to database
    await settingsDb.set('sync_interval', intervalMs);

    if (isAutoSyncEnabled) {
      customerSyncService.stopAutoSync();
      customerSyncService.startAutoSync(intervalMs);

      toast({
        title: 'Intervalo actualizado',
        description: `Sincronización automática cada ${intervalMs / 60000} minutos`
      });
    }
  }, [isAutoSyncEnabled, toast]);

  /**
   * Toggle automatic synchronization on/off
   */
  const toggleAutoSync = useCallback(async (enabled: boolean) => {
    setIsAutoSyncEnabled(enabled);

    // Save to both localStorage and database
    localStorage.setItem('auto_sync_enabled', enabled.toString());
    await settingsDb.set('auto_sync_enabled', enabled);

    if (enabled) {
      customerSyncService.startAutoSync(syncInterval);
      toast({
        title: 'Sincronización automática activada',
        description: `Se sincronizará cada ${syncInterval / 60000} minutos`
      });
    } else {
      customerSyncService.stopAutoSync();
      toast({
        title: 'Sincronización automática desactivada'
      });
    }
  }, [syncInterval, toast]);

  /**
   * Refresh logs from database
   */
  const refreshLogs = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        const [logs, lastSync] = await Promise.all([
          syncDb.getLogs({ limit: 100 }),
          syncDb.getLastSyncTime('sync_customers'),
        ]);
        setSyncLogs(logs.map(convertToSyncLogEntry));
        setLastSyncTime(lastSync);
      } else {
        setSyncLogs(customerSyncService.getSyncLogs());
        setLastSyncTime(customerSyncService.getLastSyncTime());
      }
    } catch (error) {
      console.error('[useSync] Failed to refresh logs:', error);
      setSyncLogs(customerSyncService.getSyncLogs());
      setLastSyncTime(customerSyncService.getLastSyncTime());
    }
  }, []);

  /**
   * Clear all sync logs
   */
  const clearLogs = useCallback(async () => {
    try {
      await customerSyncService.clearLogsAsync();
      setSyncLogs([]);
      toast({
        title: 'Logs eliminados',
        description: 'Historial de sincronización limpiado'
      });
    } catch (error) {
      console.error('[useSync] Failed to clear logs:', error);
      customerSyncService.clearLogs();
      setSyncLogs([]);
      toast({
        title: 'Logs eliminados',
        description: 'Historial de sincronización limpiado'
      });
    }
  }, [toast]);

  /**
   * Get sync statistics
   */
  const getStats = useCallback(async () => {
    return customerSyncService.getStats();
  }, []);

  /**
   * Get customer statistics
   */
  const getCustomerStats = useCallback(async () => {
    return customerSyncService.getCustomerStats();
  }, []);

  return {
    // Estados
    isSyncing,
    syncProgress,
    syncMessage,
    syncStats,
    syncLogs,
    isAutoSyncEnabled,
    syncInterval,
    lastSyncTime,
    isLoading,

    // Métodos
    startSync,
    configureSyncInterval,
    toggleAutoSync,
    refreshLogs,
    clearLogs,
    getStats,
    getCustomerStats,
  };
};
