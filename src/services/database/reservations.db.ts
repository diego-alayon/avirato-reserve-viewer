/**
 * Reservations Database Service
 *
 * Handles caching and retrieval of reservations data from Supabase.
 * Provides a cache layer between the Avirato API and the frontend.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AviratoReservation } from '../avirato';
import type {
  ReservationCache,
  ReservationCacheInsert,
  ReservationCacheUpdate,
} from '@/types/supabase';
import { logger } from '@/utils/logger';

/**
 * Reservations Database Service
 */
export const reservationsDb = {
  /**
   * Get all cached reservations
   * @param options - Filter options
   */
  async getAll(options?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ReservationCache[]> {
    if (!isSupabaseConfigured()) {
      logger.warn('[ReservationsDB] Supabase not configured, returning empty array');
      return [];
    }

    try {
      let query = supabase
        .from('reservations_cache')
        .select('*')
        .order('check_in_date', { ascending: false });

      if (options?.startDate) {
        query = query.gte('check_in_date', options.startDate.toISOString().split('T')[0]);
      }

      if (options?.endDate) {
        query = query.lte('check_in_date', options.endDate.toISOString().split('T')[0]);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[ReservationsDB] Error fetching reservations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('[ReservationsDB] Failed to get reservations:', error);
      throw error;
    }
  },

  /**
   * Get a single reservation by Avirato ID
   * @param aviratoId - The Avirato reservation ID
   */
  async getByAviratoId(aviratoId: number): Promise<ReservationCache | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('reservations_cache')
        .select('*')
        .eq('avirato_id', aviratoId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        logger.error('[ReservationsDB] Error fetching reservation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('[ReservationsDB] Failed to get reservation:', error);
      return null;
    }
  },

  /**
   * Upsert (insert or update) a reservation in the cache
   * @param reservation - The Avirato reservation data
   */
  async upsert(reservation: AviratoReservation): Promise<ReservationCache | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const aviratoId = reservation.reservation_id || reservation.reservationId;
    const clientName = reservation.client_name || reservation.clientName ||
      `${reservation.client?.name || ''} ${reservation.client?.surname || ''}`.trim();

    const data: ReservationCacheInsert = {
      avirato_id: aviratoId,
      client_name: clientName,
      client_phone: reservation.client?.phone || null,
      client_email: reservation.client?.email || null,
      check_in_date: reservation.check_in_date || reservation.checkInDate,
      check_out_date: reservation.check_out_date || reservation.checkOutDate,
      status: reservation.status,
      price: reservation.price,
      billing_total: reservation.billing_total || null,
      is_fully_paid: reservation.is_fully_paid || false,
      payment_link: reservation.payment_link || null,
      operator_id: reservation.operator_id || reservation.operatorId || null,
      operator_name: reservation.operator_name || null,
      space_type_name: reservation.space_type_name || null,
      space_name: reservation.space_name || null,
      regime: reservation.regime || null,
      adults: reservation.adults || 0,
      children: reservation.children || 0,
      observations: reservation.observations || null,
      extras_text: reservation.extras_text || null,
      raw_data: reservation as unknown as Record<string, unknown>,
      synced_at: new Date().toISOString(),
    };

    try {
      const { data: result, error } = await supabase
        .from('reservations_cache')
        .upsert(data, {
          onConflict: 'avirato_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        logger.error('[ReservationsDB] Error upserting reservation:', error);
        throw error;
      }

      return result;
    } catch (error) {
      logger.error('[ReservationsDB] Failed to upsert reservation:', error);
      return null;
    }
  },

  /**
   * Bulk upsert reservations
   * @param reservations - Array of Avirato reservations
   */
  async bulkUpsert(reservations: AviratoReservation[]): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    const records: ReservationCacheInsert[] = reservations.map((reservation) => {
      const aviratoId = reservation.reservation_id || reservation.reservationId;
      const clientName = reservation.client_name || reservation.clientName ||
        `${reservation.client?.name || ''} ${reservation.client?.surname || ''}`.trim();

      return {
        avirato_id: aviratoId,
        client_name: clientName,
        client_phone: reservation.client?.phone || null,
        client_email: reservation.client?.email || null,
        check_in_date: reservation.check_in_date || reservation.checkInDate,
        check_out_date: reservation.check_out_date || reservation.checkOutDate,
        status: reservation.status,
        price: reservation.price,
        billing_total: reservation.billing_total || null,
        is_fully_paid: reservation.is_fully_paid || false,
        payment_link: reservation.payment_link || null,
        operator_id: reservation.operator_id || reservation.operatorId || null,
        operator_name: reservation.operator_name || null,
        space_type_name: reservation.space_type_name || null,
        space_name: reservation.space_name || null,
        regime: reservation.regime || null,
        adults: reservation.adults || 0,
        children: reservation.children || 0,
        observations: reservation.observations || null,
        extras_text: reservation.extras_text || null,
        raw_data: reservation as unknown as Record<string, unknown>,
        synced_at: new Date().toISOString(),
      };
    });

    try {
      const { error } = await supabase
        .from('reservations_cache')
        .upsert(records, {
          onConflict: 'avirato_id',
          ignoreDuplicates: false,
        });

      if (error) {
        logger.error('[ReservationsDB] Error bulk upserting reservations:', error);
        throw error;
      }

      return records.length;
    } catch (error) {
      logger.error('[ReservationsDB] Failed to bulk upsert reservations:', error);
      return 0;
    }
  },

  /**
   * Delete old cached reservations
   * @param olderThan - Delete reservations synced before this date
   */
  async deleteOld(olderThan: Date): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    try {
      const { data, error } = await supabase
        .from('reservations_cache')
        .delete()
        .lt('synced_at', olderThan.toISOString())
        .select('id');

      if (error) {
        logger.error('[ReservationsDB] Error deleting old reservations:', error);
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error('[ReservationsDB] Failed to delete old reservations:', error);
      return 0;
    }
  },

  /**
   * Get count of cached reservations
   */
  async count(): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('reservations_cache')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error('[ReservationsDB] Error counting reservations:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      logger.error('[ReservationsDB] Failed to count reservations:', error);
      return 0;
    }
  },

  /**
   * Subscribe to real-time changes in reservations
   * @param callback - Function to call when data changes
   */
  subscribeToChanges(
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: ReservationCache | null;
      old: ReservationCache | null;
    }) => void
  ) {
    if (!isSupabaseConfigured()) {
      logger.warn('[ReservationsDB] Supabase not configured, skipping subscription');
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('reservations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations_cache',
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as ReservationCache,
            old: payload.old as ReservationCache,
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};

export default reservationsDb;
