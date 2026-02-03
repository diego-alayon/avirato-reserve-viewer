/**
 * useCalendar Hook - Isolated hook for calendar page
 * This hook is completely separate from useAvirato.ts to avoid conflicts
 */

import { useState, useCallback, useRef, useEffect } from 'react';
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
  loadReservationsForDateRange: (startDate: Date, endDate: Date) => void;
  clearError: () => void;
}

export const useCalendar = (): UseCalendarReturn => {
  const [spaces, setSpaces] = useState<CalendarSpace[]>([]);
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState(() => calendarService.isAuthenticated());

  // Refs for debounce control
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchKeyRef = useRef<string>('');

  // Check auth state on mount and when localStorage changes
  const isAuthenticated = authState && calendarService.isAuthenticated();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadSpaces = useCallback(async () => {
    if (!isAuthenticated) {
      setError('No autenticado. Por favor, inicia sesión primero.');
      return;
    }

    // Don't reload if we already have spaces
    if (spaces.length > 0) {
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
      // Check if token expired
      if (message.includes('Token expirado') || message.includes('401')) {
        setAuthState(false);
      }
      console.error('Error loading spaces:', err);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [isAuthenticated, spaces.length]);

  // This function schedules a debounced fetch
  const loadReservationsForDateRange = useCallback((startDate: Date, endDate: Date) => {
    if (!isAuthenticated) {
      return;
    }

    const fetchKey = `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;

    // Skip if same request
    if (fetchKey === lastFetchKeyRef.current && reservations.length > 0) {
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set up new debounced request
    debounceTimerRef.current = setTimeout(async () => {
      lastFetchKeyRef.current = fetchKey;
      abortControllerRef.current = new AbortController();

      setIsLoadingReservations(true);
      setError(null);

      try {
        const reservationsData = await calendarService.fetchReservations(startDate, endDate);
        setReservations(reservationsData);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        const message = err instanceof Error ? err.message : 'Error al cargar reservas';
        setError(message);
        // Check if token expired
        if (message.includes('Token expirado') || message.includes('401')) {
          setAuthState(false);
        }
        console.error('Error loading reservations:', err);
      } finally {
        setIsLoadingReservations(false);
      }
    }, 800); // 800ms debounce
  }, [isAuthenticated, reservations.length]);

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
    loadReservationsForDateRange,
    clearError,
  };
};
