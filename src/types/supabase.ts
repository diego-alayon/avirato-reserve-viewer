/**
 * Supabase Database Types
 *
 * Type definitions for the Supabase database schema.
 * These types are used by the Supabase client for type-safe queries.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

export interface Database {
  public: {
    Tables: {
      // Reservations cache from Avirato
      reservations_cache: {
        Row: {
          id: string;
          avirato_id: number;
          client_name: string;
          client_phone: string | null;
          client_email: string | null;
          check_in_date: string;
          check_out_date: string;
          status: string;
          price: number;
          billing_total: number | null;
          is_fully_paid: boolean;
          payment_link: string | null;
          operator_id: number | null;
          operator_name: string | null;
          space_type_name: string | null;
          space_name: string | null;
          regime: string | null;
          adults: number;
          children: number;
          observations: string | null;
          extras_text: string | null;
          raw_data: Json | null;
          created_at: string;
          updated_at: string;
          synced_at: string;
        };
        Insert: {
          id?: string;
          avirato_id: number;
          client_name: string;
          client_phone?: string | null;
          client_email?: string | null;
          check_in_date: string;
          check_out_date: string;
          status: string;
          price: number;
          billing_total?: number | null;
          is_fully_paid?: boolean;
          payment_link?: string | null;
          operator_id?: number | null;
          operator_name?: string | null;
          space_type_name?: string | null;
          space_name?: string | null;
          regime?: string | null;
          adults?: number;
          children?: number;
          observations?: string | null;
          extras_text?: string | null;
          raw_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string;
        };
        Update: {
          id?: string;
          avirato_id?: number;
          client_name?: string;
          client_phone?: string | null;
          client_email?: string | null;
          check_in_date?: string;
          check_out_date?: string;
          status?: string;
          price?: number;
          billing_total?: number | null;
          is_fully_paid?: boolean;
          payment_link?: string | null;
          operator_id?: number | null;
          operator_name?: string | null;
          space_type_name?: string | null;
          space_name?: string | null;
          regime?: string | null;
          adults?: number;
          children?: number;
          observations?: string | null;
          extras_text?: string | null;
          raw_data?: Json | null;
          created_at?: string;
          updated_at?: string;
          synced_at?: string;
        };
      };

      // Customers synced between Avirato and Last.app
      customers: {
        Row: {
          id: string;
          phone_normalized: string;
          avirato_id: string | null;
          lastapp_id: string | null;
          name: string;
          surname: string | null;
          email: string | null;
          sync_status: 'pending' | 'synced' | 'failed';
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone_normalized: string;
          avirato_id?: string | null;
          lastapp_id?: string | null;
          name: string;
          surname?: string | null;
          email?: string | null;
          sync_status?: 'pending' | 'synced' | 'failed';
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_normalized?: string;
          avirato_id?: string | null;
          lastapp_id?: string | null;
          name?: string;
          surname?: string | null;
          email?: string | null;
          sync_status?: 'pending' | 'synced' | 'failed';
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Synchronization logs
      sync_logs: {
        Row: {
          id: string;
          operation: string;
          status: 'pending' | 'in_progress' | 'completed' | 'failed';
          level: 'debug' | 'info' | 'warn' | 'error';
          message: string;
          items_processed: number;
          items_succeeded: number;
          items_failed: number;
          duration_ms: number | null;
          error_details: Json | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          operation: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed';
          level?: 'debug' | 'info' | 'warn' | 'error';
          message: string;
          items_processed?: number;
          items_succeeded?: number;
          items_failed?: number;
          duration_ms?: number | null;
          error_details?: Json | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          operation?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed';
          level?: 'debug' | 'info' | 'warn' | 'error';
          message?: string;
          items_processed?: number;
          items_succeeded?: number;
          items_failed?: number;
          duration_ms?: number | null;
          error_details?: Json | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };

      // Notification queue for automated messaging
      notification_queue: {
        Row: {
          id: string;
          reservation_id: number | null;
          customer_phone: string;
          notification_type: 'check_in_reminder' | 'payment_reminder' | 'welcome' | 'checkout' | 'custom';
          channel: 'whatsapp' | 'sms' | 'email';
          scheduled_for: string;
          status: 'pending' | 'sent' | 'failed' | 'cancelled';
          message_content: string | null;
          template_id: string | null;
          template_variables: Json | null;
          attempts: number;
          last_attempt_at: string | null;
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reservation_id?: number | null;
          customer_phone: string;
          notification_type: 'check_in_reminder' | 'payment_reminder' | 'welcome' | 'checkout' | 'custom';
          channel?: 'whatsapp' | 'sms' | 'email';
          scheduled_for: string;
          status?: 'pending' | 'sent' | 'failed' | 'cancelled';
          message_content?: string | null;
          template_id?: string | null;
          template_variables?: Json | null;
          attempts?: number;
          last_attempt_at?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: number | null;
          customer_phone?: string;
          notification_type?: 'check_in_reminder' | 'payment_reminder' | 'welcome' | 'checkout' | 'custom';
          channel?: 'whatsapp' | 'sms' | 'email';
          scheduled_for?: string;
          status?: 'pending' | 'sent' | 'failed' | 'cancelled';
          message_content?: string | null;
          template_id?: string | null;
          template_variables?: Json | null;
          attempts?: number;
          last_attempt_at?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Notification history (sent notifications)
      notification_history: {
        Row: {
          id: string;
          notification_queue_id: string | null;
          reservation_id: number | null;
          customer_phone: string;
          notification_type: string;
          channel: string;
          message_content: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          external_id: string | null;
          sent_at: string;
          delivered_at: string | null;
          read_at: string | null;
          error_message: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          notification_queue_id?: string | null;
          reservation_id?: number | null;
          customer_phone: string;
          notification_type: string;
          channel: string;
          message_content: string;
          status?: 'sent' | 'delivered' | 'read' | 'failed';
          external_id?: string | null;
          sent_at?: string;
          delivered_at?: string | null;
          read_at?: string | null;
          error_message?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          notification_queue_id?: string | null;
          reservation_id?: number | null;
          customer_phone?: string;
          notification_type?: string;
          channel?: string;
          message_content?: string;
          status?: 'sent' | 'delivered' | 'read' | 'failed';
          external_id?: string | null;
          sent_at?: string;
          delivered_at?: string | null;
          read_at?: string | null;
          error_message?: string | null;
          metadata?: Json | null;
        };
      };

      // Application settings
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Operators/Channels cache
      operators: {
        Row: {
          id: number;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      sync_status: 'pending' | 'synced' | 'failed';
      notification_type: 'check_in_reminder' | 'payment_reminder' | 'welcome' | 'checkout' | 'custom';
      notification_channel: 'whatsapp' | 'sms' | 'email';
      notification_status: 'pending' | 'sent' | 'failed' | 'cancelled';
      log_level: 'debug' | 'info' | 'warn' | 'error';
      operation_status: 'pending' | 'in_progress' | 'completed' | 'failed';
    };
  };
}

// ============================================================================
// CONVENIENCE TYPES
// ============================================================================

// Table row types
export type ReservationCache = Database['public']['Tables']['reservations_cache']['Row'];
export type ReservationCacheInsert = Database['public']['Tables']['reservations_cache']['Insert'];
export type ReservationCacheUpdate = Database['public']['Tables']['reservations_cache']['Update'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export type SyncLog = Database['public']['Tables']['sync_logs']['Row'];
export type SyncLogInsert = Database['public']['Tables']['sync_logs']['Insert'];
export type SyncLogUpdate = Database['public']['Tables']['sync_logs']['Update'];

export type NotificationQueueItem = Database['public']['Tables']['notification_queue']['Row'];
export type NotificationQueueInsert = Database['public']['Tables']['notification_queue']['Insert'];
export type NotificationQueueUpdate = Database['public']['Tables']['notification_queue']['Update'];

export type NotificationHistoryItem = Database['public']['Tables']['notification_history']['Row'];
export type NotificationHistoryInsert = Database['public']['Tables']['notification_history']['Insert'];
export type NotificationHistoryUpdate = Database['public']['Tables']['notification_history']['Update'];

export type AppSetting = Database['public']['Tables']['app_settings']['Row'];
export type AppSettingInsert = Database['public']['Tables']['app_settings']['Insert'];
export type AppSettingUpdate = Database['public']['Tables']['app_settings']['Update'];

export type Operator = Database['public']['Tables']['operators']['Row'];
export type OperatorInsert = Database['public']['Tables']['operators']['Insert'];
export type OperatorUpdate = Database['public']['Tables']['operators']['Update'];

// Enum types
export type SyncStatus = Database['public']['Enums']['sync_status'];
export type NotificationType = Database['public']['Enums']['notification_type'];
export type NotificationChannel = Database['public']['Enums']['notification_channel'];
export type NotificationStatus = Database['public']['Enums']['notification_status'];
export type LogLevel = Database['public']['Enums']['log_level'];
export type OperationStatus = Database['public']['Enums']['operation_status'];
