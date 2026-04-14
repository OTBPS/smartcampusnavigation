-- Stage 4 data quality cleanup for Smart Campus Navigation (NUIST)
-- Goal:
-- 1) keep only high-quality campus POI entries enabled
-- 2) standardize type and opening_hours
-- 3) keep project in demo-safe state without schema refactor
--
-- Notes:
-- - This script does not delete rows by default.
-- - Out-of-range or out-of-campus points are disabled (enabled = 0).
-- - Run on MySQL 8.x.

START TRANSACTION;

-- Optional one-time backup table (safe to keep after first run).
CREATE TABLE IF NOT EXISTS poi_backup_stage4 LIKE poi;
INSERT INTO poi_backup_stage4
SELECT *
FROM poi
WHERE NOT EXISTS (
    SELECT 1 FROM poi_backup_stage4 b WHERE b.id = poi.id
);

-- Normalize common type aliases to reduce frontend filter fragmentation.
UPDATE poi SET type = LOWER(REPLACE(TRIM(type), ' ', '_'))
WHERE type IS NOT NULL AND type != '';

UPDATE poi SET type = 'sports' WHERE type IN ('stadium', 'gymnasium', 'playground');
UPDATE poi SET type = 'activity_center' WHERE type = 'auditorium';

-- Fill missing opening hours with practical defaults by type.
UPDATE poi SET opening_hours = '06:30-23:00' WHERE (opening_hours IS NULL OR TRIM(opening_hours) = '') AND type = 'canteen';
UPDATE poi SET opening_hours = '08:00-22:00' WHERE (opening_hours IS NULL OR TRIM(opening_hours) = '') AND type IN ('library', 'college', 'teaching_building', 'activity_center');
UPDATE poi SET opening_hours = '08:00-17:30' WHERE (opening_hours IS NULL OR TRIM(opening_hours) = '') AND type = 'service_center';
UPDATE poi SET opening_hours = '08:00-18:00' WHERE (opening_hours IS NULL OR TRIM(opening_hours) = '') AND type = 'research_institute';
UPDATE poi SET opening_hours = '00:00-24:00' WHERE (opening_hours IS NULL OR TRIM(opening_hours) = '') AND type IN ('residential_area', 'gate', 'hospital');
UPDATE poi SET opening_hours = '08:00-20:00' WHERE (opening_hours IS NULL OR TRIM(opening_hours) = '') AND type = 'campus_poi';
UPDATE poi SET opening_hours = '06:00-22:00' WHERE (opening_hours IS NULL OR TRIM(opening_hours) = '') AND type = 'sports';

-- Coordinate sanity check: invalid lat/lng values are disabled.
UPDATE poi
SET enabled = 0
WHERE longitude IS NULL
   OR latitude IS NULL
   OR longitude < -180 OR longitude > 180
   OR latitude < -90 OR latitude > 90;

-- NUIST campus bounding box guard (broad range around campus).
-- Keep points in campus box enabled; disable obviously out-of-campus points.
-- Adjust boundary if your measured dataset expands.
UPDATE poi
SET enabled = 0
WHERE longitude IS NOT NULL
  AND latitude IS NOT NULL
  AND (
      longitude < 118.7060 OR longitude > 118.7260
      OR latitude < 32.1980 OR latitude > 32.2085
  );

COMMIT;

-- Manual optional step:
-- For duplicate names, keep one row enabled and disable extras after review.
-- Example review query:
-- SELECT name, COUNT(*) AS cnt FROM poi GROUP BY name HAVING COUNT(*) > 1 ORDER BY cnt DESC, name;
