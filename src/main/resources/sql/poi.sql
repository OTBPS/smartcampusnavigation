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

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
VALUES
('Main Library', 'library', 118.7935120, 32.0602550, 'Main study and reading center on campus', '08:00-22:00', 1),
('North Canteen', 'canteen', 118.7947020, 32.0617350, 'Primary dining hall near teaching buildings', '06:30-20:30', 1),
('Building A Teaching Block', 'teaching_building', 118.7929410, 32.0609840, 'General classrooms and lecture halls', '07:30-21:30', 1),
('Student Affairs Center', 'service_center', 118.7952080, 32.0598660, 'Student card, registration, and campus services', '08:30-17:30', 1),
('Campus Gymnasium', 'sports', 118.7916600, 32.0619820, 'Indoor basketball and fitness facilities', '09:00-21:00', 1);
