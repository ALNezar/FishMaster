-- FishMaster Alert System Tables
-- Note: Flyway is disabled (ddl-auto: update handles schema).
-- This file serves as documentation of the intended schema.

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    tank_id BIGINT NOT NULL REFERENCES tanks(id),
    metric VARCHAR(32) NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    threshold_low NUMERIC(10,2),
    threshold_high NUMERIC(10,2),
    severity VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_tank_metric ON alerts(tank_id, metric, resolved_at);

-- Alert thresholds per tank
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id BIGSERIAL PRIMARY KEY,
    tank_id BIGINT NOT NULL UNIQUE REFERENCES tanks(id),
    global_alerts_enabled BOOLEAN DEFAULT true,
    email_alerts_enabled BOOLEAN DEFAULT true,
    in_app_alerts_enabled BOOLEAN DEFAULT true,
    temperature_enabled BOOLEAN DEFAULT true,
    temperature_min NUMERIC(5,1) DEFAULT 22.0,
    temperature_max NUMERIC(5,1) DEFAULT 28.0,
    ph_enabled BOOLEAN DEFAULT true,
    ph_min NUMERIC(3,1) DEFAULT 6.5,
    ph_max NUMERIC(3,1) DEFAULT 7.5,
    turbidity_enabled BOOLEAN DEFAULT true,
    turbidity_max NUMERIC(5,1) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Web Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

-- MQTT tank ID mapping column on tanks table
ALTER TABLE tanks ADD COLUMN IF NOT EXISTS mqtt_tank_id VARCHAR(64) DEFAULT 'tank1';
