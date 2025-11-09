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
  // Campo para el nombre del tipo de espacio/villa (tipología)
  space_type_name?: string;
  // Campo para los extras contratados (texto formateado)
  extras_text?: string;
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

export interface AviratoSpace {
  space_id: number;
  space_name: string;
  space_type_id: number;
  space_subtype_id: number;
  status: string;
  online: number;
}

export interface AviratoSpaceSubtype {
  space_subtype_id: number;
  space_type_id: number;
  space_subtype_name: string;
  maximum_capacity: number;
  maximum_adults: number;
  standard_capacity: number;
  spaces: AviratoSpace[];
}

export interface AviratoSpaceType {
  space_type_id: number;
  hotel_id: number;
  name: string;
  space_subtypes: AviratoSpaceSubtype[];
}

export interface AviratoSpaceTypesResponse {
  status: string;
  data: AviratoSpaceType[];
}

export interface AviratoExtra {
  extra_id: number;
  name: string;
  price: number;
  active: number;
}

export interface AviratoExtrasResponse {
  status: string;
  data: AviratoExtra[];
}

export interface AviratoReservationExtra {
  extra_id: number;
  quantity: number;
}

export interface AviratoReservationExtrasResponse {
  status: string;
  data: AviratoReservationExtra[];
}

// Use proxy in development to avoid CORS issues
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://apiv3.avirato.com';

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

    const webCodes = this.getWebCodes();
    if (webCodes.length === 0) {
      throw new Error('No web codes available. Please authenticate again.');
    }

    const webCode = webCodes[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const adjustedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const adjustedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);

    const startDateStr = adjustedStart.toISOString().split('T')[0];
    const endDateStr = adjustedEnd.toISOString().split('T')[0];

    console.log('=== FETCHING RESERVATIONS ===');
    console.log('Date range:', { startDateStr, endDateStr });

    const allReservationsData: AviratoReservation[][] = [];
    let hasNextPage = true;
    let cursor: string | undefined;
    let pageCount = 0;

    while (hasNextPage && pageCount < 10) {
      const params = new URLSearchParams({
        web_code: webCode.toString(),
        start_date: startDateStr,
        end_date: endDateStr,
        charges: 'true',  // Necesario para obtener extras
        take: '50'  // Reducido para evitar timeout
      });

      if (cursor) {
        params.append('cursor', cursor);
      }

      const url = `${API_BASE_URL}/v3/reservation/dates?${params}`;
      console.log(`Fetching page ${pageCount + 1}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            this.clearToken();
            throw new Error('Token expired. Please authenticate again.');
          }
          throw new Error(`Failed to fetch reservations: ${response.statusText}`);
        }

        const pageData: AviratoReservationsResponse = await response.json();

        if (pageData.status === 'success' && pageData.data) {
          allReservationsData.push(...pageData.data);
          hasNextPage = pageData.meta?.hasNextPage || false;
          cursor = pageData.meta?.cursor;
          console.log(`Page ${pageCount + 1} fetched: ${pageData.data.flat().length} reservations`);
        } else {
          hasNextPage = false;
        }

        pageCount++;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error('Request timed out after 60 seconds');
          throw new Error('La petición tardó demasiado. Intenta con un rango de fechas más pequeño.');
        }
        throw error;
      }
    }

    const allReservations = allReservationsData.flat();
    console.log(`Total reservations fetched: ${allReservations.length}`);

    const consolidatedResponse: AviratoReservationsResponse = {
      status: 'success',
      data: [allReservations],
      meta: {
        take: 100,
        itemCount: allReservations.length,
        itemRemaining: 0,
        hasNextPage: false,
        cursor: ''
      }
    };

    // Enrichment with space types (villa categories) and basic data
    if (consolidatedResponse.status === 'success') {
      const allReservations = consolidatedResponse.data.flat();
      console.log('Enriching reservations with basic data and space type names');

      const operatorMap = new Map<number, string>([
        [-1, "Motor de reservas"],
        [0, "Todos los operadores"],
        [1, "Channel Manager Booking.com"],
        [28, "Channel Manager Google"],
        [1003, "Travelzoo"]
      ]);

      // Fetch space subtypes (villa typologies: VILLA PREMIUM, VILLA PREMIUM DELUXE, etc.)
      // The structure is: space_types[] -> space_subtypes[] -> space_subtype_name
      let spaceSubtypeMap = new Map<number, string>();
      try {
        const spaceTypesResponse = await this.getSpaceTypes(webCode);
        console.log('=== SPACE TYPES RESPONSE RECEIVED ===');
        console.log('Status:', spaceTypesResponse.status);
        console.log('Total space types:', spaceTypesResponse.data?.length || 0);

        if (spaceTypesResponse.status === 'success' && spaceTypesResponse.data) {
          // Iterate through space types
          for (const spaceType of spaceTypesResponse.data) {
            console.log(`Processing space_type: ${spaceType.name} (ID: ${spaceType.space_type_id})`);

            // Iterate through space subtypes (these are the villa typologies)
            if (spaceType.space_subtypes) {
              for (const subtype of spaceType.space_subtypes) {
                spaceSubtypeMap.set(subtype.space_subtype_id, subtype.space_subtype_name);
                console.log(`  Subtype mapping: ID ${subtype.space_subtype_id} -> "${subtype.space_subtype_name}"`);
              }
            }
          }

          console.log('=== SPACE SUBTYPE MAP CREATED ===');
          console.log('Map size:', spaceSubtypeMap.size);
          console.log('All mappings:', Array.from(spaceSubtypeMap.entries()));
        }
      } catch (error) {
        console.error('ERROR fetching space types:', error);
      }

      // Fetch extras catalog
      let extrasMap = new Map<number, string>();
      try {
        const extras = await this.getExtras(webCode);
        console.log('=== EXTRAS CATALOG ===');
        console.log('Total extras available:', extras.length);
        for (const extra of extras) {
          extrasMap.set(extra.extra_id, extra.name);
          console.log(`Extra ID ${extra.extra_id}: "${extra.name}"`);
        }
      } catch (error) {
        console.warn('Could not fetch extras catalog:', error);
      }

      console.log('=== PROCESSING RESERVATIONS ===');
      for (const reservation of allReservations) {
        reservation.regime_name = reservation.regime;

        const operatorId = reservation.operator_id || reservation.operatorId;
        reservation.operator_name = operatorMap.get(operatorId) || `Operador ${operatorId}`;

        // Add space subtype name (villa typology) based on space_subtype_id
        const spaceSubtypeId = reservation.space_subtype_id || reservation.spaceSubtypeId;
        const mappedName = spaceSubtypeMap.get(spaceSubtypeId);
        reservation.space_type_name = mappedName || `Tipo ${spaceSubtypeId}`;

        // Process extras from charges and predefinedCharges
        const extrasFound: string[] = [];

        // Check charges array
        if (reservation.charges && Array.isArray(reservation.charges)) {
          for (const charge of reservation.charges) {
            if (charge.extra_id && extrasMap.has(charge.extra_id)) {
              const extraName = extrasMap.get(charge.extra_id);
              const quantity = charge.quantity || 1;
              if (extraName) {
                const formatted = quantity > 1 ? `${extraName} (x${quantity})` : extraName;
                extrasFound.push(formatted);
              }
            }
          }
        }

        // Check predefinedCharges array
        if (reservation.predefinedCharges && Array.isArray(reservation.predefinedCharges)) {
          for (const charge of reservation.predefinedCharges) {
            if (charge.extra_id && extrasMap.has(charge.extra_id)) {
              const extraName = extrasMap.get(charge.extra_id);
              const quantity = charge.quantity || 1;
              if (extraName) {
                const formatted = quantity > 1 ? `${extraName} (x${quantity})` : extraName;
                // Avoid duplicates
                if (!extrasFound.includes(formatted)) {
                  extrasFound.push(formatted);
                }
              }
            }
          }
        }

        reservation.extras_text = extrasFound.length > 0
          ? extrasFound.join(', ')
          : 'No tiene extras contratados';

        reservation.billing_total = 0;
        reservation.is_fully_paid = true;
      }

      console.log(`Processed ${allReservations.length} reservations with extras information`);
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

  async getExtras(webCode: number): Promise<AviratoExtra[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const params = new URLSearchParams({
      web_code: webCode.toString(),
    });

    const url = `${API_BASE_URL}/v3/extra?${params}`;
    console.log('=== FETCHING EXTRAS CATALOG ===');
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
      console.warn(`Failed to fetch extras: ${response.statusText}`);
      return [];
    }

    const extrasResponse: AviratoExtrasResponse = await response.json();
    console.log('Extras fetched:', extrasResponse.data?.length || 0);
    return extrasResponse.status === 'success' ? extrasResponse.data : [];
  }

  async getReservationExtras(reservationId: number, webCode: number): Promise<AviratoReservationExtra[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const params = new URLSearchParams({
      web_code: webCode.toString(),
      reservation_id: reservationId.toString(),
    });

    const url = `${API_BASE_URL}/v3/extra?${params}`;

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
        return [];
      }
      console.warn(`Failed to fetch extras for reservation ${reservationId}`);
      return [];
    }

    const extrasResponse: AviratoReservationExtrasResponse = await response.json();
    return extrasResponse.status === 'success' ? extrasResponse.data : [];
  }

  async getSpaceTypes(webCode: number): Promise<AviratoSpaceTypesResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const params = new URLSearchParams({
      web_code: webCode.toString(),
    });

    // Correct endpoint is /v3/space
    const url = `${API_BASE_URL}/v3/space?${params}`;
    console.log('=== FETCHING SPACES (with subtypes) ===');
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
      const errorText = await response.text();
      console.error(`Failed to fetch spaces: ${response.statusText}`, errorText);
      return { status: 'error', data: [] };
    }

    const spaceTypesResponse: AviratoSpaceTypesResponse = await response.json();
    console.log('Raw API response received successfully');
    console.log('Number of space types:', spaceTypesResponse.data?.length || 0);
    return spaceTypesResponse;
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