/**
 * Calendar Service - Isolated service for calendar page
 * This service is completely separate from avirato.ts to avoid conflicts
 */

// Types specific to calendar
export interface CalendarSpace {
  space_id: number;
  space_name: string;
  space_type_id: number;
  space_subtype_id: number;
}

export interface CalendarReservation {
  reservation_id: number;
  space_id: number;
  space_name: string;
  client_name: string;
  check_in_date: string;
  check_out_date: string;
  price: number;
  operator_name: string;
}

interface SpaceSubtype {
  space_subtype_id: number;
  space_type_id: number;
  space_subtype_name: string;
  spaces: CalendarSpace[];
}

interface SpaceType {
  space_type_id: number;
  hotel_id: number;
  name: string;
  space_subtypes: SpaceSubtype[];
}

interface SpaceTypesResponse {
  status: string;
  data: SpaceType[];
}

interface ReservationsResponse {
  status: string;
  data: any[][];
  meta: {
    take: number;
    itemCount: number;
    itemRemaining: number;
    hasNextPage: boolean;
    cursor: string;
  };
}

// Rate types
export interface RateDayPrice {
  date: string;
  price: number;
  min_nights?: number;
}

export interface CalendarRate {
  rate_id: number;
  rate_name: string;
  space_subtype_id: number;
  prices: RateDayPrice[];
}

interface RateResponse {
  status: string;
  data: any[];
}

// Use proxy in development to avoid CORS issues
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://apiv3.avirato.com';

class CalendarService {
  private getToken(): string | null {
    return localStorage.getItem('avirato_token');
  }

  private getWebCode(): number | null {
    const webCodesStr = localStorage.getItem('avirato_web_codes');
    if (!webCodesStr) return null;
    try {
      const webCodes = JSON.parse(webCodesStr);
      return webCodes[0] || null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiryStr = localStorage.getItem('avirato_token_expiry');

    if (!token || !expiryStr) return false;

    const expiry = new Date(expiryStr);
    return expiry > new Date();
  }

  clearAuth(): void {
    localStorage.removeItem('avirato_token');
    localStorage.removeItem('avirato_web_codes');
    localStorage.removeItem('avirato_token_expiry');
  }

  async fetchSpaces(): Promise<CalendarSpace[]> {
    const token = this.getToken();
    const webCode = this.getWebCode();

    if (!token || !webCode) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}/v3/space?web_code=${webCode}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired - clear localStorage and throw specific error
        this.clearAuth();
        throw new Error('Token expirado. Por favor, inicia sesión de nuevo.');
      }
      throw new Error(`Failed to fetch spaces: ${response.status}`);
    }

    const data: SpaceTypesResponse = await response.json();

    if (data.status !== 'success' || !data.data) {
      throw new Error('Invalid response from spaces API');
    }

    // Flatten the nested structure to get all spaces
    const spaces: CalendarSpace[] = [];

    for (const spaceType of data.data) {
      if (spaceType.space_subtypes) {
        for (const subtype of spaceType.space_subtypes) {
          if (subtype.spaces) {
            for (const space of subtype.spaces) {
              spaces.push({
                space_id: space.space_id,
                space_name: space.space_name,
                space_type_id: space.space_type_id,
                space_subtype_id: space.space_subtype_id,
              });
            }
          }
        }
      }
    }

    // Sort spaces by name (natural sort for numbers)
    spaces.sort((a, b) =>
      a.space_name.localeCompare(b.space_name, 'es', { numeric: true })
    );

    return spaces;
  }

  async fetchRates(): Promise<CalendarRate[]> {
    const token = this.getToken();
    const webCode = this.getWebCode();

    if (!token || !webCode) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}/v3/rate?web_code=${webCode}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('Token expirado. Por favor, inicia sesión de nuevo.');
      }
      throw new Error(`Failed to fetch rates: ${response.status}`);
    }

    const data: RateResponse = await response.json();

    if (data.status !== 'success' || !data.data) {
      throw new Error('Invalid response from rates API');
    }

    // Log the raw response to understand the structure
    console.log('[CalendarService] Raw rates response:', JSON.stringify(data.data, null, 2));

    // Map the rates to our simplified structure
    const rates: CalendarRate[] = data.data.map((rate: any) => ({
      rate_id: rate.rate_id || rate.rateId,
      rate_name: rate.rate_name || rate.rateName || rate.name || '',
      space_subtype_id: rate.space_subtype_id || rate.spaceSubtypeId || 0,
      prices: rate.prices || rate.days || [],
    }));

    return rates;
  }

  async fetchReservations(startDate: Date, endDate: Date): Promise<CalendarReservation[]> {
    const token = this.getToken();
    const webCode = this.getWebCode();

    if (!token || !webCode) {
      throw new Error('Not authenticated');
    }

    // Adjust dates like avirato.ts does
    const adjustedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const adjustedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);

    const startDateStr = adjustedStart.toISOString().split('T')[0];
    const endDateStr = adjustedEnd.toISOString().split('T')[0];

    const allReservations: CalendarReservation[] = [];
    let hasNextPage = true;
    let cursor: string | undefined;
    let pageCount = 0;

    while (hasNextPage && pageCount < 5) {
      const params = new URLSearchParams({
        web_code: webCode.toString(),
        start_date: startDateStr,
        end_date: endDateStr,
        charges: 'true',
        take: '50',
      });

      if (cursor) {
        params.append('cursor', cursor);
      }

      const url = `${API_BASE_URL}/v3/reservation/dates?${params}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired - clear localStorage and throw specific error
          this.clearAuth();
          throw new Error('Token expirado. Por favor, inicia sesión de nuevo.');
        }
        if (response.status === 429) {
          // Rate limited - wait and return what we have
          console.warn('Rate limited, returning partial results');
          break;
        }
        throw new Error(`Failed to fetch reservations: ${response.status}`);
      }

      const data: ReservationsResponse = await response.json();

      if (data.status !== 'success') {
        throw new Error('Invalid response from reservations API');
      }

      // Flatten and map reservations
      const pageReservations = data.data.flat();

      for (const res of pageReservations) {
        allReservations.push({
          reservation_id: res.reservation_id || res.reservationId,
          space_id: res.space_id || res.spaceId,
          space_name: res.space_name || '',
          client_name: res.client?.name && res.client?.surname
            ? `${res.client.name} ${res.client.surname}`
            : res.client_name || res.clientName || 'Sin nombre',
          check_in_date: res.check_in_date || res.checkInDate,
          check_out_date: res.check_out_date || res.checkOutDate,
          price: res.price || 0,
          operator_name: res.operator_name || '',
        });
      }

      hasNextPage = data.meta?.hasNextPage || false;
      cursor = data.meta?.cursor;
      pageCount++;
    }

    return allReservations;
  }
}

// Singleton instance
export const calendarService = new CalendarService();
