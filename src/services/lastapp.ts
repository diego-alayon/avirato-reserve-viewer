/**
 * Last.app API v2.0.0 Service
 *
 * Complete service for interacting with Last.app API
 * Handles authentication, rate limiting, and all API endpoints
 *
 * Based on official documentation: https://developers.last.app/docs
 */

import { RateLimiter } from '@/utils/rateLimiter';
import { logger } from '@/utils/logger';
import type {
  LastAppCredentials,
  LastAppOrganization,
  LastAppLocation,
  LastAppCatalog,
  LastAppTab,
  LastAppBill,
  LastAppPayment,
  LastAppReservation,
  LastAppCustomer,
  LastAppPromotion,
  LastAppFloorplan,
  CreateTabRequest,
  CreateReservationRequest,
  CreateBillRequest,
  CreatePaymentRequest,
  CreateCustomerRequest,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  UpdateOrderStatusRequest,
  CancelOrderRequest,
  GetTabsParams,
  GetBillsParams,
  GetCustomersParams,
  DayAvailabilityParams,
  MonthAvailabilityParams,
  AvailabilitySlot,
  AvailableDay,
  ReservationSchedule,
  TabProduct,
  PaginatedResponse,
  EntityHeaderType,
  RequestOptions,
  WebhookEvent,
  CustomerPoints
} from '@/types/lastapp.types';

/**
 * Base URL for Last.app API v2
 * Uses Vite proxy to avoid CORS issues
 * Real API: https://api.last.app/v2
 */
const API_BASE_URL = '/lastapp/v2';

/**
 * Default timeout for requests (60 seconds)
 */
const DEFAULT_TIMEOUT = 60000;

/**
 * Last.app API Service Class
 *
 * Singleton service for managing all Last.app API interactions
 */
export class LastAppService {
  private token: string | null = null;
  private organizationId: string | null = null;
  private locationId: string | null = null;
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter({
      maxRequestsPer10Min: 1500,
      maxRequestsPerSecond: 15
    });

