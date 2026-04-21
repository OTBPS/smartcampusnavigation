package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.dto.route.WalkingRouteQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.entity.Poi;
import com.nuist.pengbo.smartcampusnavigation.mapper.PoiMapper;
import com.nuist.pengbo.smartcampusnavigation.service.CampusRouteAdviceService;
import com.nuist.pengbo.smartcampusnavigation.service.WeatherRiskEvaluator;
import com.nuist.pengbo.smartcampusnavigation.service.WeatherService;
import com.nuist.pengbo.smartcampusnavigation.vo.route.RouteAdviceVO;
import com.nuist.pengbo.smartcampusnavigation.vo.weather.WeatherCurrentVO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class CampusRouteAdviceServiceImpl implements CampusRouteAdviceService {
    private static final double EARTH_RADIUS_METERS = 6371000.0;
    private static final double SHELTER_DISTANCE_THRESHOLD_METERS = 50.0;
    private static final int MAX_COVERED_SHORTLIST = 5;
    private static final int DEFAULT_COVERED_PRIORITY = 50;

    private static final Set<String> KNOWN_TYPES = Set.of(
            "administrative_office", "college_office", "service_center", "teaching_building",
            "laboratory_building", "library", "academy_building", "canteen", "restaurant",
            "cafe", "gymnasium", "stadium", "playground", "basketball_court", "football_field",
            "sports_facility", "residential_area", "dorm_service", "college"
    );

    private static final Set<String> COVERED_WEATHER_FAMILIES = Set.of("rain_family", "snow_family");

    private static final List<String> COVERED_CANDIDATE_WHITELIST = List.of(
            "NUIST Yifu Building",
            "NUIST Linjiang Building",
            "NUIST Yuejiang Building",
            "NUIST Wende Building South",
            "NUIST Meteorology Building",
            "NUIST Beichen Building",
            "NUIST Information Center",
            "NUIST Oufang Building",
            "NUIST Faculty Canteen",
            "NUIST Shangxian Building",
            "NUIST Lizheng Building",
            "NUIST Grand Auditorium",
            "NUIST Student Activity Center",
            "NUIST Jijia Building"
    );

    private static final Map<String, Integer> COVERED_PRIORITY_MAP = buildCoveredPriorityMap();

    private static final List<CampusRouteRule> RULES = List.of(
            new CampusRouteRule(
                    Set.of("rain_family", "snow_family"),
                    Set.of("dorm_service", "residential_area"),
                    Set.of("teaching_building", "academy_building", "college"),
                    "covered_path",
                    "Rainy weather detected for dormitory-to-class routes. Prefer covered passages when possible."
            ),
            new CampusRouteRule(
                    Set.of("rain_family", "snow_family"),
                    Set.of("library"),
                    Set.of("canteen", "restaurant", "cafe"),
                    "covered_path",
                    "Wet weather detected. Prefer sheltered links near major buildings before entering dining areas."
            ),
            new CampusRouteRule(
                    Set.of("strong_wind", "low_visibility"),
                    Set.of("teaching_building", "academy_building", "college"),
                    Set.of("sports_facility", "stadium", "playground", "gymnasium", "basketball_court", "football_field"),
                    "avoid_open_square",
                    "Strong wind or low visibility detected. Prefer routes close to major buildings and avoid exposed open areas."
            )
    );

    private final WeatherService weatherService;
    private final WeatherRiskEvaluator weatherRiskEvaluator;
    private final PoiMapper poiMapper;

    public CampusRouteAdviceServiceImpl(WeatherService weatherService,
                                        WeatherRiskEvaluator weatherRiskEvaluator,
                                        PoiMapper poiMapper) {
        this.weatherService = weatherService;
        this.weatherRiskEvaluator = weatherRiskEvaluator;
        this.poiMapper = poiMapper;
    }

    @Override
    public RouteAdviceVO buildAdvice(WalkingRouteQueryDTO queryDTO,
                                     List<List<Double>> baselinePolyline,
                                     boolean allowCoveredWaypointRecommendation) {
        WeatherCurrentVO weather;
        try {
            weather = weatherService.getCurrentWeather();
        } catch (Exception ex) {
            return null;
        }
        if (weather == null) {
            return null;
        }

        WeatherRiskEvaluator.WeatherRiskResult riskResult = weatherRiskEvaluator.evaluate(
                weather.getWeatherText(),
                weather.getWindScale(),
                weather.getTemp()
        );
        if (riskResult == null || "NONE".equalsIgnoreCase(riskResult.getRiskLevel())) {
            return null;
        }

        RouteAdviceVO advice = new RouteAdviceVO();
        advice.setWeatherRiskLevel(riskResult.getRiskLevel());
        advice.setWeatherRiskType(riskResult.getRiskType());

        String originType = normalizeType(queryDTO == null ? null : queryDTO.getOriginType());
        String destinationType = normalizeType(queryDTO == null ? null : queryDTO.getDestinationType());
        CampusRouteRule matchedRule = matchRule(riskResult.getTriggerFamily(), originType, destinationType);

        if (!allowCoveredWaypointRecommendation) {
            advice.setSmartTravelAdvice(buildAdviceTextWithoutCoveredCandidate(riskResult.getRiskType(), matchedRule));
            advice.setRecommendedStrategyTag(buildStrategyTagWithoutCoveredCandidate(riskResult.getRiskType(), matchedRule));
            advice.setRecommendedWaypointName(null);
            advice.setRecommendedWaypointLng(null);
            advice.setRecommendedWaypointLat(null);
            return advice;
        }

        CoveredCandidate selectedCandidate = selectCoveredCandidate(
                riskResult.getTriggerFamily(),
                baselinePolyline
        );

        if (selectedCandidate != null) {
            advice.setRecommendedStrategyTag("covered_path");
            advice.setRecommendedWaypointName(selectedCandidate.name);
            advice.setRecommendedWaypointLng(selectedCandidate.lng);
            advice.setRecommendedWaypointLat(selectedCandidate.lat);
            advice.setSmartTravelAdvice(buildAdviceTextWithCoveredCandidate(riskResult.getRiskType(), matchedRule, selectedCandidate.name));
            return advice;
        }

        advice.setSmartTravelAdvice(buildAdviceTextWithoutCoveredCandidate(riskResult.getRiskType(), matchedRule));
        advice.setRecommendedStrategyTag(buildStrategyTagWithoutCoveredCandidate(riskResult.getRiskType(), matchedRule));
        advice.setRecommendedWaypointName(null);
        advice.setRecommendedWaypointLng(null);
        advice.setRecommendedWaypointLat(null);
        return advice;
    }

    private CoveredCandidate selectCoveredCandidate(String triggerFamily, List<List<Double>> baselinePolyline) {
        if (!StringUtils.hasText(triggerFamily) || !COVERED_WEATHER_FAMILIES.contains(triggerFamily)) {
            return null;
        }
        List<RoutePoint> routePoints = normalizePolylinePoints(baselinePolyline);
        if (routePoints.size() < 2) {
            return null;
        }

        List<CoveredCandidate> resolved = resolveCoveredCandidatesByExactName();
        if (resolved.isEmpty()) {
            return null;
        }

        for (CoveredCandidate candidate : resolved) {
            candidate.distanceToPolylineMeters = distancePointToPolylineMeters(candidate.lng, candidate.lat, routePoints);
        }

        List<CoveredCandidate> nearbyCandidates = resolved.stream()
                .filter(item -> item.distanceToPolylineMeters <= SHELTER_DISTANCE_THRESHOLD_METERS)
                .sorted(Comparator
                        .comparingDouble((CoveredCandidate item) -> item.distanceToPolylineMeters)
                        .thenComparing((CoveredCandidate left, CoveredCandidate right) -> Integer.compare(right.priority, left.priority))
                        .thenComparing(item -> item.name))
                .limit(MAX_COVERED_SHORTLIST)
                .toList();

        if (nearbyCandidates.isEmpty()) {
            return null;
        }
        return nearbyCandidates.get(0);
    }

    private List<CoveredCandidate> resolveCoveredCandidatesByExactName() {
        List<CoveredCandidate> resolved = new ArrayList<>();
        for (String candidateName : COVERED_CANDIDATE_WHITELIST) {
            List<Poi> matchedPois = poiMapper.selectEnabledByExactName(candidateName);
            if (matchedPois == null || matchedPois.size() != 1) {
                continue;
            }
            Poi poi = matchedPois.get(0);
            if (!hasValidCoordinate(poi.getLongitude(), poi.getLatitude())) {
                continue;
            }
            CoveredCandidate candidate = new CoveredCandidate();
            candidate.name = poi.getName();
            candidate.lng = poi.getLongitude().doubleValue();
            candidate.lat = poi.getLatitude().doubleValue();
            candidate.priority = COVERED_PRIORITY_MAP.getOrDefault(candidate.name, DEFAULT_COVERED_PRIORITY);
            candidate.distanceToPolylineMeters = Double.MAX_VALUE;
            resolved.add(candidate);
        }
        return resolved;
    }

    private List<RoutePoint> normalizePolylinePoints(List<List<Double>> baselinePolyline) {
        if (baselinePolyline == null || baselinePolyline.isEmpty()) {
            return List.of();
        }
        List<RoutePoint> points = new ArrayList<>();
        for (List<Double> rawPoint : baselinePolyline) {
            if (rawPoint == null || rawPoint.size() < 2) {
                continue;
            }
            Double lng = rawPoint.get(0);
            Double lat = rawPoint.get(1);
            if (!isValidCoordinateDouble(lng, lat)) {
                continue;
            }
            points.add(new RoutePoint(lng, lat));
        }
        return points;
    }

    private double distancePointToPolylineMeters(double lng, double lat, List<RoutePoint> routePoints) {
        if (routePoints == null || routePoints.size() < 2) {
            return Double.MAX_VALUE;
        }
        double referenceLatitude = calculateReferenceLatitude(routePoints);
        double[] point = toMeters(lng, lat, referenceLatitude);

        double minDistance = Double.MAX_VALUE;
        for (int i = 0; i < routePoints.size() - 1; i++) {
            RoutePoint start = routePoints.get(i);
            RoutePoint end = routePoints.get(i + 1);
            double[] startXY = toMeters(start.lng, start.lat, referenceLatitude);
            double[] endXY = toMeters(end.lng, end.lat, referenceLatitude);
            double distance = pointToSegmentDistance(
                    point[0], point[1],
                    startXY[0], startXY[1],
                    endXY[0], endXY[1]
            );
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
        return minDistance;
    }

    private double calculateReferenceLatitude(List<RoutePoint> routePoints) {
        if (routePoints == null || routePoints.isEmpty()) {
            return 0.0;
        }
        double sum = 0.0;
        for (RoutePoint point : routePoints) {
            sum += point.lat;
        }
        return sum / routePoints.size();
    }

    private double[] toMeters(double lng, double lat, double referenceLatitude) {
        double cosRef = Math.cos(Math.toRadians(referenceLatitude));
        double x = Math.toRadians(lng) * EARTH_RADIUS_METERS * cosRef;
        double y = Math.toRadians(lat) * EARTH_RADIUS_METERS;
        return new double[]{x, y};
    }

    private double pointToSegmentDistance(double px, double py,
                                          double x1, double y1,
                                          double x2, double y2) {
        double dx = x2 - x1;
        double dy = y2 - y1;
        if (dx == 0 && dy == 0) {
            return euclideanDistance(px, py, x1, y1);
        }

        double t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
        if (t < 0) {
            return euclideanDistance(px, py, x1, y1);
        }
        if (t > 1) {
            return euclideanDistance(px, py, x2, y2);
        }

        double projectionX = x1 + t * dx;
        double projectionY = y1 + t * dy;
        return euclideanDistance(px, py, projectionX, projectionY);
    }

    private double euclideanDistance(double x1, double y1, double x2, double y2) {
        double dx = x1 - x2;
        double dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private String buildAdviceTextWithCoveredCandidate(String riskType, CampusRouteRule matchedRule, String candidateName) {
        if (matchedRule != null && StringUtils.hasText(matchedRule.adviceText)) {
            return matchedRule.adviceText + " Recommended covered waypoint: " + candidateName + ".";
        }
        return switch (normalizeInput(riskType)) {
            case "rain_family", "snow_family" ->
                    "Rainy or snowy conditions detected. Recommended covered waypoint: " + candidateName + ".";
            default ->
                    "Weather risk detected. Recommended covered waypoint: " + candidateName + ".";
        };
    }

    private String buildAdviceTextWithoutCoveredCandidate(String riskType, CampusRouteRule matchedRule) {
        if (matchedRule != null && StringUtils.hasText(matchedRule.adviceText)) {
            return matchedRule.adviceText;
        }
        return buildGenericAdvice(riskType);
    }

    private String buildStrategyTagWithoutCoveredCandidate(String riskType, CampusRouteRule matchedRule) {
        if (matchedRule != null && StringUtils.hasText(matchedRule.strategyTag)) {
            return matchedRule.strategyTag;
        }
        return buildGenericStrategyTag(riskType);
    }

    private CampusRouteRule matchRule(String triggerFamily, String originType, String destinationType) {
        if (!StringUtils.hasText(triggerFamily)
                || !StringUtils.hasText(originType)
                || !StringUtils.hasText(destinationType)) {
            return null;
        }
        for (CampusRouteRule rule : RULES) {
            if (!rule.weatherFamilies.contains(triggerFamily)) {
                continue;
            }
            if (!rule.originTypes.contains(originType)) {
                continue;
            }
            if (!rule.destinationTypes.contains(destinationType)) {
                continue;
            }
            return rule;
        }
        return null;
    }

    private String buildGenericAdvice(String riskType) {
        if (!StringUtils.hasText(riskType)) {
            return "Weather risk detected. Please watch outdoor conditions and keep enough travel buffer.";
        }
        return switch (normalizeInput(riskType)) {
            case "rain_family", "snow_family" ->
                    "Rain or snow detected. Prefer covered walkways and avoid long open-road segments.";
            case "low_visibility" ->
                    "Low visibility detected. Walk carefully, stay near main roads, and avoid shortcuts.";
            case "strong_wind" ->
                    "Strong wind detected. Prefer routes close to major buildings and avoid exposed squares.";
            case "extreme_temperature" ->
                    "Extreme temperature detected. Reduce long outdoor walks and prepare hydration or warm clothing.";
            default ->
                    "Weather risk detected. Please watch outdoor conditions and keep enough travel buffer.";
        };
    }

    private String buildGenericStrategyTag(String riskType) {
        if (!StringUtils.hasText(riskType)) {
            return "weather_caution";
        }
        return switch (normalizeInput(riskType)) {
            case "rain_family", "snow_family" -> "covered_path";
            case "low_visibility" -> "low_visibility";
            case "strong_wind" -> "avoid_open_square";
            case "extreme_temperature" -> "temperature_protection";
            default -> "weather_caution";
        };
    }

    private String normalizeType(String type) {
        if (!StringUtils.hasText(type)) {
            return "";
        }
        String normalized = type.trim().toLowerCase(Locale.ROOT);
        return KNOWN_TYPES.contains(normalized) ? normalized : "";
    }

    private String normalizeInput(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "";
    }

    private boolean hasValidCoordinate(BigDecimal lng, BigDecimal lat) {
        if (lng == null || lat == null) {
            return false;
        }
        return lng.compareTo(BigDecimal.valueOf(-180)) >= 0
                && lng.compareTo(BigDecimal.valueOf(180)) <= 0
                && lat.compareTo(BigDecimal.valueOf(-90)) >= 0
                && lat.compareTo(BigDecimal.valueOf(90)) <= 0;
    }

    private boolean isValidCoordinateDouble(Double lng, Double lat) {
        if (lng == null || lat == null || !Double.isFinite(lng) || !Double.isFinite(lat)) {
            return false;
        }
        return lng >= -180.0 && lng <= 180.0 && lat >= -90.0 && lat <= 90.0;
    }

    private static Map<String, Integer> buildCoveredPriorityMap() {
        Map<String, Integer> priorities = new HashMap<>();
        priorities.put("NUIST Student Activity Center", 100);
        priorities.put("NUIST Grand Auditorium", 95);
        priorities.put("NUIST Faculty Canteen", 90);
        priorities.put("NUIST Information Center", 85);
        priorities.put("NUIST Meteorology Building", 80);
        return Map.copyOf(priorities);
    }

    private static class CampusRouteRule {
        private final Set<String> weatherFamilies;
        private final Set<String> originTypes;
        private final Set<String> destinationTypes;
        private final String strategyTag;
        private final String adviceText;

        private CampusRouteRule(Set<String> weatherFamilies,
                                Set<String> originTypes,
                                Set<String> destinationTypes,
                                String strategyTag,
                                String adviceText) {
            this.weatherFamilies = weatherFamilies;
            this.originTypes = originTypes;
            this.destinationTypes = destinationTypes;
            this.strategyTag = strategyTag;
            this.adviceText = adviceText;
        }
    }

    private static class RoutePoint {
        private final double lng;
        private final double lat;

        private RoutePoint(double lng, double lat) {
            this.lng = lng;
            this.lat = lat;
        }
    }

    private static class CoveredCandidate {
        private String name;
        private double lng;
        private double lat;
        private int priority;
        private double distanceToPolylineMeters;
    }
}
