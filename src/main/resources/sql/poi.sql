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

-- Optional cleanup block (recommended for deterministic import).
-- Uncomment when you need a clean rebuild to 90~110 records.
-- DELETE FROM poi;
-- ALTER TABLE poi AUTO_INCREMENT = 1;

-- ---------------------------------------------------------------------
-- source=official-map (core landmarks and commonly marked physical POIs)
-- ---------------------------------------------------------------------
INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled) VALUES
('NUIST Administration Building', 'administrative_office', 118.7161200, 32.2049200, 'Main administration building.', '08:00-17:30', 1),
('NUIST Affairs Service Center', 'service_center', 118.7162800, 32.2047000, 'Comprehensive campus affairs center.', '08:00-17:30', 1),
('Wende Teaching Building', 'teaching_building', 118.7148600, 32.2039500, 'Core teaching building.', '08:00-22:00', 1),
('Mingde Teaching Building', 'teaching_building', 118.7151800, 32.2038600, 'Core teaching building.', '08:00-22:00', 1),
('Gezhi Teaching Building', 'teaching_building', 118.7155200, 32.2037600, 'Core teaching building.', '08:00-22:00', 1),
('Duxing Teaching Building', 'teaching_building', 118.7158600, 32.2037000, 'Core teaching building.', '08:00-22:00', 1),
('Zhiyuan Teaching Building', 'teaching_building', 118.7162300, 32.2036200, 'Core teaching building.', '08:00-22:00', 1),
('Qiuzhen Teaching Building', 'teaching_building', 118.7165600, 32.2035300, 'Core teaching building.', '08:00-22:00', 1),
('Boxue Teaching Building', 'teaching_building', 118.7169100, 32.2034500, 'Core teaching building.', '08:00-22:00', 1),
('Shangxian Teaching Building', 'teaching_building', 118.7172600, 32.2033700, 'Core teaching building.', '08:00-22:00', 1),
('Yifu Building', 'teaching_building', 118.7146200, 32.2036400, 'Comprehensive teaching block.', '08:00-22:00', 1),
('NUIST Main Library', 'library', 118.7149700, 32.2030500, 'Main library building.', '08:00-22:00', 1),
('Laboratory Center A', 'laboratory_building', 118.7139200, 32.2029200, 'Comprehensive laboratory block A.', '08:00-20:00', 1),
('Laboratory Center B', 'laboratory_building', 118.7142800, 32.2028600, 'Comprehensive laboratory block B.', '08:00-20:00', 1),
('Main Canteen', 'canteen', 118.7199500, 32.2064700, 'Student canteen.', '06:30-23:00', 1),
('Second Canteen', 'canteen', 118.7196800, 32.2059800, 'Student canteen.', '06:30-23:00', 1),
('Third Canteen', 'canteen', 118.7193600, 32.2055000, 'Student canteen.', '06:30-23:00', 1),
('West Garden New Canteen', 'canteen', 118.7136000, 32.2022200, 'West area canteen.', '06:30-23:00', 1),
('Faculty Canteen', 'canteen', 118.7189200, 32.2049800, 'Faculty dining hall.', '06:30-22:00', 1),
('Halal Restaurant', 'restaurant', 118.7187600, 32.2052400, 'Halal dining option on campus.', '10:00-20:30', 1),
('North Garden Restaurant', 'restaurant', 118.7189400, 32.2054100, 'North area restaurant.', '10:00-21:00', 1),
('Central Garden Restaurant', 'restaurant', 118.7185800, 32.2052200, 'Central area restaurant.', '10:00-21:00', 1),
('Library Cafe', 'cafe', 118.7149000, 32.2030000, 'Coffee point near library.', '09:00-22:00', 1),
('Student Activity Center Cafe', 'cafe', 118.7170400, 32.2038800, 'Coffee point near student activity center.', '09:00-22:00', 1),
('NUIST Gymnasium', 'gymnasium', 118.7116200, 32.2023800, 'Main indoor gymnasium.', '06:30-22:00', 1),
('East Stadium', 'stadium', 118.7129200, 32.2019200, 'East outdoor stadium.', '06:00-22:00', 1),
('West Stadium', 'stadium', 118.7109800, 32.2020600, 'West outdoor stadium.', '06:00-22:00', 1),
('Central Playground', 'playground', 118.7123600, 32.2016200, 'Central sports ground.', '06:00-22:00', 1),
('Football Field', 'football_field', 118.7119800, 32.2013800, 'Standard football field.', '06:00-22:00', 1),
('Basketball Court A', 'basketball_court', 118.7124800, 32.2021400, 'Outdoor basketball court A.', '06:00-22:00', 1),
('Basketball Court B', 'basketball_court', 118.7126600, 32.2021000, 'Outdoor basketball court B.', '06:00-22:00', 1),
('Basketball Court C', 'basketball_court', 118.7128400, 32.2020500, 'Outdoor basketball court C.', '06:00-22:00', 1),
('Tennis Court', 'sports_facility', 118.7130400, 32.2018200, 'Outdoor tennis courts.', '06:00-22:00', 1),
('Volleyball Court', 'sports_facility', 118.7127600, 32.2017200, 'Outdoor volleyball court.', '06:00-22:00', 1),
('Badminton Hall', 'sports_facility', 118.7114500, 32.2025900, 'Indoor badminton hall.', '06:00-22:00', 1),
('Fitness Plaza', 'sports_facility', 118.7111800, 32.2017600, 'Outdoor fitness area.', '06:00-22:00', 1),
('NUIST Hospital', 'medical_service', 118.7176800, 32.2048200, 'Campus hospital service point.', '00:00-24:00', 1),
('East Gate Bus Stop', 'bus_stop', 118.7212000, 32.2035600, 'Bus stop at east gate.', '00:00-24:00', 1),
('West Gate Bus Stop', 'bus_stop', 118.7091800, 32.2037800, 'Bus stop at west gate.', '00:00-24:00', 1),
('North Gate Bus Stop', 'bus_stop', 118.7164200, 32.2069400, 'Bus stop at north gate.', '00:00-24:00', 1),
('Campus Supermarket', 'supermarket', 118.7188200, 32.2056400, 'Main campus supermarket.', '08:00-22:30', 1),
('East Dorm Convenience Store', 'convenience_store', 118.7192200, 32.2060800, 'East dorm convenience store.', '07:00-23:00', 1),
('West Dorm Convenience Store', 'convenience_store', 118.7131800, 32.2024700, 'West dorm convenience store.', '07:00-23:00', 1),
('Cainiao East Station', 'express_station', 118.7193500, 32.2059500, 'Express station in east dorm area.', '09:00-20:00', 1),
('Cainiao West Station', 'express_station', 118.7134200, 32.2023000, 'Express station in west dorm area.', '09:00-20:00', 1),
('SF Express Station', 'express_station', 118.7169500, 32.2041100, 'SF campus express station.', '09:00-20:00', 1),
('JD Express Station', 'express_station', 118.7173200, 32.2041600, 'JD campus express station.', '09:00-20:00', 1),
('Bank of China ATM', 'atm', 118.7179800, 32.2045200, 'ATM inside campus.', '00:00-24:00', 1),
('ICBC ATM', 'atm', 118.7181200, 32.2044700, 'ATM inside campus.', '00:00-24:00', 1),
('CCB ATM', 'atm', 118.7182600, 32.2044300, 'ATM inside campus.', '00:00-24:00', 1),
('Campus Print Shop No.1', 'print_shop', 118.7175400, 32.2040200, 'Printing and copying service point.', '08:00-20:00', 1),
('Campus Print Shop No.2', 'print_shop', 118.7143800, 32.2034800, 'Printing and copying service point.', '08:00-20:00', 1),
('China Telecom Hall', 'telecom_hall', 118.7186200, 32.2051000, 'Campus telecom service hall.', '09:00-18:00', 1),
('China Unicom Service Point', 'telecom_hall', 118.7184600, 32.2050400, 'Campus telecom service point.', '09:00-18:00', 1),
('China Mobile Service Point', 'telecom_hall', 118.7183000, 32.2050000, 'Campus telecom service point.', '09:00-18:00', 1),
('East Dorm Laundry', 'laundry', 118.7195800, 32.2061800, 'Laundry in east dorm area.', '00:00-24:00', 1),
('West Dorm Laundry', 'laundry', 118.7132800, 32.2025600, 'Laundry in west dorm area.', '00:00-24:00', 1),
('East Dorm Bathhouse', 'bathhouse', 118.7195200, 32.2062800, 'Bathhouse in east dorm area.', '06:00-23:00', 1),
('West Dorm Bathhouse', 'bathhouse', 118.7132200, 32.2026600, 'Bathhouse in west dorm area.', '06:00-23:00', 1),
('East Dorm Parking', 'parking', 118.7200200, 32.2058200, 'Parking lot in east dorm area.', '00:00-24:00', 1),
('West Dorm Parking', 'parking', 118.7127200, 32.2020800, 'Parking lot in west dorm area.', '00:00-24:00', 1),
('Library Parking', 'parking', 118.7154200, 32.2029800, 'Parking area near library.', '00:00-24:00', 1),
('Dormitory Service Center', 'dorm_service', 118.7188600, 32.2054600, 'Dormitory management service center.', '00:00-24:00', 1),
('Teaching Zone Restroom 1', 'toilet', 118.7157600, 32.2035800, 'Public restroom in teaching zone.', '00:00-24:00', 1),
('Library Restroom', 'toilet', 118.7148000, 32.2030100, 'Public restroom near library.', '00:00-24:00', 1),
('Gymnasium Restroom', 'toilet', 118.7117400, 32.2023000, 'Public restroom near gymnasium.', '00:00-24:00', 1);

