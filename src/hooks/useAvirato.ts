import { useState, useCallback } from 'react';
import { aviratoService, type AviratoCredentials, type AviratoReservation } from '@/services/avirato';
import { useToast } from '@/hooks/use-toast';

export const useAvirato = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(aviratoService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [reservations, setReservations] = useState<AviratoReservation[]>([]);
  const { toast } = useToast();

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

  const fetchReservations = useCallback(async () => {
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
      const response = await aviratoService.getReservations();
      
      if (response.status === 'success') {
        // Flatten the nested arrays to get all reservations
        const allReservations = response.data.flat();
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