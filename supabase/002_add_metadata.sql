-- Metadata table for storing app-level key/value pairs (e.g. last_synced_at)
CREATE TABLE metadata (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON metadata FOR SELECT USING (true);

-- Seed with current timestamp so the column exists immediately
INSERT INTO metadata (key, value)
VALUES ('last_synced_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
