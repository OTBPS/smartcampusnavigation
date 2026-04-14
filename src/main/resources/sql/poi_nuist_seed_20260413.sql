-- NUIST POI seed data (sourced via AMap Web Service place search on 2026-04-13)
-- This script is idempotent by name: each row inserts only when the same name does not exist.

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学图书馆', 'library', 118.7134970, 32.2030200,
       'Main campus library building', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学图书馆');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学大学生活动中心', 'activity_center', 118.7195640, 32.2033870,
       'Student activity center', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学大学生活动中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学大学生活动中心小剧场', 'activity_center', 118.7193760, 32.2033420,
       'Small theater in student activity center', '09:00-21:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学大学生活动中心小剧场');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学大礼堂', 'auditorium', 118.7172810, 32.2029890,
       'Campus auditorium for lectures and events', '08:00-21:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学大礼堂');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学东苑体育馆', 'gymnasium', 118.7247670, 32.2059980,
       'Indoor gymnasium in East campus zone', '06:30-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学东苑体育馆');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学东苑田径场', 'stadium', 118.7257020, 32.2066240,
       'East campus athletics track and field', '06:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学东苑田径场');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学风云赛场', 'stadium', 118.7161740, 32.2039670,
       'Outdoor sports field near campus center', '06:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学风云赛场');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学-中苑主田径场', 'stadium', 118.7123220, 32.2006010,
       'Main Zhongyuan athletics field', '06:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学-中苑主田径场');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学西苑操场', 'stadium', 118.7072750, 32.2008130,
       'West campus playground and sports field', '06:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学西苑操场');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学信息科技大楼', 'teaching_building', 118.7097060, 32.1998070,
       'Information technology teaching building', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学信息科技大楼');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学培训楼', 'teaching_building', 118.7249680, 32.2049300,
       'Training and classroom building', '08:00-21:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学培训楼');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学亚培楼', 'teaching_building', 118.7182530, 32.2026690,
       'Yapei teaching building', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学亚培楼');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学文德楼南区', 'teaching_building', 118.7208250, 32.2030250,
       'Wende building south zone', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学文德楼南区');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学自动化学院', 'college', 118.7112540, 32.2027720,
       'School of Automation', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学自动化学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学环境科学与工程学院', 'college', 118.7123750, 32.2031790,
       'School of Environmental Science and Engineering', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学环境科学与工程学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学电子信息工程学院', 'college', 118.7091840, 32.2002080,
       'School of Electronic and Information Engineering', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学电子信息工程学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学地理与遥感学院', 'college', 118.7175020, 32.2058010,
       'School of Geography and Remote Sensing', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学地理与遥感学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学海洋科学学院', 'college', 118.7207300, 32.2045800,
       'School of Marine Sciences', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学海洋科学学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学-大气科学学院', 'college', 118.7225210, 32.2046140,
       'School of Atmospheric Sciences', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学-大气科学学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学商学院', 'college', 118.7113710, 32.2018070,
       'Business school building', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学商学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学-艺术学院', 'college', 118.7112620, 32.2016660,
       'Art school building', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学-艺术学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学食堂', 'canteen', 118.7199520, 32.2064710,
       'Main campus canteen', '06:30-23:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学食堂');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学西苑新食堂', 'canteen', 118.7063950, 32.2041480,
       'West campus new canteen', '07:00-21:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学西苑新食堂');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学-教职工食堂', 'canteen', 118.7164150, 32.2047260,
       'Faculty canteen', '10:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学-教职工食堂');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学中苑老食堂', 'canteen', 118.7164100, 32.2023720,
       'Old canteen in Zhongyuan', '06:30-21:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学中苑老食堂');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '中苑新食堂', 'canteen', 118.7140790, 32.2004910,
       'New canteen in Zhongyuan', '07:00-21:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '中苑新食堂');
