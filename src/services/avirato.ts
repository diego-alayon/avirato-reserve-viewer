import { logger } from '@/utils/logger';

export interface AviratoCredentials {
  email: string;
  password: string;
}

export interface AviratoAuthResponse {
  status: string;
  data: {
    token: string;
    web_codes: number[];
    expiry: string;
  };
}

export interface AviratoClient {
  client_doc: string;
  name: string;
  surname: string;
  state: string;
  country: string;
  city: string;
  address: string;
  zip_code: string;
  email: string;
  phone: string;
  observations: string;
  business: boolean;
  vip: boolean;
  birth_date: string;
}

export interface AviratoBillingData {
  billId: number;
  billNumber: string;
  reservationId: number;
  total: number;
  cash: number;
  card: number;
  wireTransfer: number;
  chargeToTap: number;
  anotherPaymentMethod: number;
  type: string;
  base: number;
  vat: number;
  discount: number;
}

export interface AviratoBillingResponse {
  status: string;
  data: AviratoBillingData[];
  meta: {
    take: number;
    itemCount: number;
    itemRemaining: number;
    hasNextPage: boolean;
    cursor: string;
  };
}

export interface AviratoReservation {
  reservation_id: number;
  reservationId: number;
  rate_id: number;
  rateId: number;
  promotional_code: string;
  promotionalCode: string;
  promotional_package: any[];
  promotionalPackage: any;
  space_id: number;
  spaceId: number;
  space_type_id: number;
  spaceTypeId: number;
  space_subtype_id: number;
  spaceSubtypeId: number;
  price: number;
  client_id: string;
  clientId: string;
  client_name: string;
  clientName: string;
  check_in_date: string;
  checkInDate: string;
  check_out_date: string;
  checkOutDate: string;
  regime: string;
  regime_name?: string;
  adults: number;
  children: number;
  additional_beds: number;
  additionalBeds: number;
  status: string;
  advance: number;
  advance_type: number;
  advanceType: number;
  operator_id: number;
  operatorId: number;
  operator_reservation_id: string;
  operatorReservationId: string;
  origin: string;
  is_paid: boolean;
  isPaid: boolean;
  observations: string;
  master_reservation_id: number;
  masterReservationId: number;
  created_at: string;
  createdAt: string;
  updatedAt?: string;
  guests: any[];
  client: AviratoClient;
  charges: any[];
  predefinedCharges: any[];
  // Nuevos campos para facturación
  billing_total?: number;
  is_fully_paid?: boolean;
  // Campo para el nombre del operador/canal
  operator_name?: string;
}

export interface AviratoReservationsResponse {
  status: string;
  data: AviratoReservation[][];
  meta: {
    take: number;
    itemCount: number;
    itemRemaining: number;
    hasNextPage: boolean;
    cursor: string;
  };
}

export interface AviratoRegime {
  active_regime_id: number;
  regime_id: string;
  name: string;
  active: number;
}

export interface AviratoRegimesResponse {
  status: string;
  data: AviratoRegime[];
}

export interface AviratoOperator {
  id: number;
  name: string;
}

export interface AviratoOperatorsResponse {
  status: string;
  data: AviratoOperator[];
}

const API_BASE_URL = 'https://apiv3.avirato.com';

export class AviratoService {
  private token: string | null = null;
  private webCodes: number[] = [];
  private tokenExpiry: Date | null = null;

