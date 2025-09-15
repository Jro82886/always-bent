-- ABFI Bite Reports Table
-- Stores offline bite logs with ocean analysis

CREATE TABLE IF NOT EXISTS bite_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bite_id TEXT UNIQUE NOT NULL, -- Client-generated UUIDv7
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  
  -- Location data
  location GEOGRAPHY(POINT, 4326),
  lat DECIMAL(10, 8) NOT NULL,
  lon DECIMAL(11, 8) NOT NULL,
  accuracy_m DECIMAL(10, 2),
  inlet_id TEXT,
  
  -- Context at bite time
  context JSONB,
  
  -- User input
  notes TEXT,
  fish_on BOOLEAN DEFAULT false,
  species TEXT,
  
  -- Metadata
  device_tz TEXT,
  app_version TEXT,
  
  -- Analysis
  status TEXT DEFAULT 'pending_analysis' CHECK (status IN ('pending_analysis', 'analyzed', 'analysis_failed')),
  analysis JSONB,
  confidence_score INTEGER,
  error TEXT,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  
  -- Indexes for queries
  CONSTRAINT valid_lat CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT valid_lon CHECK (lon >= -180 AND lon <= 180)
);

-- Indexes for performance
CREATE INDEX idx_bite_reports_user_id ON bite_reports(user_id);
CREATE INDEX idx_bite_reports_created_at ON bite_reports(created_at DESC);
CREATE INDEX idx_bite_reports_inlet_id ON bite_reports(inlet_id);
CREATE INDEX idx_bite_reports_status ON bite_reports(status);
CREATE INDEX idx_bite_reports_location ON bite_reports USING GIST(location);

-- Enable RLS
ALTER TABLE bite_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all analyzed reports from last 3 days"
  ON bite_reports FOR SELECT
  USING (
    status = 'analyzed' AND 
    created_at > NOW() - INTERVAL '3 days'
  );

CREATE POLICY "Users can insert their own bites"
  ON bite_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON bite_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Function to auto-expire old reports (optional cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_bite_reports()
RETURNS void AS $$
BEGIN
  DELETE FROM bite_reports 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-bite-reports', '0 2 * * *', 'SELECT cleanup_old_bite_reports();');
