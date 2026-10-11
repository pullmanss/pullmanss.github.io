-- High-load Telemetry Store
CREATE TABLE telemetry_2026 (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_hash VARCHAR(64) NOT NULL,
    screen_resolution VARCHAR(20),
    neural_latency_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);