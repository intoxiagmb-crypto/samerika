-- Used only by the explicitly local development sign-in. Hosted identity remains platform-managed.
CREATE TABLE IF NOT EXISTS local_credentials (user_id TEXT PRIMARY KEY REFERENCES users(id), salt TEXT NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS local_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS local_sessions_expiry ON local_sessions(expires_at);
