-- Create dealer capabilities table
CREATE TABLE dealer_capabilities (
  dealership_id UUID PRIMARY KEY REFERENCES dealerships(id) ON DELETE CASCADE,
  makes TEXT[] DEFAULT '{}',
  models TEXT[] DEFAULT '{}',
  min_year INTEGER DEFAULT 1990,
  max_year INTEGER DEFAULT 2030,
  max_km INTEGER DEFAULT 500000,
  fuel_types TEXT[] DEFAULT '{}',
  gearbox_types TEXT[] DEFAULT '{}',
  body_types TEXT[] DEFAULT '{}',
  max_price INTEGER DEFAULT 10000000,
  service_radius INTEGER DEFAULT 100,
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add location columns to buyer_requests if not exists
ALTER TABLE buyer_requests
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealer_capabilities_makes ON dealer_capabilities USING GIN(makes);
CREATE INDEX IF NOT EXISTS idx_dealer_capabilities_models ON dealer_capabilities USING GIN(models);
CREATE INDEX IF NOT EXISTS idx_dealer_capabilities_fuel_types ON dealer_capabilities USING GIN(fuel_types);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_location ON buyer_requests(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_status_created ON buyer_requests(status, created_at DESC);