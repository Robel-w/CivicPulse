-- Demo seed data (optional)
-- Creates one ADMIN with a fixed "area" location.
-- Username/email are unique; re-running won't duplicate because of INSERT IGNORE.

INSERT IGNORE INTO users (id, username, email, password, role, latitude, longitude)
VALUES (1, 'admin', 'admin@civicpulse.local', 'admin123', 'ADMIN', 30.0444, 31.2357);

