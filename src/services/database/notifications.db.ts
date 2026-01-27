/**
 * Notifications Database Service
 *
 * Handles notification queue and history in Supabase.
 * Provides foundation for automated messaging features.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  NotificationQueueItem,
  NotificationQueueInsert,
  NotificationQueueUpdate,
  NotificationHistoryItem,
  NotificationHistoryInsert,
  Json,
} from '@/types/supabase';
import { logger } from '@/utils/logger';

export type NotificationType = 'check_in_reminder' | 'payment_reminder' | 'welcome' | 'checkout' | 'custom';
export type NotificationChannel = 'whatsapp' | 'sms' | 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

/**
 * Notifications Database Service
 */
export const notificationsDb = {
  // ============================================================================
  // NOTIFICATION QUEUE
  // ============================================================================

  /**
   * Get queued notifications
   * @param options - Filter options
   */
  async getQueue(options?: {
    status?: NotificationStatus;
    type?: NotificationType;
    channel?: NotificationChannel;
    reservationId?: number;
    limit?: number;
    offset?: number;
  }): Promise<NotificationQueueItem[]> {
    if (!isSupabaseConfigured()) {
      logger.warn('[NotificationsDB] Supabase not configured');
      return [];
    }

    try {
      let query = supabase
        .from('notification_queue')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.type) {
        query = query.eq('notification_type', options.type);
      }

      if (options?.channel) {
        query = query.eq('channel', options.channel);
      }

      if (options?.reservationId) {
        query = query.eq('reservation_id', options.reservationId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[NotificationsDB] Error fetching queue:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('[NotificationsDB] Failed to get queue:', error);
      return [];
    }
  },

  /**
   * Get pending notifications ready to send
   * @param limit - Maximum number to return
   */
  async getPendingToSend(limit: number = 50): Promise<NotificationQueueItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('[NotificationsDB] Error fetching pending notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('[NotificationsDB] Failed to get pending notifications:', error);
      return [];
    }
  },

  /**
   * Queue a new notification
   * @param notification - The notification data
   */
  async queue(notification: NotificationQueueInsert): Promise<NotificationQueueItem | null> {
    if (!isSupabaseConfigured()) {
      logger.warn('[NotificationsDB] Supabase not configured, cannot queue notification');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .insert(notification)
        .select()
        .single();

      if (error) {
        logger.error('[NotificationsDB] Error queuing notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('[NotificationsDB] Failed to queue notification:', error);
      return null;
    }
  },

  /**
   * Bulk queue notifications
   * @param notifications - Array of notification data
   */
  async bulkQueue(notifications: NotificationQueueInsert[]): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    try {
      const { error } = await supabase
        .from('notification_queue')
        .insert(notifications);

      if (error) {
        logger.error('[NotificationsDB] Error bulk queuing notifications:', error);
        throw error;
      }

      return notifications.length;
    } catch (error) {
      logger.error('[NotificationsDB] Failed to bulk queue notifications:', error);
      return 0;
    }
  },

  /**
   * Update a queued notification
   * @param id - The notification ID
   * @param update - The update data
   */
  async updateQueue(id: string, update: NotificationQueueUpdate): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('notification_queue')
        .update({
          ...update,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        logger.error('[NotificationsDB] Error updating queue item:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[NotificationsDB] Failed to update queue item:', error);
      return false;
    }
  },

  /**
   * Mark a notification as sent
   * @param id - The notification ID
   */
  async markAsSent(id: string): Promise<boolean> {
    return this.updateQueue(id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
  },

  /**
   * Mark a notification as failed
   * @param id - The notification ID
   * @param errorMessage - The error message
   */
  async markAsFailed(id: string, errorMessage: string): Promise<boolean> {
    // First get current attempts
    const { data } = await supabase
      .from('notification_queue')
      .select('attempts')
      .eq('id', id)
      .single();

    return this.updateQueue(id, {
      status: 'failed',
      attempts: (data?.attempts || 0) + 1,
      last_attempt_at: new Date().toISOString(),
      error_message: errorMessage,
    });
  },

  /**
   * Cancel a queued notification
   * @param id - The notification ID
   */
  async cancel(id: string): Promise<boolean> {
    return this.updateQueue(id, { status: 'cancelled' });
  },

  /**
   * Cancel all notifications for a reservation
   * @param reservationId - The reservation ID
   */
  async cancelForReservation(reservationId: number): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('reservation_id', reservationId)
        .eq('status', 'pending')
        .select('id');

      if (error) {
        logger.error('[NotificationsDB] Error cancelling notifications:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error('[NotificationsDB] Failed to cancel notifications:', error);
      return 0;
    }
  },

  /**
   * Delete a queued notification
   * @param id - The notification ID
   */
  async deleteFromQueue(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('[NotificationsDB] Error deleting from queue:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[NotificationsDB] Failed to delete from queue:', error);
      return false;
    }
  },

  // ============================================================================
  // NOTIFICATION HISTORY
  // ============================================================================

  /**
   * Get notification history
   * @param options - Filter options
   */
  async getHistory(options?: {
    reservationId?: number;
    customerPhone?: string;
    type?: string;
    channel?: string;
    limit?: number;
    offset?: number;
  }): Promise<NotificationHistoryItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      let query = supabase
        .from('notification_history')
        .select('*')
        .order('sent_at', { ascending: false });

      if (options?.reservationId) {
        query = query.eq('reservation_id', options.reservationId);
      }

      if (options?.customerPhone) {
        query = query.eq('customer_phone', options.customerPhone);
      }

      if (options?.type) {
        query = query.eq('notification_type', options.type);
      }

      if (options?.channel) {
        query = query.eq('channel', options.channel);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[NotificationsDB] Error fetching history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('[NotificationsDB] Failed to get history:', error);
      return [];
    }
  },

  /**
   * Record a sent notification in history
   * @param notification - The notification history data
   */
  async recordSent(notification: NotificationHistoryInsert): Promise<NotificationHistoryItem | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('notification_history')
        .insert(notification)
        .select()
        .single();

      if (error) {
        logger.error('[NotificationsDB] Error recording sent notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('[NotificationsDB] Failed to record sent notification:', error);
      return null;
    }
  },

  /**
   * Update notification delivery status
   * @param id - The notification history ID
   * @param status - The new status
   */
  async updateDeliveryStatus(
    id: string,
    status: 'delivered' | 'read' | 'failed',
    timestamp?: Date
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const update: Partial<NotificationHistoryItem> = { status };

    if (status === 'delivered') {
      update.delivered_at = (timestamp || new Date()).toISOString();
    } else if (status === 'read') {
      update.read_at = (timestamp || new Date()).toISOString();
    }

    try {
      const { error } = await supabase
        .from('notification_history')
        .update(update)
        .eq('id', id);

      if (error) {
        logger.error('[NotificationsDB] Error updating delivery status:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[NotificationsDB] Failed to update delivery status:', error);
      return false;
    }
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get notification statistics
   */
  async getStats(): Promise<{
    queuedPending: number;
    queuedFailed: number;
    sentTotal: number;
    sentToday: number;
    deliveredTotal: number;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        queuedPending: 0,
        queuedFailed: 0,
        sentTotal: 0,
        sentToday: 0,
        deliveredTotal: 0,
      };
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [queuedPending, queuedFailed, sentTotal, sentToday, deliveredTotal] = await Promise.all([
        supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
        supabase.from('notification_history').select('*', { count: 'exact', head: true }),
        supabase.from('notification_history').select('*', { count: 'exact', head: true }).gte('sent_at', today.toISOString()),
        supabase.from('notification_history').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
      ]);

      return {
        queuedPending: queuedPending.count || 0,
        queuedFailed: queuedFailed.count || 0,
        sentTotal: sentTotal.count || 0,
        sentToday: sentToday.count || 0,
        deliveredTotal: deliveredTotal.count || 0,
      };
    } catch (error) {
      logger.error('[NotificationsDB] Failed to get stats:', error);
      return {
        queuedPending: 0,
        queuedFailed: 0,
        sentTotal: 0,
        sentToday: 0,
        deliveredTotal: 0,
      };
    }
  },

  /**
   * Check if a notification already exists for a reservation
   * @param reservationId - The reservation ID
   * @param type - The notification type
   */
  async existsForReservation(
    reservationId: number,
    type: NotificationType
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      // Check queue
      const { data: queueData } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('notification_type', type)
        .in('status', ['pending', 'sent'])
        .limit(1);

      if (queueData && queueData.length > 0) {
        return true;
      }

      // Check history (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: historyData } = await supabase
        .from('notification_history')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('notification_type', type)
        .gte('sent_at', weekAgo.toISOString())
        .limit(1);

      return historyData && historyData.length > 0;
    } catch (error) {
      logger.error('[NotificationsDB] Failed to check existing notification:', error);
      return false;
    }
  },
};

export default notificationsDb;