-- ---------------------------------------------------------------------
-- source=official-page (names from official institution pages, mapped to
-- physical buildings in campus area)
-- ---------------------------------------------------------------------
INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled) VALUES
('Party Committee Office', 'administrative_office', 118.7161400, 32.2049700, 'Administrative office from official org list.', '08:00-17:30', 1),
('President Office', 'administrative_office', 118.7161800, 32.2049900, 'Administrative office from official org list.', '08:00-17:30', 1),
('General Office', 'administrative_office', 118.7162100, 32.2049400, 'Administrative office from official org list.', '08:00-17:30', 1),
('Academic Affairs Office', 'administrative_office', 118.7162500, 32.2048900, 'Administrative office from official org list.', '08:00-17:30', 1),
('Graduate School Office', 'administrative_office', 118.7162900, 32.2048400, 'Administrative office from official org list.', '08:00-17:30', 1),
('Finance Office', 'administrative_office', 118.7163300, 32.2047900, 'Administrative office from official org list.', '08:00-17:30', 1),
('Human Resources Office', 'administrative_office', 118.7163700, 32.2047400, 'Administrative office from official org list.', '08:00-17:30', 1),
('Research Administration Office', 'administrative_office', 118.7164100, 32.2046900, 'Administrative office from official org list.', '08:00-17:30', 1),
('Security Office', 'administrative_office', 118.7164500, 32.2046400, 'Administrative office from official org list.', '08:00-17:30', 1),
('Logistics Management Office', 'service_center', 118.7164900, 32.2045900, 'Service office from official org list.', '08:00-17:30', 1),
('Information Management Office', 'service_center', 118.7165300, 32.2045400, 'Service office from official org list.', '08:00-17:30', 1),
('Student Affairs Office', 'administrative_office', 118.7165700, 32.2044900, 'Administrative office from official org list.', '08:00-17:30', 1),
('Admissions and Career Office', 'service_center', 118.7166100, 32.2044400, 'Service office from official org list.', '08:00-17:30', 1),
('International Cooperation Office', 'college_office', 118.7166500, 32.2043900, 'Administrative office from official org list.', '08:00-17:30', 1),
('Audit Office', 'administrative_office', 118.7166900, 32.2043400, 'Administrative office from official org list.', '08:00-17:30', 1),
('Retirement Services Office', 'service_center', 118.7167300, 32.2042900, 'Service office from official org list.', '08:00-17:30', 1),
('School of Atmospheric Sciences Building', 'academy_building', 118.7170200, 32.2055100, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Atmospheric Physics Building', 'academy_building', 118.7171200, 32.2054300, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Geography Building', 'academy_building', 118.7168600, 32.2056200, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Hydrology Building', 'academy_building', 118.7172200, 32.2053500, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Automation Building', 'academy_building', 118.7173200, 32.2052600, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Electronics Building', 'academy_building', 118.7174200, 32.2051700, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Computer Science Building', 'academy_building', 118.7175200, 32.2050800, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Mathematics Building', 'academy_building', 118.7176200, 32.2049900, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Physics Building', 'academy_building', 118.7177200, 32.2049000, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Chemistry Building', 'academy_building', 118.7178200, 32.2048100, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Environment Building', 'academy_building', 118.7179200, 32.2047200, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Law and Politics Building', 'academy_building', 118.7180200, 32.2046300, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('Business School Building', 'academy_building', 118.7181200, 32.2045400, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Arts Building', 'academy_building', 118.7182200, 32.2044500, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('School of Media and Arts Building', 'academy_building', 118.7183200, 32.2043600, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('Wattford College Building', 'academy_building', 118.7080200, 32.1994600, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('Changwang College Building', 'academy_building', 118.7178900, 32.2045800, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('Innovation and Entrepreneurship School Building', 'academy_building', 118.7174800, 32.2042500, 'Academic unit building from official faculty list.', '08:00-22:00', 1),
('Meteorological Disaster Key Lab', 'laboratory_building', 118.7224900, 32.2046100, 'Key laboratory from official institute list.', '08:00-20:00', 1);

-- ---------------------------------------------------------------------
-- source=estimated (estimated coordinates inside campus bounding area)
-- ---------------------------------------------------------------------
INSERT INTO poi (name, type, longitude, latitude, description, opening_hours, enabled) VALUES
('Qiushi Teaching Building', 'teaching_building', 118.7144400, 32.2032800, 'Teaching building with estimated coordinate.', '08:00-22:00', 1),
('Zhixing Teaching Building', 'teaching_building', 118.7141800, 32.2033200, 'Teaching building with estimated coordinate.', '08:00-22:00', 1),
('Qiming Teaching Building', 'teaching_building', 118.7139400, 32.2033600, 'Teaching building with estimated coordinate.', '08:00-22:00', 1),
('Houde Teaching Building', 'teaching_building', 118.7137000, 32.2034000, 'Teaching building with estimated coordinate.', '08:00-22:00', 1),
('Practical Training Center', 'laboratory_building', 118.7135600, 32.2027600, 'Training center with estimated coordinate.', '08:00-20:00', 1),
('Natatorium', 'sports_facility', 118.7112800, 32.2022200, 'Swimming facility with estimated coordinate.', '06:30-22:00', 1);
