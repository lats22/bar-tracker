-- Migration: Add Lady Drinks Tracking Feature
-- This adds the ability to track which lady received drinks each day

-- Ladies table (stores the list of ladies working at the bar)
CREATE TABLE IF NOT EXISTS ladies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lady drinks detail table (tracks drinks per lady per day)
CREATE TABLE IF NOT EXISTS lady_drinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  lady_id UUID REFERENCES ladies(id) ON DELETE CASCADE,
  drink_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, lady_id) -- One entry per lady per day
);

-- Indexes for better performance
CREATE INDEX idx_lady_drinks_date ON lady_drinks(date);
CREATE INDEX idx_lady_drinks_lady_id ON lady_drinks(lady_id);
CREATE INDEX idx_ladies_is_active ON ladies(is_active);

-- Triggers for updated_at
CREATE TRIGGER update_ladies_updated_at BEFORE UPDATE ON ladies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lady_drinks_updated_at BEFORE UPDATE ON lady_drinks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample ladies (optional - remove if not needed)
-- INSERT INTO ladies (name) VALUES ('Anna'), ('Maria'), ('Lisa'), ('Jenny'), ('Sophie');
