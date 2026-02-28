/**
 * Customer Synchronization Service
 *
 * Handles synchronization of customers from Avirato to Last.app
 * Ensures hotel guests appear in Last.app's customer dropdown for restaurant reservations
 *
 * Now integrated with Supabase for persistent storage of sync logs and customer data.
 */

import { aviratoService } from './avirato';
import { lastAppService } from './lastapp';
import { logger } from '@/utils/logger';
import { syncDb, customersDb, settingsDb, isSupabaseConfigured } from './database';
import type { AviratoReservation, AviratoClient } from './avirato';
import type { CreateCustomerRequest, LastAppCustomer } from '@/types/lastapp.types';
import type { CustomerInsert } from '@/types/supabase';
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
  private initialized: boolean = false;

  constructor() {
    // Initialize asynchronously
    this.initialize();
  }

  /**
   * Initialize service - load settings from database or localStorage
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to load from Supabase first, fall back to localStorage
      if (isSupabaseConfigured()) {
        const [lastSync, interval] = await Promise.all([
          syncDb.getLastSyncTime('sync_customers'),
          settingsDb.get('sync_interval', 300000),
        ]);

        if (lastSync) {
          this.lastSyncTime = lastSync;
        }

        this.syncInterval = interval as number;

        // Migrate localStorage data to Supabase if needed
        await this.migrateLocalStorageData();
      } else {
        // Fallback to localStorage
        const savedTime = localStorage.getItem('last_sync_time');
        if (savedTime) {
          this.lastSyncTime = new Date(savedTime);
        }

        const savedInterval = localStorage.getItem('sync_interval');
        if (savedInterval) {
          this.syncInterval = parseInt(savedInterval);
        }
      }

      this.initialized = true;
    } catch (error) {
      logger.error('[Sync] Initialization failed, using defaults:', error);

      // Fallback to localStorage
      const savedTime = localStorage.getItem('last_sync_time');
      if (savedTime) {
        this.lastSyncTime = new Date(savedTime);
      }

      const savedInterval = localStorage.getItem('sync_interval');
      if (savedInterval) {
        this.syncInterval = parseInt(savedInterval);
      }

      this.initialized = true;
    }
  }

  /**
   * Migrate data from localStorage to Supabase
   */
  private async migrateLocalStorageData(): Promise<void> {
    try {
      // Migrate sync logs
      await syncDb.migrateFromLocalStorage();

      // Migrate settings
      await settingsDb.migrateFromLocalStorage();

      logger.info('[Sync] LocalStorage migration completed');
    } catch (error) {
      logger.warn('[Sync] LocalStorage migration failed:', error);
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
      logger.info('[Sync] Starting customer synchronization', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // 1. Get reservations from Avirato
      onProgress?.(10, 'Obteniendo reservas de Avirato...');
      const response = await aviratoService.getReservations(startDate, endDate);
      const reservations = response.data.flat();

      logger.debug(`[Sync] Retrieved ${reservations.length} reservations from Avirato`);

      // 2. Extract unique customers
      onProgress?.(30, `Procesando ${reservations.length} reservas...`);
      const uniqueCustomers = this.extractUniqueCustomers(reservations);
      result.itemsProcessed = uniqueCustomers.size;

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

          // Save customer to database first (pending status)
          const customerDbRecord: CustomerInsert = {
            phone_normalized: phone,
            avirato_id: aviratoClient.client_doc || undefined,
            name: aviratoClient.name || 'Cliente',
            surname: aviratoClient.surname || undefined,
            email: aviratoClient.email || undefined,
            sync_status: 'pending',
          };

          // Upsert to database (non-blocking)
          customersDb.upsert(customerDbRecord).catch((err) => {
            logger.warn(`[Sync] Failed to save customer to DB: ${phone}`, err);
          });

          try {
            // Try to create customer directly (no search - API doesn't support search parameter)
            const created = await this.createCustomerWithRetry(customerData);
            result.itemsSucceeded++;

            // Update customer status in database
            customersDb.updateSyncStatus(phone, 'synced', created.id).catch((err) => {
              logger.warn(`[Sync] Failed to update customer status: ${phone}`, err);
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

              // Update customer status in database
              customersDb.updateSyncStatus(phone, 'synced').catch((err) => {
                logger.warn(`[Sync] Failed to update customer status: ${phone}`, err);
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

          // Update customer status in database
          customersDb.updateSyncStatus(phone, 'failed').catch((err) => {
            logger.warn(`[Sync] Failed to update customer status: ${phone}`, err);
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

      logger.info('[Sync] Synchronization completed', {
        processed: result.itemsProcessed,
        succeeded: result.itemsSucceeded,
        failed: result.itemsFailed,
        duration: `${result.duration}ms`
      });

      // Save log to database (and localStorage as backup)
      await syncDb.logSyncResult(
        result,
        `Sincronizados ${result.itemsSucceeded}/${result.itemsProcessed} clientes`
      );

      return result;

    } catch (error: any) {
      result.status = 'failed';
      result.endTime = new Date();
      result.duration = result.endTime ? result.endTime.getTime() - result.startTime.getTime() : 0;

      logger.error('[Sync] Synchronization failed:', error);

      // Save error log to database
      await syncDb.logSyncResult(result, error.message);

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

    // Save to both localStorage and database
    localStorage.setItem('sync_interval', intervalMs.toString());
    settingsDb.set('sync_interval', intervalMs).catch((err) => {
      logger.warn('[Sync] Failed to save sync_interval to database:', err);
    });
    settingsDb.set('auto_sync_enabled', true).catch((err) => {
      logger.warn('[Sync] Failed to save auto_sync_enabled to database:', err);
    });

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

      // Update database setting
      settingsDb.set('auto_sync_enabled', false).catch((err) => {
        logger.warn('[Sync] Failed to save auto_sync_enabled to database:', err);
      });

      logger.info('[Sync] Automatic sync stopped');
    }
  }

  /**
   * Get synchronization logs
   * Returns logs from database if configured, otherwise from localStorage
   * @param limit - Maximum number of logs to return
   * @returns Array of log entries (most recent first)
   */
  getSyncLogs(limit: number = 100): SyncLogEntry[] {
    // For synchronous compatibility, return from localStorage
    // The async version should be used when possible
    try {
      const logsJson = localStorage.getItem('sync_logs');
      const logs = logsJson ? JSON.parse(logsJson) : [];
      return logs.slice(0, limit);
    } catch (error) {
      logger.error('[Sync] Error reading sync logs:', error);
      return [];
    }
  }

  /**
   * Get synchronization logs asynchronously from database
   * @param limit - Maximum number of logs to return
   * @returns Array of log entries (most recent first)
   */
  async getSyncLogsAsync(limit: number = 100): Promise<SyncLogEntry[]> {
    try {
      const dbLogs = await syncDb.getLogs({ limit });

      // Convert database format to SyncLogEntry format
      return dbLogs.map((log) => ({
        id: log.id,
        timestamp: new Date(log.created_at),
        level: log.level as LogLevel,
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
      }));
    } catch (error) {
      logger.error('[Sync] Error reading sync logs from database:', error);
      // Fallback to localStorage
      return this.getSyncLogs(limit);
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Get last sync time asynchronously from database
   */
  async getLastSyncTimeAsync(): Promise<Date | null> {
    if (isSupabaseConfigured()) {
      return syncDb.getLastSyncTime('sync_customers');
    }
    return this.lastSyncTime;
  }

  /**
   * Clear all sync logs
   */
  clearLogs(): void {
    localStorage.removeItem('sync_logs');

    // Also clear from database
    syncDb.clearAllLogs().catch((err) => {
      logger.warn('[Sync] Failed to clear logs from database:', err);
    });

    logger.info('[Sync] Logs cleared');
  }

  /**
   * Clear all sync logs asynchronously
   */
  async clearLogsAsync(): Promise<void> {
    localStorage.removeItem('sync_logs');
    await syncDb.clearAllLogs();
    logger.info('[Sync] Logs cleared');
  }

  /**
   * Get sync statistics from database
   */
  async getStats(): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalItemsSynced: number;
    lastSyncTime: Date | null;
  }> {
    return syncDb.getStats();
  }

  /**
   * Get customer sync statistics
   */
  async getCustomerStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    total: number;
  }> {
    return customersDb.countByStatus();
  }
}

/**
 * Singleton instance
 */
export const customerSyncService = new CustomerSyncService();

export default customerSyncService;
