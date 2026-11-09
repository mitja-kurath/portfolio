-- Editable portfolio content (projects, skill groups, roles). Shapes follow the DTOs in
-- src/app/core/api/api.models.ts. Static site texts live in the frontend (site-content.ts).

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  year TEXT NOT NULL,
  stack TEXT NOT NULL,
  description TEXT NOT NULL,
  art_variant INTEGER NOT NULL CHECK (art_variant BETWEEN 1 AND 4),
  coordinates TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(coordinates)),
  layout_class TEXT,
  url TEXT,
  -- Unpublished projects stay in the database (drafts) but are not served.
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX projects_order ON projects (published, sort_order);

CREATE TABLE skill_groups (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(items)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
