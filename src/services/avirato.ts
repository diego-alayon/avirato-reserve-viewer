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
    console.log('Attempting authentication with:', { email: credentials.email, url: `${API_BASE_URL}/v3/token/login` });
    
    const response = await fetch(`${API_BASE_URL}/v3/token/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Authentication response status:', response.status);
    console.log('Authentication response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Authentication failed. Response body:', errorText);
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

    console.log('=== RESERVATION FETCH DEBUG ===');
    console.log('Original dates:', { startDate, endDate });
    console.log('Adjusted dates:', { adjustedStart, adjustedEnd });
    console.log('Date strings for API:', { startDateStr, endDateStr });
    console.log('Fetching reservations with web_code:', webCode);

    // Intentar con diferentes parámetros para obtener TODAS las reservas
    const params = new URLSearchParams({
      web_code: webCode.toString(),
      start_date: startDateStr,
      end_date: endDateStr,
      charges: 'false',
      take: '1000'  // Aumentar el límite
    });

    const url = `${API_BASE_URL}/v3/reservation/dates?${params}`;
    console.log('Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Reservations response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch reservations. Response body:', errorText);
      
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Token expired. Please authenticate again.');
      }
      throw new Error(`Failed to fetch reservations: ${response.statusText} - ${errorText}`);
    }

    const reservationsData: AviratoReservationsResponse = await response.json();
    console.log('=== API RESPONSE DEBUG ===');
    console.log('API Response status:', reservationsData.status);
    console.log('API Response meta:', reservationsData.meta);
    console.log('Raw data structure:', typeof reservationsData.data, Array.isArray(reservationsData.data));
    console.log('Raw reservations data length:', reservationsData.data?.length || 0);
    
    if (reservationsData.data && reservationsData.data.length > 0) {
      console.log('First group length:', reservationsData.data[0]?.length || 0);
      console.log('Sample from first group:', reservationsData.data[0]?.slice(0, 2));
    }
    
    // Enriquecer reservas con datos de facturación y regímenes
    if (reservationsData.status === 'success') {
      const allReservations = reservationsData.data.flat();
      console.log('Total reservations after flattening:', allReservations.length);
      console.log('Sample reservation IDs:', allReservations.slice(0, 5).map(r => r.reservationId));
      
      // Obtener regímenes una sola vez (opcional, si falla continúa sin nombres)
      let regimeMap = new Map<string, string>();
      try {
        const regimes = await this.getRegimes(webCode);
        regimeMap = new Map(regimes.map(r => [r.regime_id, r.name]));
      } catch (error) {
        console.warn('Could not fetch regimes, will use regime codes instead:', error);
      }
      
      // Obtener operadores una sola vez (opcional, si falla continúa sin nombres)
      let operatorMap = new Map<number, string>();
      try {
        const operators = await this.getOperators(webCode);
        operatorMap = new Map(operators.map(op => [op.id, op.name]));
      } catch (error) {
        console.warn('Could not fetch operators, will use operator IDs instead:', error);
      }
      
      // Obtener datos de facturación para cada reserva
      for (const reservation of allReservations) {
        // Agregar nombre del régimen
        reservation.regime_name = regimeMap.get(reservation.regime) || reservation.regime;
        
        // Agregar nombre del operador/canal
        reservation.operator_name = operatorMap.get(reservation.operator_id) || `Operador ${reservation.operator_id}`;
        
        try {
          const billingData = await this.getBillingForReservation(reservation.reservation_id, webCode);
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
      }
    }

    return reservationsData;
  }

  async getBillingForReservation(reservationId: number, webCode: number): Promise<AviratoBillingData[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const params = new URLSearchParams({
      web_code: webCode.toString(),
      reservation_id: reservationId.toString(),
    });

    const url = `${API_BASE_URL}/v3/bill?${params}`;
    
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

    const url = `${API_BASE_URL}/v3/regime`;
    
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