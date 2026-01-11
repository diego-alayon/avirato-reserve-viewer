/**
 * Last.app API v2.0.0 - TypeScript Type Definitions
 *
 * Complete type definitions for all Last.app API endpoints and data models.
 * Based on official API documentation: https://developers.last.app/docs
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Generic API error response
 */
export interface ApiError {
  error: string;
  message: string;
  status_code: number;
  details?: any;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Credentials for authenticating with Last.app API
 */
export interface LastAppCredentials {
  token: string;
  organizationId?: string;
  locationId?: string;
}

/**
 * Authentication response (if applicable)
 */
export interface LastAppAuthResponse {
  token: string;
  expires_at?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================================================
// ORGANIZATION & LOCATION
// ============================================================================

/**
 * Organization entity
 */
export interface LastAppOrganization {
  id: string;
  name: string;
  logo_url?: string;
  timezone: string;
  currency: string;
  locale: string;
  settings?: {
    tax_rate: number;
    default_payment_methods: string[];
    loyalty_enabled: boolean;
    notifications_enabled: boolean;
  };
  created_at: string;
  updated_at?: string;
}

/**
 * Course (menu section) entity
 */
export interface LastAppCourse {
  id: string;
  name: string;
  order: number;
}

/**
 * Location entity
 */
export interface LastAppLocation {
  id: string;
  organization_id?: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email?: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  brands?: LastAppBrand[];
  settings?: {
    accepts_reservations: boolean;
    accepts_delivery: boolean;
    accepts_takeaway: boolean;
    min_delivery_amount?: number;
    delivery_fee?: number;
    tax_rate: number;
  };
  hours?: {
    [day: string]: {
      open: string;
      close: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Brand entity (concept within a location)
 */
export interface LastAppBrand {
  id: string;
  name: string;
  catalogs: LastAppCatalog[];
}

// ============================================================================
// CATALOG & PRODUCTS
// ============================================================================

/**
 * Catalog type variants
 */
export type CatalogType = 'default' | 'delivery' | 'takeaway' | 'justeat' | 'glovo' | 'shop';

/**
 * Catalog entity
 */
export interface LastAppCatalog {
  id: string;
  name: string;
  type: CatalogType;
  brand_id: string;
  brand_name?: string;
  location_id?: string;
  active: boolean;
  products_count?: number;
  products?: LastAppProduct[];
  combos?: LastAppCombo[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Product entity
 */
export interface LastAppProduct {
  id: string;
  catalog_id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
  modifiers?: LastAppModifier[];
  modifier_groups?: LastAppModifierGroup[];
  tax_rate?: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
}

/**
 * Product modifier (add-on)
 */
export interface LastAppModifier {
  id: string;
  name: string;
  price: number;
  available?: boolean;
}

/**
 * Modifier group (e.g., "Choose side dish")
 */
export interface LastAppModifierGroup {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  modifiers: LastAppModifier[];
  required?: boolean;
}

/**
 * Combo (meal deal) entity
 */
export interface LastAppCombo {
  id: string;
  catalog_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available: boolean;
  categories: LastAppComboCategory[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Combo category (e.g., "Main dish", "Side", "Drink")
 */
export interface LastAppComboCategory {
  name: string;
  min_selections: number;
  max_selections: number;
  products: string[];
}

/**
 * Floorplan entity (table layout)
 */
export interface LastAppFloorplan {
  id: string;
  location_id: string;
  name: string;
  tables: LastAppTable[];
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Table entity
 */
export interface LastAppTable {
  id: string;
  number: string | number;
  capacity: number;
  position?: {
    x: number;
    y: number;
  };
  shape?: 'round' | 'square' | 'rectangle';
}

// ============================================================================
// TABS & ORDERS
// ============================================================================

/**
 * Tab/Order status lifecycle
 */
export type TabStatus = 'KITCHEN' | 'READY_TO_PICKUP' | 'ON_DELIVERY' | 'DELIVERED' | 'CLOSED';

/**
 * Order type
 */
export type OrderType = 'dine_in' | 'delivery' | 'takeaway';

/**
 * Tab entity (represents an order)
 */
export interface LastAppTab {
  id: string;
  location_id: string;
  table_number?: number | string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_type: OrderType;
  status: TabStatus;
  products: TabProduct[];
  subtotal: number;
  tax: number;
  discount_amount: number;
  total: number;
  delivery_address?: string;
  delivery_fee?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_ready_time?: string;
}

/**
 * Product within a tab
 */
export interface TabProduct {
  product_id: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  modifiers?: TabModifier[];
  notes?: string;
  subtotal?: number;
}

/**
 * Modifier applied to a product in tab
 */
export interface TabModifier {
  modifier_id: string;
  name?: string;
  quantity?: number;
  price?: number;
}

/**
 * Order status information
 */
export interface OrderStatus {
  tab_id: string;
  status: TabStatus;
  updated_at: string;
  estimated_ready_time?: string;
}

// ============================================================================
// BILLS & PAYMENTS
// ============================================================================

/**
 * Bill status
 */
export type BillStatus = 'pending' | 'partial' | 'paid';

/**
 * Payment method
 */
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

/**
 * Payment status
 */
export type PaymentStatus = 'completed' | 'pending' | 'failed';

/**
 * Bill entity
 */
export interface LastAppBill {
  id: string;
  tab_id: string;
  location_id?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  status: BillStatus;
  products: BillProduct[];
  payments?: LastAppPayment[];
  created_at: string;
  due_date?: string;
  notes?: string;
}

/**
 * Product line item in bill
 */
export interface BillProduct {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers?: BillModifier[];
  subtotal: number;
}

/**
 * Modifier in bill line item
 */
export interface BillModifier {
  modifier_id: string;
  name: string;
  price: number;
}

/**
 * Payment entity
 */
export interface LastAppPayment {
  id: string;
  bill_id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
  processed_by?: string;
}

// ============================================================================
// RESERVATIONS
// ============================================================================

/**
 * Reservation status
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

/**
 * Reservation entity
 */
export interface LastAppReservation {
  id: string;
  location_id: string;
  date: string;
  time: string;
  party_size: number;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  status: ReservationStatus;
  table_number?: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

/**
 * Availability slot for a specific time
 */
export interface AvailabilitySlot {
  time: string;
  available: boolean;
  available_tables: number;
  max_party_size: number;
}

/**
 * Day availability summary
 */
export interface AvailableDay {
  date: string;
  has_availability: boolean;
  available_slots: number;
}

/**
 * Reservation schedule configuration
 */
export interface ReservationSchedule {
  id: string;
  location_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  open_time: string;
  close_time: string;
  slot_duration: number;
  max_capacity: number;
  enabled: boolean;
}

// ============================================================================
// CUSTOMERS
// ============================================================================

/**
 * Customer entity
 * Based on official Last.app API documentation: https://developers.last.app/docs
 */
export interface LastAppCustomer {
  id: string;
  name: string;
  surname?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  creationTime: string;           // ISO 8601 timestamp
  source: string;
  marketingCommunication?: boolean;
  internalNote?: string | null;
  externalId?: string | null;
}

/**
 * Customer points information
 */
export interface CustomerPoints {
  customer_id: string;
  points: number;
  points_pending: number;
  points_history: PointsHistoryEntry[];
}

/**
 * Points history entry
 */
export interface PointsHistoryEntry {
  date: string;
  points: number;
  reason: string;
  transaction_id?: string;
}

// ============================================================================
// PROMOTIONS
// ============================================================================

/**
 * Promotion type
 */
export type PromotionType = 'percentage' | 'currency' | '2x1' | 'products';

/**
 * Promotion scope
 */
export type PromotionScope = 'all' | 'specific';

/**
 * Promotion entity
 */
export interface LastAppPromotion {
  id: string;
  organization_id?: string;
  name: string;
  description?: string;
  type: PromotionType;
  value?: number;
  product_ids?: string[];
  code?: string;
  min_expense?: number;
  max_redemptions?: number;
  current_redemptions?: number;
  start_date?: string;
  end_date?: string;
  applies_to: PromotionScope;
  entity_ids?: string[];
  active: boolean;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * Available webhook events
 */
export type WebhookEvent =
  | 'tab:created'
  | 'tab:updated'
  | 'tab:closed'
  | 'bill:created'
  | 'payment:created'
  | 'payment_request:created'
  | 'reservation:created'
  | 'reservation:updated'
  | 'reservation:cancelled'
  | 'customer:created'
  | 'customer:updated'
  | 'catalog:updated'
  | 'product:updated'
  | 'location:integrated'
  | 'floorplan:updated';

/**
 * Webhook payload structure
 */
export interface WebhookPayload<T = any> {
  event: WebhookEvent;
  timestamp: string;
  data: T;
  organization_id: string;
  location_id?: string;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  secret?: string;
  created_at: string;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Request to create a new tab
 */
export interface CreateTabRequest {
  location_id: string;
  table_number?: number | string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_type: OrderType;
  delivery_address?: string;
  notes?: string;
}

/**
 * Request to create a reservation
 */
export interface CreateReservationRequest {
  location_id: string;
  date: string;
  time: string;
  party_size: number;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  duration_minutes?: number;
}

/**
 * Request to create a bill
 */
export interface CreateBillRequest {
  tab_id: string;
  products?: string[];
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
}

/**
 * Request to create a payment
 */
export interface CreatePaymentRequest {
  bill_id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

/**
 * Request to create a customer
 * Based on official Last.app API documentation: https://developers.last.app/docs
 */
export interface CreateCustomerRequest {
  organizationId: string;         // Required: Organization UUID
  name: string;                   // Required: Customer name
  phoneNumber: string;            // Required: Full phone number with country code
  source: string;                 // Required: Source of the customer (e.g., "hotel", "website")
  surname?: string;               // Optional: Customer surname
  email?: string;                 // Optional: Customer email
  internalNote?: string;          // Optional: Internal notes
  externalId?: string;            // Optional: ID from external system
}

/**
 * Request to create a promotion
 */
export interface CreatePromotionRequest {
  name: string;
  description?: string;
  type: PromotionType;
  value?: number;
  product_ids?: string[];
  code?: string;
  min_expense?: number;
  max_redemptions?: number;
  start_date?: string;
  end_date?: string;
  applies_to: PromotionScope;
  entity_ids?: string[];
  active: boolean;
}

/**
 * Request to update promotion
 */
export interface UpdatePromotionRequest extends Partial<CreatePromotionRequest> {
  id?: string;
}

/**
 * Request to update order status
 */
export interface UpdateOrderStatusRequest {
  status: TabStatus;
  estimated_ready_time?: string;
  notes?: string;
}

/**
 * Request to cancel order
 */
export interface CancelOrderRequest {
  reason: string;
  refund_amount?: number;
}

/**
 * Request to register webhook
 */
export interface RegisterWebhookRequest {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

/**
 * Query parameters for listing tabs
 */
export interface GetTabsParams {
  location_id?: string;
  start_date?: string;
  end_date?: string;
  status?: TabStatus | TabStatus[];
  order_type?: OrderType;
  customer_id?: string;
  page?: number;
  limit?: number;
}

/**
 * Query parameters for listing bills
 */
export interface GetBillsParams {
  location_id?: string;
  start_date?: string;
  end_date?: string;
  status?: BillStatus;
  page?: number;
  limit?: number;
}

/**
 * Query parameters for listing customers
 */
export interface GetCustomersParams {
  organization_id?: string;
  search?: string;
  tags?: string[];
  min_points?: number;
  max_points?: number;
  min_spent?: number;
  max_spent?: number;
  page?: number;
  limit?: number;
}

/**
 * Query parameters for day availability
 */
export interface DayAvailabilityParams {
  location_id: string;
  date: string;
  party_size: number;
}

/**
 * Query parameters for month availability
 */
export interface MonthAvailabilityParams {
  location_id: string;
  year: number;
  month: number;
  party_size?: number;
}

/**
 * Query parameters for listing reservations
 */
export interface GetReservationsParams {
  location_id?: string;
  start_date?: string;
  end_date?: string;
  status?: ReservationStatus;
  customer_id?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Request options for API calls
 */
export interface RequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * Entity header requirement
 */
export type EntityHeaderType = 'location' | 'organization' | 'none';

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  maxRequestsPer10Min: number;
  maxRequestsPerSecond: number;
}

/**
 * Rate limiter status
 */
export interface RateLimiterStatus {
  requestsLast10Min: number;
  requestsLastSecond: number;
  available10Min: number;
  availablePerSecond: number;
}
