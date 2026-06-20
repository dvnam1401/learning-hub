CREATE TABLE IF NOT EXISTS user_folder_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  granted_by TEXT,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, folder_id)
);
