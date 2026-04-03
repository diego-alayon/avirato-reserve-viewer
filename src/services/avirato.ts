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
  // Campo para el número/nombre de la villa específica
  space_name?: string;
  // Campo para los extras contratados (texto formateado)
  extras_text?: string;
  // Campos para información de pagos
  payment_method?: string; // Tipo de pago del último pago o consolidado
  payment_date?: string; // Fecha del último pago
  payment_user?: string; // Usuario que realizó el pago
  payments?: AviratoPayment[]; // Array completo de pagos (opcional)
  // Campo para el link de pago de la reserva
  payment_link?: string; // URL de la tienda online para pagar
  // Líneas de facturación (coste reserva + extras)
  billing_lines?: BillingLine[];
}

export interface BillingLine {
  id: string;
  concept: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: 'reservation' | 'extra';
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

export interface AviratoPayment {
  reservation_id: number;
  quantity: number;
  type: string;
  description?: string;
  date: string;
  origin?: string;
  user?: string;
  // Campos adicionales opcionales por si la API devuelve más
  payment_id?: number;
  amount?: number;
  payment_method?: string;
  payment_date?: string;
  status?: string;
  user_id?: number;
  user_name?: string;
  created_by?: string;
  username?: string;
}

export interface AviratoPaymentsResponse {
  status: string;
  data: AviratoPayment[];
}

// Use proxy in development to avoid CORS issues
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://apiv3.avirato.com';

export class AviratoService {
  private token: string | null = null;
  private webCodes: number[] = [];
  private tokenExpiry: Date | null = null;
  private has403Error = false; // Flag para loguear 403 solo una vez

  constructor() {
    this.loadTokenFromStorage();
  }

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

    const allReservationsData: AviratoReservation[][] = [];
    let hasNextPage = true;
    let cursor: string | undefined;
    let pageCount = 0;

