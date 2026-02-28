/**
 * Database Services Index
 *
 * Re-exports all database service modules for convenient imports.
 */

export * from './reservations.db';
export * from './customers.db';
export * from './sync.db';
export * from './settings.db';
export * from './notifications.db';

// Re-export Supabase client utilities
export { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';
