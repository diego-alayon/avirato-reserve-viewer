/**
 * useLastApp Hook
 *
 * React hook for managing Last.app authentication and state
 */

import { useState, useCallback, useEffect } from 'react';
import { lastAppService } from '@/services/lastapp';
import { useToast } from '@/hooks/use-toast';
import type {
  LastAppCredentials,
  LastAppOrganization,
  LastAppLocation
} from '@/types/lastapp.types';

export const useLastApp = () => {
  const { toast } = useToast();

  // Estados
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<LastAppOrganization[]>([]);
  const [locations, setLocations] = useState<LastAppLocation[]>([]);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const authenticated = lastAppService.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      setCurrentOrganizationId(lastAppService.getOrganizationId());
      setCurrentLocationId(lastAppService.getLocationId());
    }
  }, []);

  /**
   * Authenticate with Last.app
   */
  const authenticate = useCallback(async (credentials: LastAppCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      await lastAppService.authenticate(credentials);
      setIsAuthenticated(true);
      setCurrentOrganizationId(credentials.organizationId || null);
      setCurrentLocationId(credentials.locationId || null);

      toast({
        title: 'Conexión exitosa',
        description: 'Conectado a Last.app correctamente',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error de conexión',
        description: error.message || 'No se pudo conectar con Last.app',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Disconnect from Last.app
   */
  const disconnect = useCallback(() => {
    lastAppService.clearToken();
    setIsAuthenticated(false);
    setOrganizations([]);
    setLocations([]);
    setCurrentOrganizationId(null);
    setCurrentLocationId(null);

    toast({
      title: 'Desconectado',
      description: 'Sesión de Last.app cerrada'
    });
  }, [toast]);

  /**
   * Fetch organizations
   */
  const fetchOrganizations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const orgs = await lastAppService.getOrganizations();
      setOrganizations(orgs);
      return orgs;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las organizaciones',
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  /**
   * Fetch locations for an organization
   */
  const fetchLocations = useCallback(async (organizationId: string) => {
    setIsLoading(true);
    try {
      const locs = await lastAppService.getLocations(organizationId);
      setLocations(locs);
      return locs;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las ubicaciones',
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Set organization ID
   */
  const setOrganizationId = useCallback((organizationId: string) => {
    lastAppService.setOrganizationId(organizationId);
    setCurrentOrganizationId(organizationId);
    toast({
      title: 'Organización seleccionada',
      description: 'Organización configurada correctamente'
    });
  }, [toast]);

  /**
   * Set location ID
   */
  const setLocationId = useCallback((locationId: string) => {
    lastAppService.setLocationId(locationId);
    setCurrentLocationId(locationId);
    toast({
      title: 'Ubicación seleccionada',
      description: 'Ubicación configurada correctamente'
    });
  }, [toast]);

  /**
   * Test connection (validates token)
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      await lastAppService.getOrganizations();
      toast({
        title: 'Conexión exitosa',
        description: 'El token es válido'
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error de conexión',
        description: error.message || 'Token inválido o expirado',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    // Estados
    isAuthenticated,
    isLoading,
    organizations,
    locations,
    currentOrganizationId,
    currentLocationId,

    // Métodos
    authenticate,
    disconnect,
    fetchOrganizations,
    fetchLocations,
    setOrganizationId,
    setLocationId,
    testConnection
  };
};
