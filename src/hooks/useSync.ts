/**
 * useSync Hook
 *
 * React hook for managing customer synchronization state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { customerSyncService } from '@/services/sync';
import { useToast } from '@/hooks/use-toast';
import type { SyncOperationResult, SyncLogEntry } from '@/types/sync.types';

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

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedInterval = localStorage.getItem('sync_interval');
    if (savedInterval) {
      setSyncInterval(parseInt(savedInterval));
    }

    const autoSyncEnabled = localStorage.getItem('auto_sync_enabled') === 'true';
    setIsAutoSyncEnabled(autoSyncEnabled);

    // Load logs
    setSyncLogs(customerSyncService.getSyncLogs());

    // Load last sync time
    const lastSync = customerSyncService.getLastSyncTime();
    setLastSyncTime(lastSync);
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
      setSyncLogs(customerSyncService.getSyncLogs());
      setLastSyncTime(new Date());

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
  const configureSyncInterval = useCallback((intervalMs: number) => {
    setSyncInterval(intervalMs);

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
  const toggleAutoSync = useCallback((enabled: boolean) => {
    setIsAutoSyncEnabled(enabled);
    localStorage.setItem('auto_sync_enabled', enabled.toString());

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
   * Refresh logs from localStorage
   */
  const refreshLogs = useCallback(() => {
    setSyncLogs(customerSyncService.getSyncLogs());
    setLastSyncTime(customerSyncService.getLastSyncTime());
  }, []);

  /**
   * Clear all sync logs
   */
  const clearLogs = useCallback(() => {
    customerSyncService.clearLogs();
    setSyncLogs([]);
    toast({
      title: 'Logs eliminados',
      description: 'Historial de sincronización limpiado'
    });
  }, [toast]);

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

    // Métodos
    startSync,
    configureSyncInterval,
    toggleAutoSync,
    refreshLogs,
    clearLogs
  };
};
