/**
 * useRealtimeReservations Hook
 *
 * React hook for real-time subscription to reservations changes in Supabase.
 * Provides live updates when reservations are created, updated, or deleted.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { reservationsDb, isSupabaseConfigured } from '@/services/database';
import type { ReservationCache } from '@/types/supabase';
import { logger } from '@/utils/logger';

interface UseRealtimeReservationsOptions {
  /** Enable real-time subscription (default: true) */
  enabled?: boolean;
  /** Initial reservations to display while loading */
  initialData?: ReservationCache[];
  /** Filter by start date */
  startDate?: Date;
  /** Filter by end date */
  endDate?: Date;
  /** Callback when a reservation is added */
  onAdd?: (reservation: ReservationCache) => void;
  /** Callback when a reservation is updated */
  onUpdate?: (reservation: ReservationCache) => void;
  /** Callback when a reservation is deleted */
  onDelete?: (reservation: ReservationCache) => void;
}

interface UseRealtimeReservationsReturn {
  /** List of reservations */
  reservations: ReservationCache[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether real-time is connected */
  isConnected: boolean;
  /** Refresh reservations from database */
  refresh: () => Promise<void>;
}

export const useRealtimeReservations = (
  options: UseRealtimeReservationsOptions = {}
): UseRealtimeReservationsReturn => {
  const {
    enabled = true,
    initialData = [],
    startDate,
    endDate,
    onAdd,
    onUpdate,
    onDelete,
  } = options;

  const [reservations, setReservations] = useState<ReservationCache[]>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep track of subscription cleanup
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  /**
   * Fetch reservations from database
   */
  const fetchReservations = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await reservationsDb.getAll({
        startDate,
        endDate,
      });

      setReservations(data);
    } catch (err) {
      logger.error('[useRealtimeReservations] Failed to fetch reservations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch reservations'));
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  /**
   * Handle real-time updates
   */
  const handleRealtimeUpdate = useCallback(
    (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: ReservationCache | null;
      old: ReservationCache | null;
    }) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      logger.debug('[useRealtimeReservations] Received update:', { eventType, newRecord, oldRecord });

      switch (eventType) {
        case 'INSERT':
          if (newRecord) {
            setReservations((prev) => [newRecord, ...prev]);
            onAdd?.(newRecord);
          }
          break;

        case 'UPDATE':
          if (newRecord) {
            setReservations((prev) =>
              prev.map((r) => (r.id === newRecord.id ? newRecord : r))
            );
            onUpdate?.(newRecord);
          }
          break;

        case 'DELETE':
          if (oldRecord) {
            setReservations((prev) => prev.filter((r) => r.id !== oldRecord.id));
            onDelete?.(oldRecord);
          }
          break;
      }
    },
    [onAdd, onUpdate, onDelete]
  );

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      return;
    }

    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Set up new subscription
    const subscription = reservationsDb.subscribeToChanges(handleRealtimeUpdate);
    subscriptionRef.current = subscription;
    setIsConnected(true);

    logger.info('[useRealtimeReservations] Real-time subscription established');

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        setIsConnected(false);
        logger.info('[useRealtimeReservations] Real-time subscription closed');
      }
    };
  }, [enabled, handleRealtimeUpdate]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchReservations();
  }, [fetchReservations]);

  return {
    reservations,
    isLoading,
    error,
    isConnected,
    refresh,
  };
};

export default useRealtimeReservations;
