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

export interface AviratoRoomBlock {
  id: number;
  space_subtype_id: number;
  space_subtype_name: string;
  operator_id: number;
  operator_name: string;
  rate_id: number;
  rate_name: string;
  date: string;
  block_sales: boolean;
  block_arrivals: boolean;
  block_departures: boolean;
}

export interface AviratoRoomBlocksResponse {
  status: string;
  data: AviratoRoomBlock[];
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

    // Ensure we're working with local dates
    const selectedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const selectedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    console.log('=== RESERVATION LOGIC DEBUG ===');
    console.log('Selected period:', { selectedStart, selectedEnd });
    console.log('Selected period strings:', { 
      start: selectedStart.toISOString().split('T')[0], 
      end: selectedEnd.toISOString().split('T')[0] 
    });

    // ESTRATEGIA: Para obtener TODAS las reservas activas durante el período,
    // necesitamos buscar un rango mucho más amplio porque la API filtra por check-in
    // Una reserva puede haber empezado meses antes pero seguir activa en nuestro período

    // Expandir el rango de búsqueda: 90 días antes del inicio hasta 90 días después del fin
    const searchStart = new Date(selectedStart.getTime() - 90 * 24 * 60 * 60 * 1000);
    const searchEnd = new Date(selectedEnd.getTime() + 90 * 24 * 60 * 60 * 1000);

    console.log('Expanded search period:', { searchStart, searchEnd });
    console.log('Search period strings:', { 
      start: searchStart.toISOString().split('T')[0], 
      end: searchEnd.toISOString().split('T')[0] 
    });

    // Obtener todas las reservas en el rango expandido
    let allRawReservations: any[] = [];
    
    try {
      console.log('=== FETCHING RAW RESERVATIONS ===');
      allRawReservations = await this.fetchReservationsByCheckIn(webCode, searchStart, searchEnd);
      console.log(`Total raw reservations fetched: ${allRawReservations.length}`);
      
      // Log sample of raw data
      if (allRawReservations.length > 0) {
        console.log('Sample raw reservations:');
        allRawReservations.slice(0, 3).forEach((res, index) => {
          console.log(`Sample ${index + 1}:`, {
            id: res.reservationId,
            checkIn: res.checkInDate || res.check_in_date,
            checkOut: res.checkOutDate || res.check_out_date,
            status: res.status
          });
        });
      }
    } catch (error) {
      console.error('Error fetching raw reservations:', error);
      // Return empty result if fetch fails
      return {
        status: 'success',
        data: [[]],
        meta: {
          take: 100,
          itemCount: 0,
          itemRemaining: 0,
          hasNextPage: false,
          cursor: ''
        }
      };
    }

    // FILTRAR: Solo las reservas que están activas durante el período seleccionado
    console.log('=== FILTERING ACTIVE RESERVATIONS ===');
    const activeReservations = allRawReservations.filter(reservation => {
      const checkInDate = new Date(reservation.checkInDate || reservation.check_in_date);
      const checkOutDate = new Date(reservation.checkOutDate || reservation.check_out_date);
      
      // Una reserva está activa durante [selectedStart, selectedEnd] si:
      // check_in <= selectedEnd AND check_out >= selectedStart
      const isActive = checkInDate <= selectedEnd && checkOutDate >= selectedStart;
      
      console.log(`Reservation ${reservation.reservationId}:`, {
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        selectedPeriod: `${selectedStart.toISOString().split('T')[0]} to ${selectedEnd.toISOString().split('T')[0]}`,
        isActive: isActive,
        reason: isActive ? 'ACTIVE in period' : 'NOT active in period'
      });
      
      return isActive;
    });

    console.log(`Filtered active reservations: ${activeReservations.length}`);
    console.log('Active reservation IDs:', activeReservations.map(r => r.reservationId));

