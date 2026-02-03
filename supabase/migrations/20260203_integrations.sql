-- Integrations Hub - Twilio SMS/WhatsApp entegrasyonu icin tablo
-- Bu script'i Supabase Dashboard > SQL Editor'de calistirin

-- Entegrasyonlar tablosu
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  credentials JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  connected_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, provider)
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_integrations_team_id ON integrations(team_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- RLS (Row Level Security) etkinlestir
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Takim uyeleri kendi entegrasyonlarini gorebilir
CREATE POLICY "Team members can view their integrations"
  ON integrations FOR SELECT
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- Takim uyeleri entegrasyonlari yonetebilir (insert/update/delete)
CREATE POLICY "Team members can manage integrations"
  ON integrations FOR ALL
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- updated_at otomatik guncelleme trigger'i
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger olustur (eger yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'integrations_updated_at'
  ) THEN
    CREATE TRIGGER integrations_updated_at
      BEFORE UPDATE ON integrations
      FOR EACH ROW
      EXECUTE FUNCTION update_integrations_updated_at();
  END IF;
END
$$;

-- Tablo olusturulduktan sonra kontrol
-- SELECT * FROM integrations;
