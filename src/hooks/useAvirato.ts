import { useState, useCallback, useEffect, useRef } from 'react';
import { aviratoService, type AviratoCredentials, type AviratoReservation } from '@/services/avirato';
import { useToast } from '@/hooks/use-toast';

export const useAvirato = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [reservations, setReservations] = useState<AviratoReservation[]>([]);
  const { toast } = useToast();
  const enrichAbortRef = useRef<AbortController | null>(null);

  // Verificar autenticación al cargar el hook
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = aviratoService.isAuthenticated();
      setIsAuthenticated(authStatus);
    };
    checkAuthStatus();
  }, []);

  const authenticate = useCallback(async (credentials: AviratoCredentials) => {
    setIsLoading(true);
    try {
      const response = await aviratoService.authenticate(credentials);

      if (response.status === 'success') {
        setIsAuthenticated(true);
        toast({
          title: "Autenticación exitosa",
          description: "Conectado a Avirato correctamente",
        });
        return true;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchReservations = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!isAuthenticated) {
      toast({
        title: "No autenticado",
        description: "Por favor, autentícate primero",
        variant: "destructive",
      });
      return;
    }

    // Abort any in-progress enrichment
    if (enrichAbortRef.current) {
      enrichAbortRef.current.abort();
    }

    setIsLoading(true);
    try {
      const response = await aviratoService.getReservations(startDate, endDate);

      if (response.status === 'success') {
        const allReservations = response.data.flat();
        setReservations(allReservations);
        setIsLoading(false);

        toast({
          title: "Reservas cargadas",
          description: `Se encontraron ${allReservations.length} reservas. Cargando detalles de pago...`,
        });

        // Enrich payment details in background
        const abortController = new AbortController();
        enrichAbortRef.current = abortController;
        setIsEnriching(true);

        await aviratoService.enrichAllReservationsInBackground(
          allReservations,
          (updated) => setReservations(updated),
          abortController.signal
        );

        setIsEnriching(false);
      } else {
        throw new Error('Failed to fetch reservations');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Token expired')) {
        setIsAuthenticated(false);
        aviratoService.clearToken();
      }

      toast({
        title: "Error al cargar reservas",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
      setIsLoading(false);
      setIsEnriching(false);
    }
  }, [isAuthenticated, toast]);

  const logout = useCallback(() => {
    // Abort enrichment on logout
    if (enrichAbortRef.current) {
      enrichAbortRef.current.abort();
    }
    aviratoService.clearToken();
    setIsAuthenticated(false);
    setReservations([]);
    setIsEnriching(false);
    toast({
      title: "Sesión cerrada",
      description: "Has sido desconectado de Avirato",
    });
  }, [toast]);

  return {
    isAuthenticated,
    isLoading,
    isEnriching,
    reservations,
    authenticate,
    fetchReservations,
    logout
  };
};
