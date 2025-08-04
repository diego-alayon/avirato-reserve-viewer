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

export interface AviratoReservation {
  reservation_id: number;
  rate_id: number;
  promotional_code: string;
  promotional_package: any[];
  space_id: number;
  space_type_id: number;
  space_subtype_id: number;
  price: number;
  client_id: string;
  client_name: string;
  check_in_date: string;
  check_out_date: string;
  regime: string;
  adults: number;
  children: number;
  additional_beds: number;
  status: string;
  advance: number;
  advance_type: number;
  operator_id: number;
  operator_reservation_id: string;
  is_paid: boolean;
  observations: string;
  master_reservation_id: number;
  created_at: string;
  guests: any[];
  client: AviratoClient;
  charges: any[];
  predefinedCharges: any[];
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

  async getReservations(): Promise<AviratoReservationsResponse> {
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

    // Get reservations from the last 30 days to today
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    console.log('Fetching reservations with web_code:', webCode, 'from:', startDate, 'to:', endDate);

    const params = new URLSearchParams({
      web_code: webCode.toString(),
      start_date: startDate,
      end_date: endDate,
      charges: 'false',
      take: '100'
    });

    const url = `${API_BASE_URL}/v3/reservation/dates?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Reservations response status:', response.status);
    console.log('Request URL:', url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch reservations. Response body:', errorText);
      
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Token expired. Please authenticate again.');
      }
      throw new Error(`Failed to fetch reservations: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  isAuthenticated(): boolean {
    this.loadTokenFromStorage();
    console.log('Checking authentication status:', {
      hasToken: !!this.token,
      hasExpiry: !!this.tokenExpiry,
      currentTime: new Date().toISOString(),
      expiry: this.tokenExpiry?.toISOString(),
      isValid: this.token !== null && this.tokenExpiry !== null && new Date() < this.tokenExpiry
    });
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