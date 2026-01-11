/**
 * Customer Synchronization Service
 *
 * Handles synchronization of customers from Avirato to Last.app
 * Ensures hotel guests appear in Last.app's customer dropdown for restaurant reservations
 */

import { format } from 'date-fns';
import { aviratoService } from './avirato';
import { lastAppService } from './lastapp';
import { logger } from '@/utils/logger';
import type { AviratoReservation, AviratoClient } from './avirato';
import type { CreateCustomerRequest, LastAppCustomer } from '@/types/lastapp.types';
import type {
  SyncOperationResult,
  SyncError,
  SyncLogEntry,
  LogLevel
} from '@/types/sync.types';

/**
 * Customer Synchronization Service
 */
export class CustomerSyncService {
  private lastSyncTime: Date | null = null;
  private syncInterval: number = 300000; // 5 minutes default
  private autoSyncTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Restore last sync time from localStorage
    const savedTime = localStorage.getItem('last_sync_time');
    if (savedTime) {
      this.lastSyncTime = new Date(savedTime);
    }

    // Restore sync interval from localStorage
    const savedInterval = localStorage.getItem('sync_interval');
    if (savedInterval) {
      this.syncInterval = parseInt(savedInterval);
    }
  }

  /**
   * Synchronize customers from Avirato to Last.app
   * @param startDate - Start date for filtering reservations
   * @param endDate - End date for filtering reservations
   * @param onProgress - Callback for progress updates (optional)
   * @returns Result of the sync operation with statistics
   */
  async syncCustomersToLastApp(
    startDate: Date,
    endDate: Date,
    onProgress?: (progress: number, message: string) => void
  ): Promise<SyncOperationResult> {
    const result: SyncOperationResult = {
      id: crypto.randomUUID(),
      operation: 'sync_customers_avirato_to_lastapp',
      status: 'in_progress',
      startTime: new Date(),
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors: []
    };

    try {
      console.log('%c🔄 INICIANDO SINCRONIZACIÓN', 'background: #4CAF50; color: white; font-weight: bold; padding: 5px 10px; border-radius: 3px;');
      console.log('📅 Rango de fechas:', {
        desde: startDate.toLocaleDateString(),
        hasta: endDate.toLocaleDateString()
      });

      logger.info('[Sync] Starting customer synchronization', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // 1. Get reservations from Avirato
      onProgress?.(10, 'Obteniendo reservas de Avirato...');
      const response = await aviratoService.getReservations(startDate, endDate);
      const reservations = response.data.flat();

      console.log(`📋 Total reservas obtenidas de Avirato: ${reservations.length}`);
      logger.debug(`[Sync] Retrieved ${reservations.length} reservations from Avirato`);

      // 2. Extract unique customers
      onProgress?.(30, `Procesando ${reservations.length} reservas...`);
      const uniqueCustomers = this.extractUniqueCustomers(reservations);
      result.itemsProcessed = uniqueCustomers.size;

      console.log(`👥 Clientes únicos encontrados: ${uniqueCustomers.size}`);
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #999;');

      logger.info(`[Sync] Found ${uniqueCustomers.size} unique customers to sync`);

      // 3. Synchronize each customer
      let processed = 0;
      const syncedCustomers: Array<{name: string; phone: string; action: string}> = [];
      const failedCustomers: Array<{name: string; phone: string; error: string}> = [];

      for (const [phone, aviratoClient] of uniqueCustomers) {
        try {
          const customerName = `${aviratoClient.name || ''} ${aviratoClient.surname || ''}`.trim();

          // Transform customer data
          const customerData = this.transformCustomerData(aviratoClient);

          try {
            // Try to create customer directly (no search - API doesn't support search parameter)
            const created = await this.createCustomerWithRetry(customerData);
            result.itemsSucceeded++;

            console.log(`✅ CREADO: ${customerName}`, {
              teléfono: phone,
              email: aviratoClient.email || 'Sin email',
              id_lastapp: created.id
            });

            syncedCustomers.push({
              name: customerName,
              phone: phone,
              action: 'creado'
            });

            onProgress?.(
              30 + ((processed / uniqueCustomers.size) * 60),
              `Creado: ${customerName}`
            );

            logger.debug(`[Sync] Created customer: ${customerName} (${phone})`);

          } catch (createError: any) {
            // Check if error is due to duplicate phone number
            if (this.isDuplicateError(createError)) {
              // Customer already exists, mark as success
              result.itemsSucceeded++;

              console.log(`⏭️  YA EXISTE: ${customerName}`, {
                teléfono: phone
              });

              syncedCustomers.push({
                name: customerName,
                phone: phone,
                action: 'ya existe'
              });

              onProgress?.(
                30 + ((processed / uniqueCustomers.size) * 60),
                `Ya existe: ${customerName}`
              );

              logger.debug(`[Sync] Customer already exists: ${customerName} (${phone})`);
            } else {
              // Other error, re-throw to be handled by outer catch
              throw createError;
            }
          }
        } catch (error: any) {
          result.itemsFailed++;
          const syncError: SyncError = {
            entityId: phone,
            entityType: 'customer',
            errorMessage: error.message,
            errorCode: error.code,
            timestamp: new Date(),
            retryCount: 0
          };
          result.errors.push(syncError);

          const customerName = `${aviratoClient.name || ''} ${aviratoClient.surname || ''}`.trim();
          console.error(`❌ ERROR: ${customerName}`, {
            teléfono: phone,
            error: error.message
          });

          failedCustomers.push({
            name: customerName,
            phone: phone,
            error: error.message
          });

          logger.error(`[Sync] Failed to sync customer ${phone}:`, error);
        }

        processed++;
      }

      // 4. Finalize
      result.status = 'completed';
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();

      this.lastSyncTime = new Date();
      localStorage.setItem('last_sync_time', this.lastSyncTime.toISOString());

      onProgress?.(100, 'Sincronización completada');

      // Print summary
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #999;');
      console.log('%c📊 RESUMEN DE SINCRONIZACIÓN', 'background: #2196F3; color: white; font-weight: bold; padding: 5px 10px; border-radius: 3px;');
      console.log('⏱️  Duración:', `${(result.duration / 1000).toFixed(2)}s`);
      console.log('📊 Total procesados:', result.itemsProcessed);
      console.log('✅ Exitosos:', result.itemsSucceeded);
      console.log('❌ Fallidos:', result.itemsFailed);
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #999;');

      // Show synced customers table
      if (syncedCustomers.length > 0) {
        console.log('%c✅ CLIENTES SINCRONIZADOS:', 'background: #4CAF50; color: white; font-weight: bold; padding: 3px 8px;');
        console.table(syncedCustomers);
      }

      // Show failed customers table
      if (failedCustomers.length > 0) {
        console.log('%c❌ CLIENTES CON ERROR:', 'background: #f44336; color: white; font-weight: bold; padding: 3px 8px;');
        console.table(failedCustomers);
      }

      // Final message
      if (result.itemsFailed === 0) {
        console.log('%c🎉 SINCRONIZACIÓN EXITOSA - Todos los clientes fueron sincronizados correctamente', 'background: #4CAF50; color: white; font-weight: bold; padding: 8px 12px; border-radius: 5px; font-size: 14px;');
      } else if (result.itemsSucceeded > 0 && result.itemsFailed > 0) {
        console.log('%c⚠️  SINCRONIZACIÓN PARCIAL - Algunos clientes no pudieron sincronizarse', 'background: #FF9800; color: white; font-weight: bold; padding: 8px 12px; border-radius: 5px; font-size: 14px;');
      } else {
        console.log('%c❌ SINCRONIZACIÓN FALLIDA - No se pudo sincronizar ningún cliente', 'background: #f44336; color: white; font-weight: bold; padding: 8px 12px; border-radius: 5px; font-size: 14px;');
      }
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #999;');

      logger.info('[Sync] Synchronization completed', {
        processed: result.itemsProcessed,
        succeeded: result.itemsSucceeded,
        failed: result.itemsFailed,
        duration: `${result.duration}ms`
      });

      // Save log
      this.saveSyncLog({
        id: result.id,
        timestamp: new Date(),
        level: 'info',
        operation: 'sync_customers',
        message: `Sincronizados ${result.itemsSucceeded}/${result.itemsProcessed} clientes`,
        data: result,
        duration: result.duration
      });

      return result;

    } catch (error: any) {
      result.status = 'failed';
      result.endTime = new Date();
      result.duration = result.endTime ? result.endTime.getTime() - result.startTime.getTime() : 0;

      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #999;');
      console.log('%c💥 ERROR CRÍTICO EN LA SINCRONIZACIÓN', 'background: #f44336; color: white; font-weight: bold; padding: 8px 12px; border-radius: 5px; font-size: 14px;');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #999;');

      logger.error('[Sync] Synchronization failed:', error);

      this.saveSyncLog({
        id: result.id,
        timestamp: new Date(),
        level: 'error',
        operation: 'sync_customers',
        message: error.message,
        error,
        duration: result.duration
      });

      throw error;
    }
  }

  /**
   * Extract unique customers from reservations
   * Deduplicates by normalized phone number
   */
  private extractUniqueCustomers(
    reservations: AviratoReservation[]
  ): Map<string, AviratoClient> {
    const customersMap = new Map<string, AviratoClient>();

    for (const reservation of reservations) {
      if (!reservation.client) continue;

      const phone = this.normalizePhone(reservation.client.phone);

      // Skip if no valid phone
      if (!phone) {
        logger.warn('[Sync] Skipping customer without phone:', reservation.client.name);
        continue;
      }

      // If phone already exists, keep the first one
      if (!customersMap.has(phone)) {
        customersMap.set(phone, reservation.client);
      }
    }

    return customersMap;
  }

  /**
   * Check if error indicates duplicate customer (phone already exists)
   * @param error - Error from create customer API call
   * @returns true if duplicate, false otherwise
   */
  private isDuplicateError(error: any): boolean {
    // Check for common duplicate error patterns from Last.app API
    const errorMessage = error.message?.toLowerCase() || '';

    return (
      errorMessage.includes('duplicate') ||
      errorMessage.includes('already exists') ||
      errorMessage.includes('unique constraint') ||
      errorMessage.includes('unique_violation') ||
      (errorMessage.includes('phone') && errorMessage.includes('exists')) ||
      errorMessage.includes('phonenumber') && errorMessage.includes('already') ||
      error.status === 409 || // HTTP 409 Conflict
      error.code === 'DUPLICATE_ENTRY' ||
      error.code === 'ER_DUP_ENTRY'
    );
  }

  /**
   * Transform Avirato client data to Last.app customer format
   * Based on official Last.app API documentation: https://developers.last.app/docs
   */
  private transformCustomerData(aviratoClient: AviratoClient): CreateCustomerRequest {
    // Get organization ID from environment
    const organizationId = lastAppService.getOrganizationId();
    if (!organizationId) {
      throw new Error('Organization ID not configured. Set VITE_LASTAPP_ORGANIZATION_ID in .env.local');
    }

    const firstName = aviratoClient.name || 'Cliente';
    const lastName = aviratoClient.surname || '';

    return {
      organizationId: organizationId,
      name: firstName,
      phoneNumber: this.normalizePhone(aviratoClient.phone),
      source: 'hotel', // Source: hotel guests from Avirato
      surname: lastName || undefined,
      email: aviratoClient.email || undefined,
      internalNote: aviratoClient.observations || undefined,
      externalId: aviratoClient.id?.toString() || undefined
    };
  }

  /**
   * Create customer with automatic retry logic
   * @param customerData - Customer data to create
   * @param maxRetries - Maximum number of retry attempts
   * @returns Created customer
   */
  private async createCustomerWithRetry(
    customerData: CreateCustomerRequest,
    maxRetries: number = 3
  ): Promise<LastAppCustomer> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await lastAppService.createCustomer(customerData);
      } catch (error: any) {
        lastError = error;

        // If rate limit error (429), wait longer
        if (error.message.includes('429') || error.message.includes('Rate limit')) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn(`[Sync] Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
          await this.sleep(waitTime);
        } else if (attempt < maxRetries - 1) {
          // Other errors, shorter backoff
          const waitTime = Math.pow(2, attempt) * 500;
          logger.warn(`[Sync] Error creating customer, retry ${attempt + 1}/${maxRetries} in ${waitTime}ms`);
          await this.sleep(waitTime);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Normalize phone number
   * Adds +34 country code if missing and removes formatting
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';

    // Remove spaces, dashes, parentheses
    let normalized = phone.replace(/[\s\-\(\)]/g, '');

    // Add +34 if no country code
    if (!normalized.startsWith('+')) {
      normalized = '+34' + normalized;
    }

    return normalized;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Start automatic synchronization
   * @param intervalMs - Interval in milliseconds between syncs
   */
  startAutoSync(intervalMs: number): void {
    this.syncInterval = intervalMs;
    localStorage.setItem('sync_interval', intervalMs.toString());

    // Clear existing timer
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }

    this.autoSyncTimer = setInterval(async () => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30); // 30 days back

      try {
        logger.info('[Sync] Running automatic sync');
        await this.syncCustomersToLastApp(startDate, now);
      } catch (error: any) {
        logger.error('[Sync] Automatic sync failed:', error);
      }
    }, intervalMs);

    logger.info(`[Sync] Automatic sync started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      logger.info('[Sync] Automatic sync stopped');
    }
  }

  /**
   * Get synchronization logs from localStorage
   * @returns Array of log entries (most recent first)
   */
  getSyncLogs(): SyncLogEntry[] {
    try {
      const logsJson = localStorage.getItem('sync_logs');
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      logger.error('[Sync] Error reading sync logs:', error);
      return [];
    }
  }

  /**
   * Save synchronization log entry to localStorage
   * Maintains only the last 100 logs
   */
  private saveSyncLog(entry: SyncLogEntry): void {
    try {
      const logs = this.getSyncLogs();
      logs.unshift(entry); // Add to beginning

      // Keep only last 100 logs
      const trimmed = logs.slice(0, 100);
      localStorage.setItem('sync_logs', JSON.stringify(trimmed));
    } catch (error) {
      logger.error('[Sync] Error saving sync log:', error);
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Clear all sync logs
   */
  clearLogs(): void {
    localStorage.removeItem('sync_logs');
    logger.info('[Sync] Logs cleared');
  }
}

/**
 * Singleton instance
 */
export const customerSyncService = new CustomerSyncService();

export default customerSyncService;
