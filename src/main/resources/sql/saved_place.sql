CREATE TABLE IF NOT EXISTS saved_place (
    id BIGINT NOT NULL AUTO_INCREMENT,
    poi_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NULL,
    longitude DECIMAL(10, 6) NULL,
    latitude DECIMAL(10, 6) NULL,
    description TEXT NULL,
    opening_hours VARCHAR(100) NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'poi-detail',
    saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_saved_place_poi_id (poi_id),
    INDEX idx_saved_place_saved_at (saved_at),
    INDEX idx_saved_place_updated_at (updated_at),
    INDEX idx_saved_place_coord (longitude, latitude)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