    // Enriquecer reservas con datos adicionales
    if (activeReservations.length > 0) {
      console.log('=== ENRICHING RESERVATIONS ===');
      
      // Obtener regímenes una sola vez (opcional, si falla continúa sin nombres)
      let regimeMap = new Map<string, string>();
      try {
        const regimes = await this.getRegimes(webCode);
        regimeMap = new Map(regimes.map(r => [r.regime_id, r.name]));
        console.log('Regimes loaded:', regimeMap.size);
      } catch (error) {
        console.warn('Could not fetch regimes, will use regime codes instead:', error);
      }
      
      // Mapeo manual de operadores específicos del establecimiento
      const operatorMap = new Map<number, string>([
        [-1, "Motor de reservas"], // Cliente Hotel/Web directo
        [0, "Todos los operadores"],
        [1, "Channel Manager Booking.com"],
        [28, "Channel Manager Google"],
        [1003, "Travelzoo"], // Basado en los logs
        // Agregar otros operadores específicos según se identifiquen
      ]);
      
      // Intentar obtener operadores desde room-blocks primero, luego fallback a operators
      try {
        const roomBlocks = await this.getRoomBlocks(webCode, selectedStart, selectedEnd);
        console.log('=== ROOM BLOCKS OPERATORS DEBUG ===');
        console.log('Total room blocks received:', roomBlocks.length);
        
        // Crear mapeo de operadores desde room-blocks (priority mapping)
        const roomBlockOperatorMap = new Map<number, string>();
        roomBlocks.forEach(block => {
          roomBlockOperatorMap.set(block.operator_id, block.operator_name);
        });
        
        console.log('Operators from room blocks:', Array.from(roomBlockOperatorMap.entries()));
        
        // Agregar operadores de room-blocks al mapeo (sobrescribe para mejor precisión)
        roomBlockOperatorMap.forEach((name, id) => {
          operatorMap.set(id, name);
        });
      } catch (error) {
        console.warn('Could not fetch room blocks operators, trying fallback:', error);
        
        // Fallback: intentar obtener operadores de la API tradicional
        try {
          const operators = await this.getOperators(webCode);
          console.log('=== OPERATORS DEBUG ===');
          console.log('Total operators received from API:', operators.length);
          
          // Agregar operadores de la API al mapeo (sin sobrescribir los específicos)
          operators.forEach(op => {
            if (!operatorMap.has(op.id)) {
              operatorMap.set(op.id, op.name);
            }
          });
        } catch (error) {
          console.warn('Could not fetch operators, will use operator IDs instead:', error);
        }
      }
      
      // Obtener datos de facturación y enriquecer cada reserva
      console.log('=== ENRICHING INDIVIDUAL RESERVATIONS ===');
      const uniqueOperatorIds = [...new Set(activeReservations.map(r => r.operator_id || r.operatorId))];
      console.log('Unique operator IDs found in active reservations:', uniqueOperatorIds);
      
      for (let i = 0; i < activeReservations.length; i++) {
        const reservation = activeReservations[i];
        console.log(`Processing reservation ${i + 1}/${activeReservations.length}: ${reservation.reservationId}`);
        
        // Agregar nombre del régimen
        reservation.regime_name = regimeMap.get(reservation.regime) || reservation.regime;
        
        // Agregar nombre del operador/canal
        const operatorId = reservation.operator_id || reservation.operatorId;
        reservation.operator_name = operatorMap.get(operatorId) || `Operador ${operatorId}`;
        console.log(`Reservation ${reservation.reservationId}: operatorId ${operatorId} -> ${reservation.operator_name}`);
        
        // Obtener datos de facturación
        try {
          const reservationId = reservation.reservation_id || reservation.reservationId;
          const billingData = await this.getBillingForReservation(reservationId, webCode);
          if (billingData && billingData.length > 0) {
            const totalBilling = billingData.reduce((sum, bill) => sum + bill.total, 0);
            reservation.billing_total = totalBilling;
            reservation.is_fully_paid = totalBilling === 0;
          } else {
            reservation.billing_total = 0;
            reservation.is_fully_paid = true;
          }
        } catch (error) {
          console.warn(`Could not fetch billing for reservation ${reservation.reservation_id}:`, error);
          reservation.billing_total = 0;
          reservation.is_fully_paid = true;
        }
      }
    }

    console.log('=== FINAL RESULT ===');
    console.log(`Returning ${activeReservations.length} active reservations for period ${selectedStart.toISOString().split('T')[0]} to ${selectedEnd.toISOString().split('T')[0]}`);

    // Retornar en el formato esperado
    return {
      status: 'success',
      data: [activeReservations], // Empaquetar en array como espera la interfaz
      meta: {
        take: 100,
        itemCount: activeReservations.length,
        itemRemaining: 0,
        hasNextPage: false,
        cursor: ''
      }
    };
  }

  private async fetchReservationsByCheckIn(webCode: number, startDate: Date, endDate: Date): Promise<any[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('Fetching reservations with web_code:', webCode);
    console.log('Date strings for API:', { startDateStr, endDateStr });

    // Intentar con diferentes parámetros para obtener TODAS las reservas
    const params = new URLSearchParams({
      web_code: webCode.toString(),
      start_date: startDateStr,
      end_date: endDateStr,
      charges: 'false',
      take: '100'  // API máximo es 100
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
    
    // Retornar las reservas aplanadas
    return reservationsData.status === 'success' ? reservationsData.data.flat() : [];
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

  async getRoomBlocks(webCode: number, startDate?: Date, endDate?: Date): Promise<AviratoRoomBlock[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    // Si no se proporcionan fechas, usar un rango por defecto
    const start = startDate || new Date();
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días hacia adelante

    const params = new URLSearchParams({
      web_code: webCode.toString(),
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });

    const url = `${API_BASE_URL}/v3/channel-manager/room-blocks?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch room blocks: ${response.statusText}`);
    }

    const roomBlocksResponse: AviratoRoomBlocksResponse = await response.json();
    return roomBlocksResponse.status === 'success' ? roomBlocksResponse.data : [];
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