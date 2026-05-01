-- Migration: Create canva_designs table

CREATE TABLE IF NOT EXISTS canva_designs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  canva_design_id TEXT NOT NULL UNIQUE,
  title TEXT,
  design_url TEXT,
  thumbnail_url TEXT,
  export_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_canva_designs_user ON canva_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_canva_designs_status ON canva_designs(status);

SELECT 'canva_designs table created' AS result;