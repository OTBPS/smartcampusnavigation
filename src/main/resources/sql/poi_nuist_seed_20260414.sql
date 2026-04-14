-- NUIST POI seed data batch 2 (auto-selected core places via AMap place search)
-- Generated on 2026-04-14; insert by unique name.

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学信息中心', 'service_center', 118.7171680, 32.2048630, 'NUIST core place: 南京信息工程大学信息中心', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学信息中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学现代教育技术中心', 'service_center', 118.7172090, 32.2048980, 'NUIST core place: 南京信息工程大学现代教育技术中心', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学现代教育技术中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学学生事务与发展中心', 'service_center', 118.7176580, 32.2045720, 'NUIST core place: 南京信息工程大学学生事务与发展中心', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学学生事务与发展中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学-地理科学学院', 'college', 118.7164760, 32.2057940, 'NUIST core place: 南京信息工程大学-地理科学学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学-地理科学学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学软件工程与信息服务实践教育中心', 'service_center', 118.7177470, 32.2045800, 'NUIST core place: 南京信息工程大学软件工程与信息服务实践教育中心', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学软件工程与信息服务实践教育中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学江苏省技术转移中心', 'service_center', 118.7177900, 32.2045150, 'NUIST core place: 南京信息工程大学江苏省技术转移中心', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学江苏省技术转移中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学互联网工程实践教育中心', 'service_center', 118.7126590, 32.2032120, 'NUIST core place: 南京信息工程大学互联网工程实践教育中心', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学互联网工程实践教育中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学长望学院', 'college', 118.7178930, 32.2045810, 'NUIST core place: 南京信息工程大学长望学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学长望学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学生态研究院', 'research_institute', 118.7183040, 32.2026520, 'NUIST core place: 南京信息工程大学生态研究院', '08:00-18:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学生态研究院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学应急管理学院', 'college', 118.7124580, 32.2024230, 'NUIST core place: 南京信息工程大学应急管理学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学应急管理学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学集成电路学院', 'college', 118.7123110, 32.2026960, 'NUIST core place: 南京信息工程大学集成电路学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学集成电路学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学遥感学院', 'college', 118.7176000, 32.2057820, 'NUIST core place: 南京信息工程大学遥感学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学遥感学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学遥感与测绘工程学院', 'college', 118.7176000, 32.2057820, 'NUIST core place: 南京信息工程大学遥感与测绘工程学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学遥感与测绘工程学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学数学与统计学院', 'college', 118.7181240, 32.2054030, 'NUIST core place: 南京信息工程大学数学与统计学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学数学与统计学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学物理与光电工程学院', 'college', 118.7186010, 32.2053190, 'NUIST core place: 南京信息工程大学物理与光电工程学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学物理与光电工程学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学中苑教职工活动中心', 'residential_area', 118.7193820, 32.2038450, 'NUIST core place: 南京信息工程大学中苑教职工活动中心', '00:00-24:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学中苑教职工活动中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学-化学与材料学院', 'college', 118.7115290, 32.2017180, 'NUIST core place: 南京信息工程大学-化学与材料学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学-化学与材料学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学气候变化与公共政策研究院', 'research_institute', 118.7112590, 32.2016700, 'NUIST core place: 南京信息工程大学气候变化与公共政策研究院', '08:00-18:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学气候变化与公共政策研究院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学维世德法律研究院', 'research_institute', 118.7112140, 32.2016590, 'NUIST core place: 南京信息工程大学维世德法律研究院', '08:00-18:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学维世德法律研究院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学(中苑)-大学生体质测试中心', 'sports', 118.7116010, 32.2006880, 'NUIST core place: 南京信息工程大学(中苑)-大学生体质测试中心', '06:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学(中苑)-大学生体质测试中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学语言文化学院', 'college', 118.7207250, 32.2045830, 'NUIST core place: 南京信息工程大学语言文化学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学语言文化学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学水文与水资源工程学院', 'college', 118.7211250, 32.2037750, 'NUIST core place: 南京信息工程大学水文与水资源工程学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学水文与水资源工程学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学', 'campus_poi', 118.7153830, 32.2034070, 'NUIST core place: 南京信息工程大学', '08:00-20:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学应用技术学院', 'college', 118.7093250, 32.2003250, 'NUIST core place: 南京信息工程大学应用技术学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学应用技术学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学气候与气象灾害协同创新中心', 'service_center', 118.7224940, 32.2046100, 'NUIST core place: 南京信息工程大学气候与气象灾害协同创新中心', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学气候与气象灾害协同创新中心');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学校史馆', 'campus_poi', 118.7138710, 32.2029520, 'NUIST core place: 南京信息工程大学校史馆', '08:00-20:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学校史馆');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学院士林', 'college', 118.7081240, 32.2003180, 'NUIST core place: 南京信息工程大学院士林', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学院士林');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学研究生公寓', 'residential_area', 118.7157160, 32.2053570, 'NUIST core place: 南京信息工程大学研究生公寓', '00:00-24:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学研究生公寓');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学科技产业处', 'service_center', 118.7170250, 32.2048750, 'NUIST core place: 南京信息工程大学科技产业处', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学科技产业处');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学信息化建设与管理处', 'service_center', 118.7171580, 32.2049250, 'NUIST core place: 南京信息工程大学信息化建设与管理处', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学信息化建设与管理处');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学沃特福德学院', 'college', 118.7080270, 32.1994570, 'NUIST core place: 南京信息工程大学沃特福德学院', '08:00-22:00', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学沃特福德学院');

INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled)
SELECT '南京信息工程大学总务处', 'service_center', 118.7177980, 32.2033860, 'NUIST core place: 南京信息工程大学总务处', '08:00-17:30', 1
WHERE NOT EXISTS (SELECT 1 FROM poi WHERE name = '南京信息工程大学总务处');

