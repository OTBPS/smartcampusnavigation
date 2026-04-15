CREATE TABLE IF NOT EXISTS route_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    start_name VARCHAR(255) NOT NULL,
    start_lng DECIMAL(10, 6) NOT NULL,
    start_lat DECIMAL(10, 6) NOT NULL,
    end_name VARCHAR(255) NOT NULL,
    end_lng DECIMAL(10, 6) NOT NULL,
    end_lat DECIMAL(10, 6) NOT NULL,
    via_json TEXT NULL,
    distance BIGINT NOT NULL DEFAULT 0,
    duration BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_route_history_created_at (created_at DESC),
    KEY idx_route_history_title (title),
    KEY idx_route_history_start_end (start_name, end_name)
);
