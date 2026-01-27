/**
 * Customers Database Service
 *
 * Handles customer data synchronization between Avirato and Last.app.
 * Stores customer mappings and sync status in Supabase.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Customer, CustomerInsert, CustomerUpdate } from '@/types/supabase';
import { logger } from '@/utils/logger';

/**
 * Customers Database Service
 */
export const customersDb = {
  /**
   * Get all customers
   * @param options - Filter options
   */
  async getAll(options?: {
    syncStatus?: 'pending' | 'synced' | 'failed';
    limit?: number;
    offset?: number;
  }): Promise<Customer[]> {
    if (!isSupabaseConfigured()) {
      logger.warn('[CustomersDB] Supabase not configured, returning empty array');
      return [];
    }

    try {
      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.syncStatus) {
        query = query.eq('sync_status', options.syncStatus);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[CustomersDB] Error fetching customers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('[CustomersDB] Failed to get customers:', error);
      throw error;
    }
  },

  /**
   * Get a customer by normalized phone number
   * @param phoneNormalized - The normalized phone number (e.g., +34612345678)
   */
  async getByPhone(phoneNormalized: string): Promise<Customer | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_normalized', phoneNormalized)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('[CustomersDB] Error fetching customer:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('[CustomersDB] Failed to get customer:', error);
      return null;
    }
  },

  /**
   * Get a customer by Avirato ID
   * @param aviratoId - The Avirato client ID
   */
  async getByAviratoId(aviratoId: string): Promise<Customer | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('avirato_id', aviratoId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('[CustomersDB] Error fetching customer:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('[CustomersDB] Failed to get customer:', error);
      return null;
    }
  },

  /**
   * Create or update a customer
   * @param customer - The customer data
   */
  async upsert(customer: CustomerInsert): Promise<Customer | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .upsert(customer, {
          onConflict: 'phone_normalized',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        logger.error('[CustomersDB] Error upserting customer:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('[CustomersDB] Failed to upsert customer:', error);
      return null;
    }
  },

  /**
   * Bulk upsert customers
   * @param customers - Array of customer data
   */
  async bulkUpsert(customers: CustomerInsert[]): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .upsert(customers, {
          onConflict: 'phone_normalized',
          ignoreDuplicates: false,
        });

      if (error) {
        logger.error('[CustomersDB] Error bulk upserting customers:', error);
        throw error;
      }

      return customers.length;
    } catch (error) {
      logger.error('[CustomersDB] Failed to bulk upsert customers:', error);
      return 0;
    }
  },

  /**
   * Update customer sync status
   * @param phoneNormalized - The normalized phone number
   * @param status - The new sync status
   * @param lastappId - The Last.app customer ID (if synced successfully)
   */
  async updateSyncStatus(
    phoneNormalized: string,
    status: 'pending' | 'synced' | 'failed',
    lastappId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const update: CustomerUpdate = {
      sync_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'synced') {
      update.last_synced_at = new Date().toISOString();
      if (lastappId) {
        update.lastapp_id = lastappId;
      }
    }

    try {
      const { error } = await supabase
        .from('customers')
        .update(update)
        .eq('phone_normalized', phoneNormalized);

      if (error) {
        logger.error('[CustomersDB] Error updating sync status:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('[CustomersDB] Failed to update sync status:', error);
      return false;
    }
  },

  /**
   * Get customers pending synchronization
   * @param limit - Maximum number of customers to return
   */
  async getPending(limit: number = 100): Promise<Customer[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('sync_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('[CustomersDB] Error fetching pending customers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('[CustomersDB] Failed to get pending customers:', error);
      return [];
    }
  },

  /**
   * Get count of customers by sync status
   */
  async countByStatus(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    total: number;
  }> {
    if (!isSupabaseConfigured()) {
      return { pending: 0, synced: 0, failed: 0, total: 0 };
    }

    try {
      const [pending, synced, failed, total] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('sync_status', 'pending'),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('sync_status', 'synced'),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('sync_status', 'failed'),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
      ]);

      return {
        pending: pending.count || 0,
        synced: synced.count || 0,
        failed: failed.count || 0,
        total: total.count || 0,
      };
    } catch (error) {
      logger.error('[CustomersDB] Failed to count customers:', error);
      return { pending: 0, synced: 0, failed: 0, total: 0 };
    }
  },

  /**
   * Delete a customer
   * @param phoneNormalized - The normalized phone number
   */
  async delete(phoneNormalized: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('phone_normalized', phoneNormalized);

      if (error) {
        logger.error('[CustomersDB] Error deleting customer:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('[CustomersDB] Failed to delete customer:', error);
      return false;
    }
  },
};

export default customersDb;