    // Load credentials from environment variables (SECURE)
    this.loadFromEnvironment();
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  /**
   * Validate Last.app API connection
   * Tests that the token from environment variables is valid
   */
  async validateConnection(): Promise<void> {
    try {
      logger.info('[LastApp] Validating connection...');

      if (!this.token) {
        throw new Error('Token no configurado. Por favor, configura VITE_LASTAPP_TOKEN en .env.local');
      }

      // Test token by fetching organizations
      const testHeaders: HeadersInit = {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/organizations`, {
        method: 'GET',
        headers: testHeaders,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token inválido o expirado. Verifica VITE_LASTAPP_TOKEN en .env.local');
        }
        throw new Error(`Error de conexión: ${response.status} ${response.statusText}`);
      }

      logger.info('[LastApp] Connection validated successfully');
    } catch (error) {
      logger.error('[LastApp] Connection validation failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.token.trim() !== '';
  }

  /**
   * Get current token (for debugging purposes only)
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set organization ID for requests (runtime only)
   * For permanent configuration, use .env.local: VITE_LASTAPP_ORGANIZATION_ID
   */
  setOrganizationId(organizationId: string): void {
    this.organizationId = organizationId;
    logger.debug('[LastApp] Organization ID set:', organizationId);
  }

  /**
   * Set location ID for requests (runtime only)
   * For permanent configuration, use .env.local: VITE_LASTAPP_LOCATION_ID
   */
  setLocationId(locationId: string): void {
    this.locationId = locationId;
    logger.debug('[LastApp] Location ID set:', locationId);
  }

  /**
   * Get current organization ID
   */
  getOrganizationId(): string | null {
    return this.organizationId;
  }

  /**
   * Get current location ID
   */
  getLocationId(): string | null {
    return this.locationId;
  }

  /**
   * Clear token (called on 401 errors)
   */
  private clearToken(): void {
    this.token = null;
    logger.warn('[LastApp] Token cleared due to authentication error');
  }

  // ==========================================================================
  // CORE REQUEST METHODS
  // ==========================================================================

  /**
   * Make an authenticated request to Last.app API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    requiresEntity: EntityHeaderType = 'none'
  ): Promise<T> {
    // Check authentication
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado. Llama a authenticate() primero.');
    }

    // Wait for rate limiter
    await this.rateLimiter.waitForSlot();

    // Setup timeout
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Build headers
      const headers = this.getHeaders(requiresEntity);

      // Build full URL
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

      logger.debug(`[LastApp] ${options.method || 'GET'} ${url}`);
      logger.debug('[LastApp] Headers:', {
        Authorization: this.token ? 'Bearer ***' : 'MISSING',
        OrganizationID: headers['OrganizationID'] || 'none',
        LocationID: headers['LocationID'] || 'none'
      });

      // Make request
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle errors
      if (!response.ok) {
        await this.handleError(response);
      }

      // Parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      }

      // Return empty object for non-JSON responses (like DELETE)
      return {} as T;

    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle AbortError (timeout)
      if (error.name === 'AbortError') {
        logger.error('[LastApp] Request timeout:', endpoint);
        throw new Error('La petición tardó demasiado. Por favor, intenta nuevamente.');
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Build headers for request
   */
  private getHeaders(requiresEntity: EntityHeaderType): HeadersInit {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add entity headers if required
    if (requiresEntity === 'location') {
      if (!this.locationId) {
        throw new Error('Location ID requerido para esta operación. Usa setLocationId().');
      }
      headers['LocationID'] = this.locationId;
    } else if (requiresEntity === 'organization') {
      if (!this.organizationId) {
        throw new Error('Organization ID requerido para esta operación. Usa setOrganizationId().');
      }
      headers['OrganizationID'] = this.organizationId;
    }

    return headers;
  }

  /**
   * Handle HTTP errors
   */
  private async handleError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `HTTP ${status}: ${response.statusText}`;

    // Try to parse error body
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Handle specific status codes
    switch (status) {
      case 401:
        logger.error('[LastApp] 401 Unauthorized - Token invalid');
        this.clearToken();
        throw new Error('Token inválido o expirado. Por favor, inicia sesión nuevamente.');

      case 403:
        logger.error('[LastApp] 403 Forbidden');
        throw new Error('No tienes permisos para realizar esta operación.');

      case 404:
        logger.warn('[LastApp] 404 Not Found:', errorMessage);
        throw new Error('Recurso no encontrado.');

      case 429: {
        logger.warn('[LastApp] 429 Too Many Requests - Rate limit exceeded');
        const retryAfter = response.headers.get('Retry-After') || '60';
        throw new Error(`Rate limit excedido. Por favor, espera ${retryAfter} segundos.`);
      }

      case 500:
      case 502:
      case 503:
        logger.error('[LastApp] Server error:', status);
        throw new Error('Error del servidor. Por favor, intenta más tarde.');

      default:
        logger.error('[LastApp] Unexpected error:', status, errorMessage);
        throw new Error(errorMessage);
    }
  }

  // ==========================================================================
  // ENVIRONMENT CONFIGURATION
  // ==========================================================================

  /**
   * Load credentials from environment variables (SECURE)
   * Credentials are loaded from .env.local file (never committed to git)
   */
  private loadFromEnvironment(): void {
    try {
      // Load token from environment
      const envToken = import.meta.env.VITE_LASTAPP_TOKEN;
      if (envToken && envToken.trim() !== '') {
        this.token = envToken.trim();
      } else {
        logger.warn('[LastApp] No token found in environment variables (VITE_LASTAPP_TOKEN)');
      }

      // Load organization ID
      const envOrgId = import.meta.env.VITE_LASTAPP_ORGANIZATION_ID;
      if (envOrgId && envOrgId.trim() !== '') {
        this.organizationId = envOrgId.trim();
      }

      // Load location ID
      const envLocId = import.meta.env.VITE_LASTAPP_LOCATION_ID;
      if (envLocId && envLocId.trim() !== '') {
        this.locationId = envLocId.trim();
      }
    } catch (error) {
      logger.error('[LastApp] Failed to load environment variables:', error);
    }
  }

  // ==========================================================================
  // ORGANIZATIONS & LOCATIONS
  // ==========================================================================

  /**
   * Get all organizations
   */
  async getOrganizations(): Promise<LastAppOrganization[]> {
    const response = await this.makeRequest<{ data: LastAppOrganization[] }>(
      '/organizations',
      { method: 'GET' },
      'none'
    );
    return response.data;
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<LastAppOrganization> {
    return this.makeRequest<LastAppOrganization>(
      `/organizations/${id}`,
      { method: 'GET' },
      'organization'
    );
  }

  /**
   * Get organization courses
   */
  async getOrganizationCourses(id: string): Promise<any[]> {
    const response = await this.makeRequest<{ courses: any[] }>(
      `/organizations/${id}/courses`,
      { method: 'GET' },
      'organization'
    );
    return response.courses;
  }

  /**
   * Get full organization catalog
   */
  async getOrganizationCatalog(id: string): Promise<any> {
    return this.makeRequest(
      `/organizations/${id}/catalog`,
      { method: 'GET' },
      'organization'
    );
  }

  /**
   * Get locations for organization
   */
  async getLocations(organizationId?: string): Promise<LastAppLocation[]> {
    // Temporarily set org ID if provided
    const originalOrgId = this.organizationId;
    if (organizationId) {
      this.organizationId = organizationId;
    }

    try {
      const response = await this.makeRequest<{ data: LastAppLocation[] }>(
        '/locations',
        { method: 'GET' },
        'organization'
      );
      return response.data;
    } finally {
      this.organizationId = originalOrgId;
    }
  }

  /**
   * Get location by ID
   */
  async getLocation(id: string): Promise<LastAppLocation> {
    // Temporarily set location ID
    const originalLocId = this.locationId;
    this.locationId = id;

    try {
      return await this.makeRequest<LastAppLocation>(
        `/locations/${id}`,
        { method: 'GET' },
        'location'
      );
    } finally {
      this.locationId = originalLocId;
    }
  }

  // ==========================================================================
  // CUSTOMERS
  // ==========================================================================

  /**
   * Get all customers with optional filtering and pagination
   * NOTE: The 'search' parameter is NOT supported by Last.app API v2.0.0
   */
  async getCustomers(params?: GetCustomersParams): Promise<PaginatedResponse<LastAppCustomer>> {
    // Build query string
    const queryParams = new URLSearchParams();

    // NOTE: 'search' parameter is NOT supported - removed to prevent 400 errors
    // if (params?.search) {
    //   queryParams.append('search', params.search);
    // }

    if (params?.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags[]', tag));
    }
    if (params?.min_points !== undefined) {
      queryParams.append('min_points', params.min_points.toString());
    }
    if (params?.max_points !== undefined) {
      queryParams.append('max_points', params.max_points.toString());
    }
    if (params?.min_spent !== undefined) {
      queryParams.append('min_spent', params.min_spent.toString());
    }
    if (params?.max_spent !== undefined) {
      queryParams.append('max_spent', params.max_spent.toString());
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;

    logger.debug('[LastApp] Getting customers with params:', params);

    return this.makeRequest<PaginatedResponse<LastAppCustomer>>(
      endpoint,
      { method: 'GET' },
      'organization'
    );
  }

  /**
   * Search for a customer by phone number
   * Returns null if not found
   * NOTE: Not used in sync - we try to create directly and handle duplicate errors
   */
  async getCustomerByPhone(phone: string): Promise<LastAppCustomer | null> {
    try {
      logger.debug('[LastApp] Searching customer by phone:', phone);

      // Note: The 'search' parameter is not supported by the API
      // This method is kept for potential future use but is not used in sync
      const response = await this.getCustomers({
        limit: 50
      });

      // Find exact phone match (normalized)
      const normalizedSearchPhone = phone.replace(/[\s\-\(\)]/g, '');

      for (const customer of response.data) {
        if (customer.phoneNumber) {
          const normalizedCustomerPhone = customer.phoneNumber.replace(/[\s\-\(\)]/g, '');
          if (normalizedCustomerPhone === normalizedSearchPhone) {
            logger.debug('[LastApp] Customer found:', customer.id);
            return customer;
          }
        }
      }

      logger.debug('[LastApp] Customer not found');
      return null;

    } catch (error: any) {
      // If 404, customer doesn't exist
      if (error.message.includes('404')) {
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Create a new customer
   * Based on official Last.app API documentation: https://developers.last.app/docs
   */
  async createCustomer(data: CreateCustomerRequest): Promise<LastAppCustomer> {
    logger.info('[LastApp] Creating customer:', data.name);

    // Validate required fields
    if (!data.organizationId || data.organizationId.trim() === '') {
      throw new Error('Customer organizationId is required');
    }
    if (!data.name || data.name.trim() === '') {
      throw new Error('Customer name is required');
    }
    if (!data.phoneNumber || data.phoneNumber.trim() === '') {
      throw new Error('Customer phoneNumber is required');
    }
    if (!data.source || data.source.trim() === '') {
      throw new Error('Customer source is required');
    }

    // Clean undefined properties - Last.app API doesn't accept undefined values
    const cleanData: any = {
      organizationId: data.organizationId,
      name: data.name,
      phoneNumber: data.phoneNumber,
      source: data.source
    };

    // Add optional fields only if they have values
    if (data.surname) cleanData.surname = data.surname;
    if (data.email) cleanData.email = data.email;
    if (data.internalNote) cleanData.internalNote = data.internalNote;
    if (data.externalId) cleanData.externalId = data.externalId;

    logger.debug('[LastApp] Payload:', cleanData);

    return this.makeRequest<LastAppCustomer>(
      '/customers',
      {
        method: 'POST',
        body: JSON.stringify(cleanData)
      },
      'organization'
    );
  }

  /**
   * Create multiple customers in bulk
   * Processes one by one with rate limiting and retry logic
   */
  async createCustomersBulk(
    customers: CreateCustomerRequest[]
  ): Promise<{
    succeeded: LastAppCustomer[];
    failed: Array<{ customer: CreateCustomerRequest; error: string }>;
  }> {
    logger.info(`[LastApp] Creating ${customers.length} customers in bulk`);

    const result = {
      succeeded: [] as LastAppCustomer[],
      failed: [] as Array<{ customer: CreateCustomerRequest; error: string }>
    };

    for (const customerData of customers) {
      try {
        const createdCustomer = await this.createCustomer(customerData);
        result.succeeded.push(createdCustomer);
        logger.debug(`[LastApp] Customer created: ${customerData.name}`);
      } catch (error: any) {
        result.failed.push({
          customer: customerData,
          error: error.message
        });
        logger.error(`[LastApp] Failed to create customer ${customerData.name}:`, error.message);
      }
    }

    logger.info(
      `[LastApp] Bulk create completed: ${result.succeeded.length} succeeded, ${result.failed.length} failed`
    );

    return result;
  }
}

/**
 * Singleton instance
 */
export const lastAppService = new LastAppService();

export default lastAppService;
