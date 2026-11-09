-- Messages sent through the site's contact form. No IP address or user agent is stored.
CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- Set by the admin panel once the message has been read.
  read_at TEXT
);
CREATE INDEX contact_messages_created ON contact_messages (created_at DESC);
