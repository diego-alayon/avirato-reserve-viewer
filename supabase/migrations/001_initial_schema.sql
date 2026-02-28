-- ============================================================================
-- AVIRATO RESERVE VIEWER - INITIAL DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Description: Creates all necessary tables for the Avirato Reserve Viewer app
-- Run this migration in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- Sync status for customer synchronization
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed');

-- Notification types for automated messaging
CREATE TYPE notification_type AS ENUM (
  'check_in_reminder',
  'payment_reminder',
  'welcome',
  'checkout',
  'custom'
);

-- Notification delivery channels
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'sms', 'email');

-- Notification status in queue
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');

-- Log levels
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');

-- Operation status for sync operations
CREATE TYPE operation_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- ============================================================================
-- TABLE: reservations_cache
-- Description: Cache of reservations from Avirato API
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservations_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avirato_id INTEGER NOT NULL UNIQUE,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  client_email VARCHAR(255),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  billing_total DECIMAL(10, 2),
  is_fully_paid BOOLEAN DEFAULT FALSE,
  payment_link TEXT,
  operator_id INTEGER,
  operator_name VARCHAR(255),
  space_type_name VARCHAR(255),
  space_name VARCHAR(255),
  regime VARCHAR(100),
  adults INTEGER DEFAULT 0,
  children INTEGER DEFAULT 0,
  observations TEXT,
  extras_text TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reservations_cache
CREATE INDEX idx_reservations_cache_check_in ON reservations_cache(check_in_date);
CREATE INDEX idx_reservations_cache_check_out ON reservations_cache(check_out_date);
CREATE INDEX idx_reservations_cache_status ON reservations_cache(status);
CREATE INDEX idx_reservations_cache_client_phone ON reservations_cache(client_phone);
CREATE INDEX idx_reservations_cache_synced_at ON reservations_cache(synced_at);

-- ============================================================================
-- TABLE: customers
-- Description: Customers synchronized between Avirato and Last.app
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_normalized VARCHAR(20) NOT NULL UNIQUE,
  avirato_id VARCHAR(100),
  lastapp_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255),
  email VARCHAR(255),
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for customers
CREATE INDEX idx_customers_sync_status ON customers(sync_status);
CREATE INDEX idx_customers_avirato_id ON customers(avirato_id);
CREATE INDEX idx_customers_lastapp_id ON customers(lastapp_id);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- ============================================================================
-- TABLE: sync_logs
-- Description: Synchronization operation logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation VARCHAR(100) NOT NULL,
  status operation_status DEFAULT 'pending',
  level log_level DEFAULT 'info',
  message TEXT NOT NULL,
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_details JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sync_logs
CREATE INDEX idx_sync_logs_operation ON sync_logs(operation);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_level ON sync_logs(level);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- ============================================================================
-- TABLE: notification_queue
-- Description: Queue for pending notifications to be sent
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id INTEGER,
  customer_phone VARCHAR(20) NOT NULL,
  notification_type notification_type NOT NULL,
  channel notification_channel DEFAULT 'whatsapp',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status notification_status DEFAULT 'pending',
  message_content TEXT,
  template_id VARCHAR(100),
  template_variables JSONB,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification_queue
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_reservation_id ON notification_queue(reservation_id);
CREATE INDEX idx_notification_queue_customer_phone ON notification_queue(customer_phone);
CREATE INDEX idx_notification_queue_type ON notification_queue(notification_type);

-- ============================================================================
-- TABLE: notification_history
-- Description: History of sent notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_queue_id UUID REFERENCES notification_queue(id) ON DELETE SET NULL,
  reservation_id INTEGER,
  customer_phone VARCHAR(20) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  external_id VARCHAR(255),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB
);

-- Indexes for notification_history
CREATE INDEX idx_notification_history_reservation_id ON notification_history(reservation_id);
CREATE INDEX idx_notification_history_customer_phone ON notification_history(customer_phone);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);
CREATE INDEX idx_notification_history_status ON notification_history(status);

-- ============================================================================
-- TABLE: app_settings
-- Description: Application configuration key-value store
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for app_settings
CREATE INDEX idx_app_settings_key ON app_settings(key);

-- ============================================================================
-- TABLE: operators
-- Description: Cache of operators/channels from Avirato
-- ============================================================================

CREATE TABLE IF NOT EXISTS operators (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default operators (common channels)
INSERT INTO operators (id, name) VALUES
  (-1, 'Motor de reservas'),
  (0, 'Cliente Hotel'),
  (1, 'Booking.com'),
  (2, 'Expedia'),
  (18, 'SmartBox'),
  (28, 'Channel Manager Google'),
  (1003, 'Travelzoo')
ON CONFLICT (id) DO NOTHING;

-- Insert default app settings
INSERT INTO app_settings (key, value, description) VALUES
  ('sync_interval', '300000', 'Sync interval in milliseconds (default: 5 minutes)'),
  ('auto_sync_enabled', 'false', 'Whether automatic sync is enabled'),
  ('notification_enabled', 'false', 'Whether notifications are enabled'),
  ('notification_check_in_hours_before', '24', 'Hours before check-in to send reminder'),
  ('notification_payment_reminder_days', '3', 'Days before check-in to send payment reminder'),
  ('default_date_range_days', '30', 'Default date range for fetching reservations')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table with updated_at
CREATE TRIGGER update_reservations_cache_updated_at
  BEFORE UPDATE ON reservations_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Note: Enable RLS and create policies based on your authentication needs.
-- For now, we keep tables open since the app uses Avirato for auth.
-- Uncomment and modify the policies below if needed.

-- ALTER TABLE reservations_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Example policy: Allow all operations for now (public access)
-- CREATE POLICY "Allow all" ON reservations_cache FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON customers FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON sync_logs FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON notification_queue FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON notification_history FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON app_settings FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON operators FOR ALL USING (true);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================
-- Enable realtime for tables that need live updates

ALTER PUBLICATION supabase_realtime ADD TABLE reservations_cache;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_queue;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this script in your Supabase SQL Editor to create all tables.
-- After running, update your .env.local with:
--   VITE_SUPABASE_URL=https://your-project.supabase.co
--   VITE_SUPABASE_ANON_KEY=your-anon-key