  async authenticate(credentials: AviratoCredentials): Promise<AviratoAuthResponse> {
    logger.debug('Starting authentication process');
    
    const response = await fetch(`${API_BASE_URL}/v3/token/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    logger.debug('Authentication response received', { status: response.status });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Authentication failed', { status: response.status });
      throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: AviratoAuthResponse = await response.json();
    
    if (data.status === 'success') {
      this.token = data.data.token;
      this.webCodes = data.data.web_codes;
      this.tokenExpiry = new Date(data.data.expiry);
      
      // Store token in localStorage for persistence
      localStorage.setItem('avirato_token', this.token);
      localStorage.setItem('avirato_web_codes', JSON.stringify(this.webCodes));
      localStorage.setItem('avirato_token_expiry', data.data.expiry);
    }

    return data;
  }

  async getReservations(startDate?: Date, endDate?: Date): Promise<AviratoReservationsResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    // Get the web_code from stored data
    const webCodes = this.getWebCodes();
    if (webCodes.length === 0) {
      throw new Error('No web codes available. Please authenticate again.');
    }

    // Use the first web_code
    const webCode = webCodes[0];

    // Use provided dates or default to last 30 days
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Ensure we're working with local dates and extend the end date to cover the full day
    const adjustedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const adjustedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1); // Add 1 day to include end date

    const startDateStr = adjustedStart.toISOString().split('T')[0];
    const endDateStr = adjustedEnd.toISOString().split('T')[0];

    console.log('=== RESERVATION FETCH WITH PAGINATION ===');
    console.log('Original dates:', { startDate, endDate });
    console.log('Adjusted dates:', { adjustedStart, adjustedEnd });
    console.log('Date range:', { startDateStr, endDateStr });
    console.log('Web code:', webCode);
    console.log('Expected reservations in channel manager: 14 (1-2 Aug 2025)');

    // Usar paginación para obtener todas las reservas
    const allReservationsData: AviratoReservation[][] = [];
    let hasNextPage = true;
    let cursor: string | undefined;
    let pageCount = 0;
    let totalItemCount = 0;

    while (hasNextPage) {
      // Configurar parámetros según la documentación de Avirato
      const params = new URLSearchParams({
        web_code: webCode.toString(),
        start_date: startDateStr,
        end_date: endDateStr,
        date_type: 'DEFAULT',
        // Probando sin filtro de status para obtener todas las reservas
        // status: 'ACTIVAS',
        charges: 'false',
        take: '100'
      });
      
      console.log('=== TESTING WITHOUT STATUS FILTER ===');
      console.log('Parameters being sent:', Object.fromEntries(params));

      // Agregar cursor solo si existe (páginas siguientes)
      if (cursor) {
        params.append('cursor', cursor);
      }

      const url = `${API_BASE_URL}/v3/reservation/dates?${params}`;
      console.log(`=== PAGE ${pageCount + 1} REQUEST ===`);
      console.log('URL completa:', url);
      console.log('Parámetros enviados:', Object.fromEntries(params));
      console.log('Headers enviados:', {
        'Authorization': `Bearer ${this.token?.substring(0, 20)}...`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
      console.log('Cursor:', cursor || 'none (first page)');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch reservations:', errorText);
        
        if (response.status === 401) {
          this.clearToken();
          throw new Error('Token expired. Please authenticate again.');
        }
        throw new Error(`Failed to fetch reservations: ${response.statusText} - ${errorText}`);
      }

      const pageData: AviratoReservationsResponse = await response.json();
      console.log(`=== PAGE ${pageCount + 1} RESPONSE ===`);
      console.log('Status:', pageData.status);
      console.log('Meta completo:', JSON.stringify(pageData.meta, null, 2));
      console.log('Estructura de data:', pageData.data ? `Array de ${pageData.data.length} grupos` : 'Sin data');
      
      // Log detallado de cada grupo de reservas
      if (pageData.data && pageData.data.length > 0) {
        pageData.data.forEach((group, groupIndex) => {
          console.log(`Grupo ${groupIndex + 1}: ${group.length} reservas`);
          group.forEach((reservation, resIndex) => {
            console.log(`  Reserva ${resIndex + 1}:`, {
              id: reservation.reservation_id || reservation.reservationId,
              client: reservation.client_name || reservation.clientName,
              checkIn: reservation.check_in_date || reservation.checkInDate,
              checkOut: reservation.check_out_date || reservation.checkOutDate,
              status: reservation.status,
              operator: reservation.operator_id || reservation.operatorId,
              origin: reservation.origin
            });
          });
        });
      }
      
      if (pageData.status === 'success' && pageData.data) {
        // Contar reservas en esta página
        const reservationsInPage = pageData.data.reduce((sum, group) => sum + group.length, 0);
        console.log('Reservations in this page:', reservationsInPage);
        
        // Agregar los datos de esta página
        allReservationsData.push(...pageData.data);
        
        // Usar el itemCount del meta de la primera página como total real
        if (pageCount === 0) {
          totalItemCount = pageData.meta?.itemCount || 0;
          console.log('Total items available (from first page):', totalItemCount);
        }
        
        // Verificar si hay más páginas según la documentación
        hasNextPage = pageData.meta?.hasNextPage || false;
        cursor = pageData.meta?.cursor;
        
        console.log('Has next page:', hasNextPage);
        if (hasNextPage) {
          console.log('Next cursor:', cursor);
        }
      } else {
        console.error('API returned non-success status or no data:', pageData.status);
        hasNextPage = false;
      }

      pageCount++;
      
      // Seguridad: evitar bucles infinitos
      if (pageCount > 100) {
        console.warn('Maximum page limit reached (100), stopping pagination');
        break;
      }
    }

    console.log(`=== PAGINATION COMPLETE ===`);
    console.log(`Total pages fetched: ${pageCount}`);
    console.log(`Total reservation groups collected: ${allReservationsData.length}`);
    const totalReservations = allReservationsData.reduce((sum, group) => sum + group.length, 0);
    console.log(`Total individual reservations: ${totalReservations}`);
    console.log(`COMPARACIÓN: Esperadas 14 reservas, encontradas ${totalReservations} reservas`);
    console.log(`DISCREPANCIA: ${totalReservations !== 14 ? 'SÍ - Investigar parámetros' : 'NO - OK'}`);
    
    if (totalReservations !== 14) {
      console.log('=== ANÁLISIS DE DISCREPANCIA ===');
      console.log('Posibles causas:');
      console.log('1. Filtro de status demasiado restrictivo');
      console.log('2. Problema con el rango de fechas');
      console.log('3. Web code incorrecto');
      console.log('4. Date type incorrecto');
      console.log('5. Reservas en diferentes estados no incluidos');
    }

    // Crear el objeto de respuesta consolidado según la documentación
    const consolidatedResponse: AviratoReservationsResponse = {
      status: 'success',
      data: allReservationsData,
      meta: {
        take: 100,
        itemCount: totalItemCount, // Usar el total real de la API
        itemRemaining: 0, // Ya hemos obtenido todo
        hasNextPage: false, // Ya no hay más páginas
        cursor: '' // No necesario para el resultado final
      }
    };

    // Enriquecer reservas con datos de facturación y regímenes
    if (consolidatedResponse.status === 'success') {
      const allReservations = consolidatedResponse.data.flat();
      console.log('=== ENRICHING RESERVATIONS ===');
      console.log('Total reservations to enrich:', allReservations.length);
      
      // TEMPORALMENTE DESHABILITADO - Obtener regímenes una sola vez (opcional, si falla continúa sin nombres)
      let regimeMap = new Map<string, string>();
      console.log('SKIPPING regime fetch to avoid 403 errors');
      /*
      try {
        const regimes = await this.getRegimes(webCode);
        regimeMap = new Map(regimes.map(r => [r.regime_id, r.name]));
        console.log('Regimes loaded:', regimeMap.size);
      } catch (error) {
        console.warn('Could not fetch regimes, will use regime codes instead:', error);
      }
      */
      
      // Mapeo manual de operadores específicos del establecimiento
      const operatorMap = new Map<number, string>([
        [-1, "Motor de reservas"], // Cliente Hotel/Web directo
        [0, "Todos los operadores"],
        [1, "Channel Manager Booking.com"],
        [28, "Channel Manager Google"],
        [1003, "Travelzoo"]
      ]);
      
      // Intentar obtener operadores de la API como fallback
      try {
        const operators = await this.getOperators(webCode);
        console.log('Operators loaded from API:', operators.length);
        
        // Agregar operadores de la API al mapeo (sin sobrescribir los específicos)
        operators.forEach(op => {
          if (!operatorMap.has(op.id)) {
            operatorMap.set(op.id, op.name);
          }
        });
        console.log('Total operators available:', operatorMap.size);
      } catch (error) {
        console.warn('Could not fetch operators, will use operator IDs instead:', error);
      }
      
      // Obtener datos de facturación para cada reserva
      console.log('=== PROCESSING RESERVATIONS ===');
      const uniqueOperatorIds = [...new Set(allReservations.map(r => r.operator_id || r.operatorId))];
      console.log('Unique operator IDs found in reservations:', uniqueOperatorIds);
      
      for (const reservation of allReservations) {
        // Agregar nombre del régimen
        reservation.regime_name = regimeMap.get(reservation.regime) || reservation.regime;
        
        // Agregar nombre del operador/canal
        const operatorId = reservation.operator_id || reservation.operatorId;
        reservation.operator_name = operatorMap.get(operatorId) || `Operador ${operatorId}`;
        
        // TEMPORALMENTE DESHABILITADO - Obtener datos de facturación
        console.log('SKIPPING billing fetch to avoid 404 errors');
        /*
        try {
          const reservationId = reservation.reservation_id || reservation.reservationId;
          const billingData = await this.getBillingForReservation(reservationId, webCode);
          if (billingData && billingData.length > 0) {
            // Sumar todos los totales de las facturas de esta reserva
            const totalBilling = billingData.reduce((sum, bill) => sum + bill.total, 0);
            reservation.billing_total = totalBilling;
            reservation.is_fully_paid = totalBilling === 0;
          } else {
            reservation.billing_total = 0;
            reservation.is_fully_paid = true;
          }
        } catch (error) {
          console.warn(`Could not fetch billing for reservation ${reservation.reservation_id}:`, error);
          // Si no se puede obtener la facturación, usar valores por defecto
          reservation.billing_total = 0;
          reservation.is_fully_paid = true;
        }
        */
        
        // Usar valores por defecto sin hacer llamadas a la API
        reservation.billing_total = 0;
        reservation.is_fully_paid = true;
      }
      
      console.log('=== ENRICHMENT COMPLETE ===');
    }

    return consolidatedResponse;
  }

  async getBillingForReservation(reservationId: number, webCode: number): Promise<AviratoBillingData[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const params = new URLSearchParams({
      web_code: webCode.toString(),
      reservation_id: reservationId.toString(),
    });

    // Endpoint correcto según la documentación
    const url = `${API_BASE_URL}/v3/billing?${params}`;
    console.log('=== FETCHING BILLING ===');
    console.log('URL:', url);
    console.log('Reservation ID:', reservationId);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No hay facturas para esta reserva
        return [];
      }
      throw new Error(`Failed to fetch billing: ${response.statusText}`);
    }

    const billingResponse: AviratoBillingResponse = await response.json();
    return billingResponse.status === 'success' ? billingResponse.data : [];
  }

  async getRegimes(webCode: number): Promise<AviratoRegime[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const url = `${API_BASE_URL}/v3/regime?web_code=${webCode}`;
    console.log('=== FETCHING REGIMES ===');
    console.log('URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch regimes: ${response.statusText}`);
    }

