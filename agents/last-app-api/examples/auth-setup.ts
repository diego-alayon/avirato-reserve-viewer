/**
 * Last.app API - Authentication Setup Example
 *
 * This example demonstrates how to:
 * 1. Set up authentication with Last.app
 * 2. Store credentials securely
 * 3. Handle authentication errors
 * 4. Verify connection
 */

import { LastAppService, type LastAppCredentials } from '../services/lastapp';

// Initialize service
const lastAppService = new LastAppService();

/**
 * Method 1: Authenticate with environment variables
 */
async function authenticateWithEnvVars() {
  try {
    const credentials: LastAppCredentials = {
      token: process.env.VITE_LASTAPP_TOKEN!,
      organizationId: process.env.VITE_LASTAPP_ORGANIZATION_ID,
      locationId: process.env.VITE_LASTAPP_LOCATION_ID
    };

    await lastAppService.authenticate(credentials);
    console.log('✅ Autenticación exitosa con variables de entorno');

    return true;
  } catch (error) {
    console.error('❌ Error de autenticación:', error.message);
    return false;
  }
}

/**
 * Method 2: Authenticate with user input (React form)
 */
async function authenticateWithUserInput(
  token: string,
  organizationId?: string,
  locationId?: string
) {
  try {
    await lastAppService.authenticate({
      token: token.trim(),
      organizationId,
      locationId
    });

    console.log('✅ Autenticación exitosa');

    // Optionally persist to localStorage
    localStorage.setItem('lastapp_authenticated', 'true');

    return true;
  } catch (error) {
    console.error('❌ Autenticación fallida:', error.message);
    return false;
  }
}

/**
 * Verify connection and fetch organizations
 */
async function verifyConnection() {
  try {
    if (!lastAppService.isAuthenticated()) {
      throw new Error('No autenticado. Llama a authenticate() primero.');
    }

    // Test connection by fetching organizations
    const organizations = await lastAppService.getOrganizations();

    console.log(`\n✅ Conexión verificada`);
    console.log(`📊 Organizaciones encontradas: ${organizations.length}\n`);

    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Currency: ${org.currency}`);
      console.log(`   Timezone: ${org.timezone}`);
      console.log('');
    });

    return organizations;
  } catch (error) {
    console.error('❌ Error verificando conexión:', error.message);
    throw error;
  }
}

/**
 * Get and select location
 */
async function setupLocation(organizationId: string) {
  try {
    const locations = await lastAppService.getLocations(organizationId);

    console.log(`\n📍 Ubicaciones disponibles: ${locations.length}\n`);

    locations.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc.name}`);
      console.log(`   ID: ${loc.id}`);
      console.log(`   Ciudad: ${loc.city}`);
      console.log(`   Teléfono: ${loc.phone}`);
      console.log('');
    });

    // Select first location by default
    const selectedLocation = locations[0];

    if (selectedLocation) {
      console.log(`✅ Ubicación seleccionada: ${selectedLocation.name}`);

      // Get full location details
      const locationDetails = await lastAppService.getLocation(selectedLocation.id);

      console.log(`\n📋 Detalles de ubicación:`);
      console.log(`   Brands: ${locationDetails.brands?.length || 0}`);
      console.log(`   Acepta reservas: ${locationDetails.settings?.accepts_reservations ? 'Sí' : 'No'}`);
      console.log(`   Acepta delivery: ${locationDetails.settings?.accepts_delivery ? 'Sí' : 'No'}`);
      console.log(`   Acepta takeaway: ${locationDetails.settings?.accepts_takeaway ? 'Sí' : 'No'}`);
    }

    return selectedLocation;
  } catch (error) {
    console.error('❌ Error configurando ubicación:', error.message);
    throw error;
  }
}

/**
 * Complete setup flow
 */
async function completeSetup() {
  console.log('🚀 Iniciando configuración de Last.app API\n');
  console.log('=' .repeat(50));

  // Step 1: Authenticate
  console.log('\n📝 Paso 1: Autenticación');
  const authenticated = await authenticateWithEnvVars();

  if (!authenticated) {
    console.error('\n❌ Configuración fallida: No se pudo autenticar\n');
    return;
  }

  // Step 2: Verify connection
  console.log('\n📝 Paso 2: Verificando conexión');
  const organizations = await verifyConnection();

  if (organizations.length === 0) {
    console.error('\n❌ No se encontraron organizaciones\n');
    return;
  }

  // Step 3: Setup location
  console.log('\n📝 Paso 3: Configurando ubicación');
  await setupLocation(organizations[0].id);

  console.log('\n' + '='.repeat(50));
  console.log('✅ Configuración completada exitosamente\n');
}

/**
 * Handle authentication in React component
 */
export function useLastAppAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await lastAppService.authenticate({ token });
      setIsAuthenticated(true);

      // Verify by fetching organizations
      await lastAppService.getOrganizations();

      return true;
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    lastAppService.clearToken();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Check if already authenticated (from localStorage)
    setIsAuthenticated(lastAppService.isAuthenticated());
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    logout
  };
}

// Run if executed directly
if (require.main === module) {
  completeSetup().catch(console.error);
}

export {
  authenticateWithEnvVars,
  authenticateWithUserInput,
  verifyConnection,
  setupLocation,
  completeSetup
};
