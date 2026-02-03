/**
 * useCalendar Hook - Isolated hook for calendar page
 * This hook is completely separate from useAvirato.ts to avoid conflicts
 */

import { useState, useCallback, useRef } from 'react';
import {
  calendarService,
  type CalendarSpace,
  type CalendarReservation,
} from '@/services/calendar.service';

interface UseCalendarReturn {
  spaces: CalendarSpace[];
  reservations: CalendarReservation[];
  isLoadingSpaces: boolean;
  isLoadingReservations: boolean;
  isAuthenticated: boolean;
  error: string | null;
  loadSpaces: () => Promise<void>;
  loadReservations: (startDate: Date, endDate: Date) => Promise<void>;
  clearError: () => void;
}

export const useCalendar = (): UseCalendarReturn => {
  const [spaces, setSpaces] = useState<CalendarSpace[]>([]);
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce ref for reservations loading
  const loadReservationsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<string | null>(null);

  const isAuthenticated = calendarService.isAuthenticated();

  const loadSpaces = useCallback(async () => {
    if (!isAuthenticated) {
      setError('No autenticado. Por favor, inicia sesión primero.');
      return;
    }

    setIsLoadingSpaces(true);
    setError(null);

    try {
      const spacesData = await calendarService.fetchSpaces();
      setSpaces(spacesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar villas';
      setError(message);
      console.error('Error loading spaces:', err);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [isAuthenticated]);

  const loadReservations = useCallback(async (startDate: Date, endDate: Date) => {
    if (!isAuthenticated) {
      setError('No autenticado. Por favor, inicia sesión primero.');
      return;
    }

    // Create a unique key for this request
    const requestKey = `${startDate.toISOString()}-${endDate.toISOString()}`;

    // If same request is already pending, skip
    if (lastRequestRef.current === requestKey) {
      return;
    }

    // Clear any pending debounced request
    if (loadReservationsTimeoutRef.current) {
      clearTimeout(loadReservationsTimeoutRef.current);
    }

    // Debounce the request by 600ms to avoid 429 errors
    loadReservationsTimeoutRef.current = setTimeout(async () => {
      lastRequestRef.current = requestKey;
      setIsLoadingReservations(true);
      setError(null);

      try {
        const reservationsData = await calendarService.fetchReservations(startDate, endDate);
        setReservations(reservationsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar reservas';
        setError(message);
        console.error('Error loading reservations:', err);
      } finally {
        setIsLoadingReservations(false);
        lastRequestRef.current = null;
      }
    }, 600);
  }, [isAuthenticated]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    spaces,
    reservations,
    isLoadingSpaces,
    isLoadingReservations,
    isAuthenticated,
    error,
    loadSpaces,
    loadReservations,
    clearError,
  };
};
