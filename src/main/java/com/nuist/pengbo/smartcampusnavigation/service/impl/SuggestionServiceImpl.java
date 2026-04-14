package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.suggestion.SuggestionContextQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.service.PoiService;
import com.nuist.pengbo.smartcampusnavigation.service.SuggestionService;
import com.nuist.pengbo.smartcampusnavigation.service.WeatherService;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import com.nuist.pengbo.smartcampusnavigation.vo.suggestion.SuggestionContextVO;
import com.nuist.pengbo.smartcampusnavigation.vo.weather.WeatherCurrentVO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class SuggestionServiceImpl implements SuggestionService {
    private static final String SCENE_POI_DETAIL = "poi_detail";
    private static final String SCENE_ROUTE_PLANNING = "route_planning";
    private static final String SCENE_HOME = "home";

    private static final LocalTime CLASS_AM_START = LocalTime.of(8, 0);
    private static final LocalTime CLASS_AM_END = LocalTime.of(12, 0);
    private static final LocalTime CLASS_PM_START = LocalTime.of(14, 0);
    private static final LocalTime CLASS_PM_END = LocalTime.of(18, 0);

    private static final DateTimeFormatter[] TIME_FORMATTERS = new DateTimeFormatter[] {
            DateTimeFormatter.ofPattern("H:mm"),
            DateTimeFormatter.ofPattern("HH:mm")
    };

    private final WeatherService weatherService;
    private final PoiService poiService;

    public SuggestionServiceImpl(WeatherService weatherService, PoiService poiService) {
        this.weatherService = weatherService;
        this.poiService = poiService;
    }

    @Override
    public SuggestionContextVO generateContextSuggestion(SuggestionContextQueryDTO queryDTO) {
        SuggestionContextQueryDTO safeQuery = queryDTO == null ? new SuggestionContextQueryDTO() : queryDTO;
        String sceneType = normalizeSceneType(safeQuery.getSceneType());
        LocalDateTime contextDateTime = resolveContextDateTime(safeQuery.getHour());
        WeatherCurrentVO weather = getWeatherOrNull();
        PoiVO currentPoi = resolvePoi(safeQuery.getPoiId());
        String poiType = currentPoi != null ? currentPoi.getType() : "";

        List<String> candidates = new ArrayList<>();
        appendOpeningHourSuggestions(candidates, sceneType, currentPoi, contextDateTime);
        appendSceneSuggestions(candidates, sceneType, poiType, safeQuery);
        appendWeatherSuggestions(candidates, weather, safeQuery, sceneType);
        appendTimeSuggestions(candidates, contextDateTime, sceneType, poiType);

        if (candidates.isEmpty()) {
            candidates.add("Weather data is temporarily unavailable. Use POI search and route planning first.");
            candidates.add("Please combine your current location with campus roads when planning your trip.");
        }

        SuggestionContextVO vo = new SuggestionContextVO();
        vo.setTitle(resolveTitle(sceneType));
        vo.setSuggestions(limitSuggestions(candidates, 3));
        vo.setGeneratedAt(LocalDateTime.now());
        return vo;
    }

    private void appendSceneSuggestions(List<String> candidates,
                                        String sceneType,
                                        String poiType,
                                        SuggestionContextQueryDTO queryDTO) {
        if (SCENE_ROUTE_PLANNING.equals(sceneType)) {
            if (queryDTO.getRouteDuration() != null && queryDTO.getRouteDuration() > 0) {
                candidates.add("Estimated walking time is " + formatDuration(queryDTO.getRouteDuration())
                        + ". Please leave enough time before departure.");
            } else if (queryDTO.getRouteDistance() != null && queryDTO.getRouteDistance() > 0) {
                candidates.add("Route distance is about " + formatDistance(queryDTO.getRouteDistance())
                        + ". Prefer major campus roads.");
            } else {
                candidates.add("Route generated. Watch for outdoor segments and pedestrian congestion.");
            }
            return;
        }

        if (!SCENE_POI_DETAIL.equals(sceneType) || !StringUtils.hasText(poiType)) {
            candidates.add("You can choose a transfer point near teaching zones or canteens to reduce detours.");
            return;
        }

        String normalizedType = poiType.toLowerCase(Locale.ROOT);
        if (containsAny(normalizedType, "canteen")) {
            candidates.add("Canteens are often crowded during lunch and dinner peak hours.");
            return;
        }
        if (containsAny(normalizedType, "library")) {
            candidates.add("For library visits, check closing time in advance and keep quiet in study zones.");
            return;
        }
        if (containsAny(normalizedType, "dormitory", "residential")) {
            candidates.add("At night in residential areas, use well-lit main roads whenever possible.");
            return;
        }
        if (containsAny(normalizedType, "teaching", "college", "school", "academy")) {
            candidates.add("Class change periods can be crowded near teaching buildings. Keep extra walking time.");
            return;
        }
        candidates.add("For this location, prefer primary campus roads over small side paths.");
    }

    private void appendOpeningHourSuggestions(List<String> candidates,
                                              String sceneType,
                                              PoiVO currentPoi,
                                              LocalDateTime contextDateTime) {
        if (!SCENE_POI_DETAIL.equals(sceneType) || currentPoi == null) {
            return;
        }

        String openingHours = normalizeOpeningHours(currentPoi.getOpeningHours());
        if (!StringUtils.hasText(openingHours)) {
            return;
        }

        LocalTime now = contextDateTime.toLocalTime();
        if (isOpenAt(openingHours, now)) {
            return;
        }

        if (isCanteenType(currentPoi.getType())) {
            PoiVO nearestOpenCanteen = findNearestOpenCanteen(currentPoi, now);
            if (nearestOpenCanteen == null) {
                candidates.add("This canteen is currently closed and no nearby open canteen was found.");
                return;
            }
            long distanceMeters = Math.round(distanceMeters(currentPoi, nearestOpenCanteen));
            candidates.add("This canteen is currently closed. Nearest open canteen: "
                    + nearestOpenCanteen.getName() + " (" + formatDistance(distanceMeters) + ").");
            return;
        }

        candidates.add("This location is currently closed (opening hours: " + openingHours + ").");
    }

    private void appendWeatherSuggestions(List<String> candidates,
                                          WeatherCurrentVO weather,
                                          SuggestionContextQueryDTO queryDTO,
                                          String sceneType) {
        if (weather == null || !StringUtils.hasText(weather.getWeatherText())) {
            candidates.add("Weather data is temporarily unavailable. Use POI search and route planning first.");
            return;
        }

        String weatherText = weather.getWeatherText().toLowerCase(Locale.ROOT);
        boolean severe = containsAny(weatherText,
                "storm", "thunder", "typhoon", "hail", "blizzard", "sandstorm",
                "暴雨", "雷暴", "台风", "冰雹", "强对流", "大雪", "沙尘");
        boolean rainy = containsAny(weatherText, "rain", "snow", "thunder", "雨", "雪", "雷");
        boolean windy = parseWindScale(weather.getWindScale()) >= 6 || containsAny(weatherText, "wind", "风");
        Integer temp = parseInteger(weather.getTemp());
        boolean hot = temp != null && temp >= 32;
        boolean cold = temp != null && temp <= 5;

        if (severe) {
            candidates.add("Current weather is severe. Reduce non-essential outdoor walking.");
        } else if (rainy) {
            candidates.add("Rain or snow is expected. Prepare rain gear and watch slippery surfaces.");
        }

        if (hot) {
            candidates.add("Temperature is high. Reduce long sun-exposed walks and stay hydrated.");
        } else if (cold || windy) {
            candidates.add("Cold or windy conditions detected. Keep warm and avoid long outdoor stays.");
        }

        if (SCENE_ROUTE_PLANNING.equals(sceneType)
                && rainy
                && queryDTO.getRouteDuration() != null
                && queryDTO.getRouteDuration() > 0) {
            candidates.add("This route is mainly walking. Pay extra attention to outdoor segments and carry rain gear.");
        }
    }

    private void appendTimeSuggestions(List<String> candidates,
                                       LocalDateTime contextDateTime,
                                       String sceneType,
                                       String poiType) {
        int hour = contextDateTime.getHour();

        if (isWorkday(contextDateTime.toLocalDate())
                && isClassPeriod(contextDateTime.toLocalTime())
                && isTeachingOrCollegeType(poiType)) {
            candidates.add("Class peak period is active on workdays. Consider leaving about 10 minutes earlier.");
        }

        if (hour >= 11 && hour <= 13) {
            if (SCENE_POI_DETAIL.equals(sceneType) && isCanteenType(poiType)) {
                candidates.add("This is a meal-time peak period. Queue time may be longer at canteens.");
            } else {
                candidates.add("Noon traffic is usually heavier on campus. Add buffer time to your trip.");
            }
            return;
        }

        if (hour >= 18 || hour < 6) {
            candidates.add("For evening travel, pay attention to lighting and return time.");
            return;
        }

        if (hour >= 7 && hour <= 9) {
            candidates.add("Morning peak is active around teaching zones. Consider starting earlier.");
        }
    }

    private WeatherCurrentVO getWeatherOrNull() {
        try {
            return weatherService.getCurrentWeather();
        } catch (Exception ex) {
            return null;
        }
    }

    private PoiVO resolvePoi(Long poiId) {
        if (poiId == null) {
            return null;
        }
        try {
            return poiService.getById(poiId);
        } catch (Exception ex) {
            return null;
        }
    }

    private PoiVO findNearestOpenCanteen(PoiVO sourcePoi, LocalTime contextTime) {
        if (sourcePoi == null || sourcePoi.getLongitude() == null || sourcePoi.getLatitude() == null) {
            return null;
        }

        PoiQueryRequest query = new PoiQueryRequest();
        query.setType("canteen");
        query.setEnabled(true);

        List<PoiVO> canteens = poiService.list(query);
        return canteens.stream()
                .filter(candidate -> candidate != null && candidate.getId() != null)
                .filter(candidate -> !candidate.getId().equals(sourcePoi.getId()))
                .filter(candidate -> isOpenAt(normalizeOpeningHours(candidate.getOpeningHours()), contextTime))
                .filter(candidate -> candidate.getLongitude() != null && candidate.getLatitude() != null)
                .min(Comparator.comparingDouble(candidate -> distanceMeters(sourcePoi, candidate)))
                .orElse(null);
    }

    private double distanceMeters(PoiVO a, PoiVO b) {
        if (a == null || b == null || a.getLongitude() == null || a.getLatitude() == null
                || b.getLongitude() == null || b.getLatitude() == null) {
            return Double.MAX_VALUE;
        }

        double lat1 = Math.toRadians(a.getLatitude().doubleValue());
        double lat2 = Math.toRadians(b.getLatitude().doubleValue());
        double lon1 = Math.toRadians(a.getLongitude().doubleValue());
        double lon2 = Math.toRadians(b.getLongitude().doubleValue());
        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        double x = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
        return 6371000 * y;
    }

    private boolean isOpenAt(String openingHours, LocalTime time) {
        if (!StringUtils.hasText(openingHours) || time == null) {
            return false;
        }

        String normalized = openingHours.replace("，", ",").replace("；", ";").trim();
        String[] slots = normalized.split("[;,/]");
        for (String slot : slots) {
            String range = slot.trim().replace("～", "-").replace("~", "-").replace("至", "-");
            if (range.isEmpty() || !range.contains("-")) {
                continue;
            }
            String[] parts = range.split("-");
            if (parts.length != 2) {
                continue;
            }
            LocalTime start = parseTime(parts[0].trim());
            LocalTime end = parseTime(parts[1].trim());
            if (start == null || end == null) {
                continue;
            }
            if (!start.isAfter(end)) {
                if (!time.isBefore(start) && !time.isAfter(end)) {
                    return true;
                }
            } else {
                if (!time.isBefore(start) || !time.isAfter(end)) {
                    return true;
                }
            }
        }
        return false;
    }

    private LocalTime parseTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalized = value.trim();
        if ("24:00".equals(normalized)) {
            normalized = "23:59";
        }

        for (DateTimeFormatter formatter : TIME_FORMATTERS) {
            try {
                return LocalTime.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private String normalizeOpeningHours(String openingHours) {
        if (!StringUtils.hasText(openingHours)) {
            return "";
        }
        return openingHours.trim();
    }

    private String normalizeSceneType(String sceneType) {
        if (!StringUtils.hasText(sceneType)) {
            return SCENE_HOME;
        }
        String normalized = sceneType.trim().toLowerCase(Locale.ROOT);
        if (SCENE_POI_DETAIL.equals(normalized) || SCENE_ROUTE_PLANNING.equals(normalized)) {
            return normalized;
        }
        return SCENE_HOME;
    }

    private LocalDateTime resolveContextDateTime(Integer hour) {
        LocalDate nowDate = LocalDate.now();
        if (hour != null && hour >= 0 && hour <= 23) {
            return LocalDateTime.of(nowDate, LocalTime.of(hour, 0));
        }
        return LocalDateTime.now();
    }

    private boolean isWorkday(LocalDate date) {
        if (date == null) {
            return false;
        }
        DayOfWeek day = date.getDayOfWeek();
        return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
    }

    private boolean isClassPeriod(LocalTime time) {
        if (time == null) {
            return false;
        }
        boolean am = !time.isBefore(CLASS_AM_START) && time.isBefore(CLASS_AM_END);
        boolean pm = !time.isBefore(CLASS_PM_START) && time.isBefore(CLASS_PM_END);
        return am || pm;
    }

    private boolean isTeachingOrCollegeType(String poiType) {
        if (!StringUtils.hasText(poiType)) {
            return false;
        }
        String normalized = poiType.toLowerCase(Locale.ROOT);
        return containsAny(normalized, "teaching", "college", "school", "academy");
    }

    private boolean isCanteenType(String poiType) {
        if (!StringUtils.hasText(poiType)) {
            return false;
        }
        return poiType.toLowerCase(Locale.ROOT).contains("canteen");
    }

    private String resolveTitle(String sceneType) {
        if (SCENE_ROUTE_PLANNING.equals(sceneType)) {
            return "Route Suggestions";
        }
        if (SCENE_POI_DETAIL.equals(sceneType)) {
            return "POI Context Suggestions";
        }
        return "Campus Travel Suggestions";
    }

    private List<String> limitSuggestions(List<String> candidates, int maxSize) {
        Set<String> unique = new LinkedHashSet<>();
        for (String candidate : candidates) {
            if (!StringUtils.hasText(candidate)) {
                continue;
            }
            unique.add(candidate.trim());
            if (unique.size() >= maxSize) {
                break;
            }
        }
        return new ArrayList<>(unique);
    }

    private String formatDuration(Long durationSeconds) {
        if (durationSeconds == null || durationSeconds <= 0) {
            return "-";
        }
        long minutes = Math.max(1, Math.round(durationSeconds / 60.0));
        if (minutes < 60) {
            return minutes + " min";
        }
        long hours = minutes / 60;
        long restMinutes = minutes % 60;
        if (restMinutes == 0) {
            return hours + " h";
        }
        return hours + " h " + restMinutes + " min";
    }

    private String formatDistance(Long distanceMeters) {
        if (distanceMeters == null || distanceMeters <= 0) {
            return "-";
        }
        if (distanceMeters >= 1000) {
            return String.format(Locale.ROOT, "%.1f km", distanceMeters / 1000.0);
        }
        return distanceMeters + " m";
    }

    private int parseWindScale(String windScale) {
        Integer value = parseInteger(windScale);
        return value == null ? -1 : value;
    }

    private Integer parseInteger(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        StringBuilder digits = new StringBuilder();
        for (char ch : value.toCharArray()) {
            if (Character.isDigit(ch) || (digits.length() == 0 && ch == '-')) {
                digits.append(ch);
            } else if (digits.length() > 0) {
                break;
            }
        }
        if (digits.isEmpty() || "-".contentEquals(digits)) {
            return null;
        }
        try {
            return Integer.parseInt(digits.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private boolean containsAny(String source, String... keywords) {
        if (!StringUtils.hasText(source) || keywords == null || keywords.length == 0) {
            return false;
        }
        String normalizedSource = source.toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            if (StringUtils.hasText(keyword)
                    && normalizedSource.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }
}
