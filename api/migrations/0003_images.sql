-- Uploaded images live in R2 (binding IMAGES); the database stores their keys.
ALTER TABLE projects ADD COLUMN image_key TEXT;

-- Small key/value store for profile settings, e.g. the portrait image key.
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