    const regimesResponse: AviratoRegimesResponse = await response.json();
    return regimesResponse.status === 'success' ? regimesResponse.data : [];
  }

  async getOperators(webCode: number): Promise<AviratoOperator[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const params = new URLSearchParams({
      web_code: webCode.toString(),
    });

    const url = `${API_BASE_URL}/v3/channel-manager/operators?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch operators: ${response.statusText}`);
    }

    const operatorsResponse: AviratoOperatorsResponse = await response.json();
    return operatorsResponse.status === 'success' ? operatorsResponse.data : [];
  }

  isAuthenticated(): boolean {
    this.loadTokenFromStorage();
    return this.token !== null && this.tokenExpiry !== null && new Date() < this.tokenExpiry;
  }

  private loadTokenFromStorage(): void {
    if (!this.token) {
      this.token = localStorage.getItem('avirato_token');
      const webCodesStr = localStorage.getItem('avirato_web_codes');
      const expiryStr = localStorage.getItem('avirato_token_expiry');
      
      if (webCodesStr) {
        this.webCodes = JSON.parse(webCodesStr);
      }
      
      if (expiryStr) {
        this.tokenExpiry = new Date(expiryStr);
      }
    }
  }

  clearToken(): void {
    this.token = null;
    this.webCodes = [];
    this.tokenExpiry = null;
    localStorage.removeItem('avirato_token');
    localStorage.removeItem('avirato_web_codes');
    localStorage.removeItem('avirato_token_expiry');
  }

  getWebCodes(): number[] {
    this.loadTokenFromStorage();
    return this.webCodes;
  }
}

export const aviratoService = new AviratoService();