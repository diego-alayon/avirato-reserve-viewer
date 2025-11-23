import { useState, useCallback, useEffect } from 'react';
import { aviratoService, type AviratoCredentials, type AviratoReservation } from '@/services/avirato';
import { useToast } from '@/hooks/use-toast';

export const useAvirato = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reservations, setReservations] = useState<AviratoReservation[]>([]);
  const { toast } = useToast();

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
      console.error('Authentication error:', error);
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

    setIsLoading(true);
    try {
      const response = await aviratoService.getReservations(startDate, endDate);
      
      if (response.status === 'success') {
        // Flatten the nested arrays to get all reservations
        const allReservations = response.data.flat();

        // Add mock billing lines for reservation 1567 (testing expandable rows)
        const reservationWith1567 = allReservations.find(r => {
          const id = r.reservation_id || r.id;
          const numericId = typeof id === 'string' ? parseInt(id) : id;
          return numericId === 1567;
        });

        if (reservationWith1567) {
          console.log('✅ Found reservation 1567, adding billing lines');
          reservationWith1567.billing_lines = [
            {
              id: '1567-1',
              concept: 'Coste de reserva',
              quantity: 1,
              unit_price: reservationWith1567.price || 0,
              total: reservationWith1567.price || 0,
              type: 'reservation'
            },
            {
              id: '1567-2',
              concept: 'Extra: Limpieza adicional',
              quantity: 1,
              unit_price: 50.00,
              total: 50.00,
              type: 'extra'
            },
            {
              id: '1567-3',
              concept: 'Extra: Cuna',
              quantity: 1,
              unit_price: 25.00,
              total: 25.00,
              type: 'extra'
            }
          ];
          console.log('✅ Billing lines added to reservation:', reservationWith1567);
        } else {
          console.log('❌ Reservation 1567 not found in results');
        }

        console.log('Reservations data:', allReservations);
        console.log('First reservation:', allReservations[0]);
        setReservations(allReservations);
        toast({
          title: "Reservas cargadas",
          description: `Se encontraron ${allReservations.length} reservas`,
        });
      } else {
        throw new Error('Failed to fetch reservations');
      }
    } catch (error) {
      console.error('Reservations fetch error:', error);
      
      if (error instanceof Error && error.message.includes('Token expired')) {
        setIsAuthenticated(false);
        aviratoService.clearToken();
      }
      
      toast({
        title: "Error al cargar reservas",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  const logout = useCallback(() => {
    aviratoService.clearToken();
    setIsAuthenticated(false);
    setReservations([]);
    toast({
      title: "Sesión cerrada",
      description: "Has sido desconectado de Avirato",
    });
  }, [toast]);

  return {
    isAuthenticated,
    isLoading,
    reservations,
    authenticate,
    fetchReservations,
    logout
  };
};