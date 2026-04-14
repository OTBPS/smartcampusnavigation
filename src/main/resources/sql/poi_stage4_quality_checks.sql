-- Stage 4 data quality checks for Smart Campus Navigation (NUIST)
-- Use this after running poi_stage4_quality_cleanup.sql.

-- 1) total / enabled counts
SELECT COUNT(*) AS total_poi,
       SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) AS enabled_poi
FROM poi;

-- 2) enabled points by type
SELECT type, COUNT(*) AS cnt
FROM poi
WHERE enabled = 1
GROUP BY type
ORDER BY cnt DESC, type ASC;

-- 3) coordinate validity for enabled points
SELECT COUNT(*) AS invalid_enabled_coordinates
FROM poi
WHERE enabled = 1
  AND (
      longitude IS NULL OR latitude IS NULL
      OR longitude < -180 OR longitude > 180
      OR latitude < -90 OR latitude > 90
  );

-- 4) campus bounding box check for enabled points
SELECT COUNT(*) AS enabled_out_of_campus_box
FROM poi
WHERE enabled = 1
  AND (
      longitude < 118.7060 OR longitude > 118.7260
      OR latitude < 32.1980 OR latitude > 32.2085
  );

-- 5) duplicate names (for manual review)
SELECT name, COUNT(*) AS cnt
FROM poi
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY cnt DESC, name ASC;

-- 6) opening hours missing or blank (enabled points)
SELECT COUNT(*) AS enabled_missing_opening_hours
FROM poi
WHERE enabled = 1
  AND (opening_hours IS NULL OR TRIM(opening_hours) = '');
