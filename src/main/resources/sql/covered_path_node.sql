-- Covered path nodes for rain-day sheltered route recommendations
-- Fill this table after on-site surveying.
CREATE TABLE IF NOT EXISTS covered_path_node (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    description VARCHAR(255),
    priority INT NOT NULL DEFAULT 0,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_covered_node_enabled (enabled),
    INDEX idx_covered_node_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example insert template:
-- INSERT INTO covered_path_node (name, longitude, latitude, description, priority, enabled)
-- VALUES ('Library Corridor Entry', 118.7135000, 32.2030000, 'Covered corridor near library', 10, 1);