    while (hasNextPage && pageCount < 10) {
      // Delay between pagination requests to avoid 429
      if (pageCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

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
          if (response.status === 429) {
            // Rate limited — wait and retry this page
            const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
            const waitMs = Math.max(retryAfter, 5) * 1000;
            logger.warn(`Rate limited on reservations page ${pageCount + 1}, waiting ${waitMs / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
            continue; // Retry same page
          }
          throw new Error(`Failed to fetch reservations: ${response.statusText}`);
        }

        const pageData: AviratoReservationsResponse = await response.json();

        if (pageData.status === 'success' && pageData.data) {
          allReservationsData.push(...pageData.data);
          hasNextPage = pageData.meta?.hasNextPage || false;
          cursor = pageData.meta?.cursor;
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

      const operatorMap = new Map<number, string>([
        [-1, "Motor de reservas"],
        [0, "Cliente Hotel"],
        [1, "Booking.com"],
        [2, "Expedia"],
        [18, "SmartBox"],
        [28, "Channel Manager Google"],
        [1003, "Travelzoo"]
      ]);

      // Fetch space subtypes (villa typologies: VILLA PREMIUM, VILLA PREMIUM DELUXE, etc.)
      // Also fetch space names (individual villas: Villa 101, Villa 102, etc.)
      // The structure is: space_types[] -> space_subtypes[] -> spaces[] -> space_name
      let spaceSubtypeMap = new Map<number, string>();
      let spaceNameMap = new Map<number, string>();
      try {
        const spaceTypesResponse = await this.getSpaceTypes(webCode);

        if (spaceTypesResponse.status === 'success' && spaceTypesResponse.data) {
          // Iterate through space types
          for (const spaceType of spaceTypesResponse.data) {
            // Iterate through space subtypes (these are the villa typologies)
            if (spaceType.space_subtypes) {
              for (const subtype of spaceType.space_subtypes) {
                spaceSubtypeMap.set(subtype.space_subtype_id, subtype.space_subtype_name);

                // Iterate through spaces (individual villas)
                if (subtype.spaces) {
                  for (const space of subtype.spaces) {
                    spaceNameMap.set(space.space_id, space.space_name);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error fetching space types:', error);
      }

      // Fetch extras catalog
      let extrasMap = new Map<number, string>();
      try {
        const extras = await this.getExtras(webCode);
        for (const extra of extras) {
          extrasMap.set(extra.extra_id, extra.name);
        }
      } catch (error) {
        logger.warn('Could not fetch extras catalog:', error);
      }

      for (const reservation of allReservations) {
        reservation.regime_name = reservation.regime;

        const operatorId = reservation.operator_id || reservation.operatorId;
        reservation.operator_name = operatorMap.get(operatorId) || `Operador ${operatorId}`;

        // Add space subtype name (villa typology) based on space_subtype_id
        const spaceSubtypeId = reservation.space_subtype_id || reservation.spaceSubtypeId;
        const mappedName = spaceSubtypeMap.get(spaceSubtypeId);
        reservation.space_type_name = mappedName || `Tipo ${spaceSubtypeId}`;

        // Add space name (individual villa number) based on space_id
        const spaceId = reservation.space_id || reservation.spaceId;
        const spaceName = spaceNameMap.get(spaceId);
        reservation.space_name = spaceName || `Villa ${spaceId}`;

        // Process extras from charges (filter by type='extra')
        const extrasFound: string[] = [];

        // Check charges array and filter by type='extra'
        if (reservation.charges && Array.isArray(reservation.charges)) {
          for (const charge of reservation.charges) {
            // Filter charges where type === 'extra'
            if (charge.type === 'extra' && charge.concept) {
              const extraName = charge.concept;
              const quantity = charge.quantity || 1;
              const price = charge.price || charge.total || 0;

              // Format: "Extra Name (x2) - €50.00"
              let formatted = extraName;
              if (quantity > 1) {
                formatted += ` (x${quantity})`;
              }
              if (price > 0) {
                formatted += ` - €${price.toFixed(2)}`;
              }

              extrasFound.push(formatted);
            }
          }
        }

        // Check predefinedCharges array and filter by type='extra'
        if (reservation.predefinedCharges && Array.isArray(reservation.predefinedCharges)) {
          for (const charge of reservation.predefinedCharges) {
            // Filter charges where type === 'extra'
            if (charge.type === 'extra' && charge.concept) {
              const extraName = charge.concept;
              const quantity = charge.quantity || 1;
              const price = charge.price || charge.total || 0;

              // Format: "Extra Name (x2) - €50.00"
              let formatted = extraName;
              if (quantity > 1) {
                formatted += ` (x${quantity})`;
              }
              if (price > 0) {
                formatted += ` - €${price.toFixed(2)}`;
              }

              // Avoid duplicates
              if (!extrasFound.includes(formatted)) {
                extrasFound.push(formatted);
              }
            }
          }
        }

        reservation.extras_text = extrasFound.length > 0
          ? extrasFound.join(', ')
          : 'No tiene extras contratados';

        // Convert charges to billing lines for all reservations
        reservation.billing_lines = this.convertChargesToBillingLines(reservation);
      }

      // Estado de pago inicial usando datos ya disponibles en la respuesta
      for (const reservation of allReservations) {
        const reservationPrice = reservation.price || 0;
        const isPaidField = reservation.is_paid || reservation.isPaid || false;

        reservation.is_fully_paid = isPaidField;
        reservation.billing_total = isPaidField ? 0 : reservationPrice;
      }
    }

    return consolidatedResponse;
  }

  /**
   * Get cached payment data from sessionStorage.
   */
  private getPaymentCache(reservationId: number): { payments: AviratoPayment[]; paymentLink: string | null } | null {
    try {
      const cached = sessionStorage.getItem(`pay_${reservationId}`);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      // Cache valid for 10 minutes
      if (Date.now() - parsed.ts > 10 * 60 * 1000) {
        sessionStorage.removeItem(`pay_${reservationId}`);
        return null;
      }
      return { payments: parsed.p, paymentLink: parsed.l };
    } catch {
      return null;
    }
  }

  private setPaymentCache(reservationId: number, payments: AviratoPayment[], paymentLink: string | null): void {
    try {
      sessionStorage.setItem(`pay_${reservationId}`, JSON.stringify({ p: payments, l: paymentLink, ts: Date.now() }));
    } catch {
      // sessionStorage full — ignore
    }
  }

  /**
   * Enrich a single reservation with payment details and payment link.
   * Uses sessionStorage cache to avoid redundant API calls.
   */
  async enrichReservationPayments(reservation: AviratoReservation): Promise<AviratoReservation> {
    const webCodes = this.getWebCodes();
    if (!this.isAuthenticated() || webCodes.length === 0) return reservation;

    const webCode = webCodes[0];
    const reservationId = reservation.reservation_id || reservation.reservationId;
    const reservationPrice = reservation.price || 0;
    const isPaidField = reservation.is_paid || reservation.isPaid || false;

    // Skip API calls entirely if payment endpoint is known to return 403
    if (this.has403Error) {
      reservation.payment_method = '';
      reservation.payment_date = '';
      reservation.payment_user = '';
      reservation.payment_link = '';
      reservation.is_fully_paid = isPaidField;
      reservation.billing_total = isPaidField ? 0 : reservationPrice;
      return reservation;
    }

    try {
      // Check cache first
      const cached = this.getPaymentCache(reservationId);
      let payments: AviratoPayment[];
      let paymentLink: string | null;

      if (cached) {
        payments = cached.payments;
        paymentLink = cached.paymentLink;
      } else {
        [payments, paymentLink] = await Promise.all([
          this.getPaymentsByReservation(reservationId, webCode),
          this.getPaymentLink(reservationId, webCode)
        ]);
        this.setPaymentCache(reservationId, payments, paymentLink);
      }

      reservation.payment_link = paymentLink || '';
      const totalPaid = payments.reduce((sum, p) => sum + (p.quantity || p.amount || 0), 0);

      if (totalPaid > 0) {
        const pendingAmount = reservationPrice - totalPaid;
        reservation.billing_total = pendingAmount > 0 ? pendingAmount : 0;
        reservation.is_fully_paid = totalPaid >= reservationPrice;
        reservation.payments = payments;

        if (payments.length > 0) {
          const sortedPayments = [...payments].sort((a, b) => {
            const dateA = new Date(a.date || a.payment_date || 0).getTime() || 0;
            const dateB = new Date(b.date || b.payment_date || 0).getTime() || 0;
            return dateB - dateA;
          });
          const last = sortedPayments[0];
          reservation.payment_method = last.type || last.payment_method || '';
          reservation.payment_date = last.date || last.payment_date || '';
          reservation.payment_user = last.user || last.user_name || last.username || last.created_by || '';

          if (payments.length > 1) {
            const methods = [...new Set(payments.map(p => p.type || p.payment_method).filter(Boolean))];
            if (methods.length > 1) reservation.payment_method = methods.join(', ');
          }
        }
      } else {
        reservation.is_fully_paid = isPaidField;
        reservation.billing_total = isPaidField ? 0 : reservationPrice;
      }
    } catch {
      // Silently fail — keep existing basic data
    }

    return reservation;
  }

  /**
   * Enrich all reservations using a concurrent pool.
   * Keeps MAX_CONCURRENT requests in-flight at all times for maximum throughput.
   * Updates UI as each individual reservation completes — no waiting for batches.
   */
  async enrichAllReservationsInBackground(
    reservations: AviratoReservation[],
    onUpdate: (updated: AviratoReservation[]) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const MAX_CONCURRENT = 10; // 10 reservations = 20 API calls in-flight
    let completed = 0;
    let running = 0;
    let index = 0;

    return new Promise<void>((resolve) => {
      const runNext = () => {
        // Check if all done
        if (completed >= reservations.length) {
          onUpdate([...reservations]);
          resolve();
          return;
        }

        // Launch tasks up to concurrency limit
        while (running < MAX_CONCURRENT && index < reservations.length) {
          if (abortSignal?.aborted) { resolve(); return; }

          const currentIndex = index++;
          running++;

          this.enrichReservationPayments(reservations[currentIndex]).then(() => {
            running--;
            completed++;

            // Update UI every 3 completed or on last
            if (completed % 3 === 0 || completed >= reservations.length) {
              onUpdate([...reservations]);
            }

            runNext();
          });
        }
      };

      runNext();
    });
  }

  /**
   * Converts charges and predefinedCharges arrays to billing lines format
   * @param reservation - The reservation object with charges data
   * @returns Array of billing lines
   */
  private convertChargesToBillingLines(reservation: AviratoReservation): BillingLine[] {
    const billingLines: BillingLine[] = [];
    let lineIndex = 0;

    // Process charges array
    if (reservation.charges && Array.isArray(reservation.charges)) {
      for (const charge of reservation.charges) {
        // Skip if no concept or if it's the base reservation charge
        if (!charge.concept) continue;

        const quantity = charge.quantity || 1;
        const unitPrice = charge.price || 0;
        const total = charge.total || (unitPrice * quantity);

        billingLines.push({
          id: `${reservation.reservation_id}-${lineIndex++}`,
          concept: charge.concept,
          quantity: quantity,
          unit_price: unitPrice,
          total: total,
          type: charge.type || 'extra'
        });
      }
    }

    // 3. Process predefinedCharges array
    if (reservation.predefinedCharges && Array.isArray(reservation.predefinedCharges)) {
      for (const charge of reservation.predefinedCharges) {
        // Skip if no concept
        if (!charge.concept) continue;

        const quantity = charge.quantity || 1;
        const unitPrice = charge.price || 0;
        const total = charge.total || (unitPrice * quantity);

        billingLines.push({
          id: `${reservation.reservation_id}-${lineIndex++}`,
          concept: charge.concept,
          quantity: quantity,
          unit_price: unitPrice,
          total: total,
          type: charge.type || 'extra'
        });
      }
    }

    return billingLines;
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

  async getPaymentsByReservation(reservationId: number, webCode: number, _retryCount = 0): Promise<AviratoPayment[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const params = new URLSearchParams({
      web_code: webCode.toString(),
    });

    // Endpoint con web_code (siguiendo el patrón de otros endpoints exitosos)
    const url = `${API_BASE_URL}/v3/payment/${reservationId}?${params}`;

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
      if (response.status === 403) {
        if (!this.has403Error) {
          logger.warn('Payment endpoint returned 403 Forbidden. Using is_paid field as fallback.');
          this.has403Error = true;
        }
        return [];
      }
      if (response.status === 429 && _retryCount < 2) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.getPaymentsByReservation(reservationId, webCode, _retryCount + 1);
      }
      logger.warn(`Failed to fetch payments for reservation ${reservationId}: ${response.status}`);
      return [];
    }

    try {
      const paymentsResponse: AviratoPaymentsResponse = await response.json();
      return paymentsResponse.status === 'success' ? paymentsResponse.data : [];
    } catch (error) {
      logger.warn(`Failed to parse payments response for reservation ${reservationId}:`, error);
      return [];
    }
  }

  async getPaymentLink(reservationId: number, webCode: number, _retryCount = 0): Promise<string | null> {
    if (!this.token) {
      logger.warn('Cannot fetch payment link: No authentication token available');
      return null;
    }

    // No especificar type para obtener todas las URLs disponibles
    const params = new URLSearchParams({
      web_code: webCode.toString(),
    });

    const url = `${API_BASE_URL}/v3/reservation/urls/${reservationId}?${params}`;

    try {
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
          return null;
        }
        if (response.status === 429 && _retryCount < 2) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.getPaymentLink(reservationId, webCode, _retryCount + 1);
        }
        logger.warn(`Failed to fetch payment link for reservation ${reservationId}: ${response.status}`);
        return null;
      }

      const data = await response.json();

      let paymentLink = null;

      // Buscar el link de payments.avirato.com en todas las propiedades posibles
      // La respuesta puede contener múltiples URLs: shop, autocheckin, guestLink, payment, etc.

      // Función helper para buscar el link de pago en un objeto
      const findPaymentLink = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;

        // Buscar en todas las propiedades del objeto
        for (const key in obj) {
          const value = obj[key];

          // Si es una string y contiene payments.avirato.com, es el link que buscamos
          if (typeof value === 'string' && value.includes('payments.avirato.com')) {
            return value;
          }

          // Si es un objeto, buscar recursivamente
          if (typeof value === 'object' && value !== null) {
            const found = findPaymentLink(value);
            if (found) return found;
          }
        }

        return null;
      };

      // Buscar el link de pago en la respuesta
      paymentLink = findPaymentLink(data);

      if (paymentLink) {
        return paymentLink;
      }

      return null;
    } catch (error) {
      logger.error(`Failed to fetch payment link for reservation ${reservationId}:`, error);
      return null;
    }
  }

  async getRegimes(webCode: number): Promise<AviratoRegime[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const url = `${API_BASE_URL}/v3/regime?web_code=${webCode}`;

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

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn(`Failed to fetch extras: ${response.statusText}`);
      return [];
    }

    const extrasResponse: AviratoExtrasResponse = await response.json();
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
      logger.warn(`Failed to fetch extras for reservation ${reservationId}`);
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
      logger.error(`Failed to fetch spaces: ${response.statusText}`, errorText);
      return { status: 'error', data: [] };
    }

    const spaceTypesResponse: AviratoSpaceTypesResponse = await response.json();
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