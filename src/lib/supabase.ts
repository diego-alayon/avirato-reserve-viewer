/**
 * Supabase Client Configuration
 *
 * Provides the Supabase client instance for database operations.
 * Uses environment variables for configuration.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase environment variables not configured. Database features will be disabled.',
    '\n   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

/**
 * Supabase client instance
 * Use this client for all database operations
 */
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Disable auth features since we're using Avirato for authentication
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      // Use public schema
      schema: 'public',
    },
    global: {
      // Add custom headers if needed
      headers: {
        'x-app-name': 'avirato-reserve-viewer',
      },
    },
  }
);

/**
 * Check if Supabase is properly configured
 * @returns true if Supabase environment variables are set
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Test Supabase connection
 * @returns true if connection is successful
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    // Try a simple query to test connection
    const { error } = await supabase.from('sync_logs').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, that's OK - connection works
      if (error.code === '42P01') {
        return true;
      }
      console.error('Supabase connection test failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

export default supabase;
