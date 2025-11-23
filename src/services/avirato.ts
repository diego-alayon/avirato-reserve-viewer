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
      // Also fetch space names (individual villas: Villa 101, Villa 102, etc.)
      // The structure is: space_types[] -> space_subtypes[] -> spaces[] -> space_name
      let spaceSubtypeMap = new Map<number, string>();
      let spaceNameMap = new Map<number, string>();
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

                // Iterate through spaces (individual villas)
                if (subtype.spaces) {
                  for (const space of subtype.spaces) {
                    spaceNameMap.set(space.space_id, space.space_name);
                    console.log(`    Space mapping: ID ${space.space_id} -> "${space.space_name}"`);
                  }
                }
              }
            }
          }

          console.log('=== SPACE SUBTYPE MAP CREATED ===');
          console.log('Map size:', spaceSubtypeMap.size);
          console.log('All subtype mappings:', Array.from(spaceSubtypeMap.entries()));
          console.log('=== SPACE NAME MAP CREATED ===');
          console.log('Map size:', spaceNameMap.size);
          console.log('Sample space mappings:', Array.from(spaceNameMap.entries()).slice(0, 5));
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
      console.log(`🔄 Processing ${allReservations.length} reservations...`);
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

      console.log(`Processed ${allReservations.length} reservations with extras information`);

      // Fetch payment information for each reservation
      console.log('=== FETCHING PAYMENT INFORMATION ===');
      console.log(`Processing payments for ${allReservations.length} reservations...`);

      const startTime = Date.now();

      // Procesar reservas en lotes paralelos para mejor performance
      const BATCH_SIZE = 20; // Procesar 20 reservas en paralelo
      const batches: AviratoReservation[][] = [];

      for (let i = 0; i < allReservations.length; i += BATCH_SIZE) {
        batches.push(allReservations.slice(i, i + BATCH_SIZE));
      }

      console.log(`Processing ${allReservations.length} reservations in ${batches.length} batches of ${BATCH_SIZE}...`);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        // Procesar todas las reservas del lote en paralelo
        await Promise.all(batch.map(async (reservation) => {
          const reservationId = reservation.reservation_id || reservation.reservationId;
          const reservationPrice = reservation.price || 0;
          const isPaidField = reservation.is_paid || reservation.isPaid || false;

          try {
            // Get all payments for this reservation and payment link in parallel
            const [payments, paymentLink] = await Promise.all([
              this.getPaymentsByReservation(reservationId, webCode),
              this.getPaymentLink(reservationId, webCode)
            ]);

            // Guardar el payment link
            reservation.payment_link = paymentLink || '';

            // Log de debug para ver los datos recibidos
            if (payments.length > 0) {
              console.log(`Reservation ${reservationId} - Payments received:`, payments);
            }

            // Calculate total paid amount from registered payments
            const totalPaid = payments.reduce((sum, payment) => sum + (payment.quantity || payment.amount || 0), 0);

            if (totalPaid > 0) {
              // Hay pagos registrados en el sistema - usar esos datos
              const pendingAmount = reservationPrice - totalPaid;
              const isFullyPaid = totalPaid >= reservationPrice;

              reservation.billing_total = pendingAmount > 0 ? pendingAmount : 0;
              reservation.is_fully_paid = isFullyPaid;

              // Guardar array completo de pagos
              reservation.payments = payments;

              // Extraer datos del último pago (el más reciente)
              if (payments.length > 0) {
                // Ordenar pagos por fecha (más reciente primero)
                const sortedPayments = [...payments].sort((a, b) => {
                  const dateA = new Date(a.date || a.payment_date || '').getTime();
                  const dateB = new Date(b.date || b.payment_date || '').getTime();
                  return dateB - dateA; // Descendente (más reciente primero)
                });

                const lastPayment = sortedPayments[0];

                // Usar los campos correctos de la API real
                reservation.payment_method = lastPayment.type || lastPayment.payment_method || '';
                reservation.payment_date = lastPayment.date || lastPayment.payment_date || '';
                reservation.payment_user = lastPayment.user || lastPayment.user_name || lastPayment.username || lastPayment.created_by || '';

                // Si hay múltiples pagos, consolidar métodos de pago
                if (payments.length > 1) {
                  const methods = [...new Set(payments.map(p => p.type || p.payment_method).filter(Boolean))];
                  if (methods.length > 1) {
                    reservation.payment_method = methods.join(', ');
                  }
                }
              }
            } else {
              // No hay pagos registrados en el endpoint - consultar el campo is_paid de la reserva
              // Esto puede significar que se pagó por otro medio (efectivo, transferencia directa, etc.)
              if (isPaidField) {
                // La reserva está marcada como pagada aunque no haya pagos registrados
                reservation.billing_total = 0;
                reservation.is_fully_paid = true;
                reservation.payment_method = '';
                reservation.payment_date = '';
                reservation.payment_user = '';
              } else {
                // La reserva no está pagada
                reservation.billing_total = reservationPrice;
                reservation.is_fully_paid = false;
                reservation.payment_method = '';
                reservation.payment_date = '';
                reservation.payment_user = '';
              }
            }
          } catch (error) {
            console.warn(`Could not fetch payments for reservation ${reservationId}:`, error);
            // En caso de error, usar el campo is_paid como fallback
            reservation.is_fully_paid = isPaidField;
            reservation.billing_total = isPaidField ? 0 : reservationPrice;
            reservation.payment_method = '';
            reservation.payment_date = '';
            reservation.payment_user = '';
          }
        }));

        const processed = (batchIndex + 1) * BATCH_SIZE;
        const total = allReservations.length;
        console.log(`Processed batch ${batchIndex + 1}/${batches.length} (${Math.min(processed, total)}/${total} reservations)`);
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`✅ Completed payment processing for ${allReservations.length} reservations in ${duration}s`);
    }

    return consolidatedResponse;
  }

  /**
   * Converts charges and predefinedCharges arrays to billing lines format
   * @param reservation - The reservation object with charges data
   * @returns Array of billing lines
   */
  private convertChargesToBillingLines(reservation: AviratoReservation): BillingLine[] {
    const billingLines: BillingLine[] = [];
    let lineIndex = 0;

    // 1. Add base reservation cost as first billing line
    billingLines.push({
      id: `${reservation.reservation_id}-${lineIndex++}`,
      concept: 'Alojamiento',
      quantity: 1,
      unit_price: reservation.price || 0,
      total: reservation.price || 0,
      type: 'reservation'
    });

    // 2. Process charges array
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

  async getPaymentsByReservation(reservationId: number, webCode: number): Promise<AviratoPayment[]> {
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
        // No hay pagos registrados para esta reserva - esto es normal
        return [];
      }
      if (response.status === 403) {
        // Sin permisos para acceder a pagos - loguear solo la primera vez
        if (!this.has403Error) {
          console.warn(`⚠️ Payment endpoint returned 403 Forbidden. You may not have permissions to access payment data. Will use is_paid field from reservations as fallback.`);
          this.has403Error = true;
        }
        return [];
      }
      // Si el endpoint no existe o hay otro error, devolvemos array vacío para no romper la UI
      console.warn(`Failed to fetch payments for reservation ${reservationId}: ${response.status} ${response.statusText}`);
      return [];
    }

    try {
      const paymentsResponse: AviratoPaymentsResponse = await response.json();

      // Log de debug para ver la respuesta completa
      if (paymentsResponse.data && paymentsResponse.data.length > 0) {
        console.log(`✅ Payments found for reservation ${reservationId}:`, paymentsResponse.data);
      }

      return paymentsResponse.status === 'success' ? paymentsResponse.data : [];
    } catch (error) {
      console.warn(`Failed to parse payments response for reservation ${reservationId}:`, error);
      return [];
    }
  }

  async getPaymentLink(reservationId: number, webCode: number): Promise<string | null> {
    if (!this.token) {
      console.warn('Cannot fetch payment link: No authentication token available');
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
          console.warn(`Payment link not found for reservation ${reservationId}`);
          return null;
        }
        console.warn(`Failed to fetch payment link for reservation ${reservationId}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      // Log completo de la respuesta para debugging
      console.log(`🔍 Payment link response for reservation ${reservationId}:`, JSON.stringify(data, null, 2));

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
        console.log(`✅ Payment link found for reservation ${reservationId}: ${paymentLink}`);
        return paymentLink;
      }

      console.warn(`⚠️ Payment link (payments.avirato.com) not found in response for reservation ${reservationId}. Response structure:`, data);
      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch payment link for reservation ${reservationId}:`, error);
      return null;
    }
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