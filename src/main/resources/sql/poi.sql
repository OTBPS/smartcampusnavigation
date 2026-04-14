-- Smart Campus Navigation: POI table initialization for MySQL 8.x
CREATE TABLE IF NOT EXISTS poi (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    description VARCHAR(500),
    opening_hours VARCHAR(100),
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_poi_name (name),
    INDEX idx_poi_type (type),
    INDEX idx_poi_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NOTE:
-- Do not seed non-NUIST demo POIs here.
-- Use NUIST seed files in this directory instead:
--   1) poi_nuist_seed_20260413.sql
--   2) poi_nuist_seed_20260414.sql
