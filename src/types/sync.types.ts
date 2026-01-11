/**
 * Synchronization Types
 *
 * Type definitions for synchronizing data between Avirato and Last.app APIs
 */

import type { AviratoReservation } from '../services/avirato';
import type { LastAppTab, LastAppReservation, LastAppCustomer } from './lastapp.types';

// ============================================================================
// SYNC CONFIGURATION
// ============================================================================

/**
 * Configuration for sync service
 */
export interface SyncConfig {
  /** Enable reservation synchronization */
  syncReservations: boolean;
  /** Enable inventory synchronization */
  syncInventory: boolean;
  /** Enable pricing synchronization */
  syncPricing: boolean;
  /** Auto-sync interval in milliseconds */
  syncInterval: number;
  /** Enable automatic sync on startup */
  autoStart: boolean;
  /** Direction of sync */
  syncDirection: SyncDirection;
}

/**
 * Sync direction options
 */
export type SyncDirection = 'avirato_to_lastapp' | 'lastapp_to_avirato' | 'bidirectional';

// ============================================================================
// SYNC STATUS
// ============================================================================

/**
 * Overall sync status
 */
export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  nextSyncTime: Date | null;
  totalSynced: number;
  totalErrors: number;
  currentOperation: string | null;
}

/**
 * Status of a single sync operation
 */
export type SyncOperationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Sync operation result
 */
export interface SyncOperationResult {
  id: string;
  operation: string;
  status: SyncOperationStatus;
  startTime: Date;
  endTime?: Date;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errors: SyncError[];
  duration?: number;
}

/**
 * Sync error information
 */
export interface SyncError {
  entityId: string;
  entityType: 'reservation' | 'tab' | 'customer' | 'product' | 'payment';
  errorMessage: string;
  errorCode?: string;
  timestamp: Date;
  retryCount: number;
}

// ============================================================================
// SYNCED ENTITIES
// ============================================================================

/**
 * Synced reservation mapping
 */
export interface SyncedReservation {
  aviratoId: number;
  lastAppId?: string;
  syncStatus: SyncOperationStatus;
  lastSyncedAt?: Date;
  syncErrors?: SyncError[];
  sourceData: AviratoReservation;
  targetData?: LastAppReservation;
}

/**
 * Synced tab/order mapping
 */
export interface SyncedTab {
  lastAppId: string;
  aviratoId?: number;
  syncStatus: SyncOperationStatus;
  lastSyncedAt?: Date;
  syncErrors?: SyncError[];
  sourceData: LastAppTab;
  targetData?: Partial<AviratoReservation>;
}

/**
 * Synced customer mapping
 */
export interface SyncedCustomer {
  aviratoId: string;
  lastAppId?: string;
  syncStatus: SyncOperationStatus;
  lastSyncedAt?: Date;
  phone: string;
  email?: string;
}

/**
 * Synced product/service mapping
 */
export interface SyncedProduct {
  aviratoId: string;
  lastAppId?: string;
  name: string;
  syncStatus: SyncOperationStatus;
  lastSyncedAt?: Date;
}

// ============================================================================
// SYNC TRANSFORMERS
// ============================================================================

/**
 * Transformation result
 */
export interface TransformResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

/**
 * Field mapping configuration
 */
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
  required?: boolean;
  defaultValue?: any;
}

/**
 * Entity mapping configuration
 */
export interface EntityMapping {
  sourceType: string;
  targetType: string;
  fields: FieldMapping[];
  validate?: (data: any) => boolean;
}

// ============================================================================
// SYNC QUEUE
// ============================================================================

/**
 * Sync queue item
 */
export interface SyncQueueItem {
  id: string;
  entityType: 'reservation' | 'tab' | 'customer' | 'product' | 'payment';
  operation: 'create' | 'update' | 'delete';
  direction: SyncDirection;
  data: any;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledFor?: Date;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

/**
 * Sync queue configuration
 */
export interface SyncQueueConfig {
  maxSize: number;
  batchSize: number;
  processingInterval: number;
  priorityLevels: number;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy =
  | 'last_write_wins'
  | 'avirato_wins'
  | 'lastapp_wins'
  | 'manual'
  | 'merge';

/**
 * Data conflict
 */
export interface DataConflict {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  aviratoValue: any;
  lastAppValue: any;
  aviratoTimestamp: Date;
  lastAppTimestamp: Date;
  resolvedValue?: any;
  resolvedAt?: Date;
  resolvedBy?: ConflictStrategy;
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  conflictId: string;
  strategy: ConflictStrategy;
  resolvedValue: any;
  timestamp: Date;
  autoResolved: boolean;
}

// ============================================================================
// SYNC METRICS
// ============================================================================

/**
 * Sync metrics for monitoring
 */
export interface SyncMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  lastOperationDuration: number;
  itemsPerSecond: number;
  errorRate: number;
  uptimePercentage: number;
}

/**
 * Real-time sync statistics
 */
export interface SyncStatistics {
  reservations: {
    total: number;
    synced: number;
    pending: number;
    failed: number;
  };
  tabs: {
    total: number;
    synced: number;
    pending: number;
    failed: number;
  };
  customers: {
    total: number;
    synced: number;
    pending: number;
    failed: number;
  };
  lastSyncTimestamp: Date | null;
  nextScheduledSync: Date | null;
}

// ============================================================================
// SYNC EVENTS
// ============================================================================

/**
 * Sync event types
 */
export type SyncEventType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'sync_paused'
  | 'sync_resumed'
  | 'item_synced'
  | 'item_failed'
  | 'conflict_detected'
  | 'conflict_resolved';

/**
 * Sync event payload
 */
export interface SyncEvent {
  type: SyncEventType;
  timestamp: Date;
  data: any;
  message: string;
}

/**
 * Sync event listener
 */
export type SyncEventListener = (event: SyncEvent) => void;

// ============================================================================
// SYNC LOGS
// ============================================================================

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Sync log entry
 */
export interface SyncLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  operation: string;
  message: string;
  data?: any;
  error?: Error;
  duration?: number;
}

/**
 * Sync log filter
 */
export interface SyncLogFilter {
  startDate?: Date;
  endDate?: Date;
  levels?: LogLevel[];
  operations?: string[];
  search?: string;
  limit?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial deep - makes all properties and nested properties optional
 */
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

/**
 * Required deep - makes all properties and nested properties required
 */
export type RequiredDeep<T> = {
  [P in keyof T]-?: T[P] extends object ? RequiredDeep<T[P]> : T[P];
};

/**
 * Sync result with detailed information
 */
export interface DetailedSyncResult<T> {
  success: boolean;
  data?: T;
  syncedAt: Date;
  syncDuration: number;
  errors: SyncError[];
  warnings: string[];
  metadata: {
    sourceSystem: 'avirato' | 'lastapp';
    targetSystem: 'avirato' | 'lastapp';
    transformationsApplied: string[];
    validationsPassed: boolean;
  };
}
