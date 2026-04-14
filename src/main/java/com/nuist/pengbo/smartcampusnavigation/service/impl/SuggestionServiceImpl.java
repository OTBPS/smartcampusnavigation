package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.dto.suggestion.SuggestionContextQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.service.PoiService;
import com.nuist.pengbo.smartcampusnavigation.service.SuggestionService;
import com.nuist.pengbo.smartcampusnavigation.service.WeatherService;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import com.nuist.pengbo.smartcampusnavigation.vo.suggestion.SuggestionContextVO;
import com.nuist.pengbo.smartcampusnavigation.vo.weather.WeatherCurrentVO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class SuggestionServiceImpl implements SuggestionService {
    private static final String SCENE_POI_DETAIL = "poi_detail";
    private static final String SCENE_ROUTE_PLANNING = "route_planning";
    private static final String SCENE_HOME = "home";

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
        int hour = resolveHour(safeQuery.getHour());
        WeatherCurrentVO weather = getWeatherOrNull();
        String poiType = resolvePoiType(safeQuery.getPoiId());

        List<String> candidates = new ArrayList<>();
        appendSceneSuggestions(candidates, sceneType, poiType, safeQuery);
        appendWeatherSuggestions(candidates, weather, safeQuery, sceneType);
        appendTimeSuggestions(candidates, hour, sceneType, poiType);

        if (candidates.isEmpty()) {
            candidates.add("天气暂时不可用，建议优先使用地点搜索与路线规划。");
            candidates.add("请结合当前位置与校园道路信息，合理安排出行时间。");
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
                candidates.add("当前路线步行约" + formatDuration(queryDTO.getRouteDuration()) + "，请预留足够出发时间。");
            } else if (queryDTO.getRouteDistance() != null && queryDTO.getRouteDistance() > 0) {
                candidates.add("当前路线约" + formatDistance(queryDTO.getRouteDistance()) + "，建议优先走校园主干道。");
            } else {
                candidates.add("路线已生成，建议关注沿途室外路段与人流密集区域。");
            }
            return;
        }

        if (!SCENE_POI_DETAIL.equals(sceneType) || !StringUtils.hasText(poiType)) {
            candidates.add("可先选择教学区或食堂附近地点作为中转点，减少绕行。");
            return;
        }

        String normalizedType = poiType.toLowerCase(Locale.ROOT);
        if (containsAny(normalizedType, "canteen", "食堂")) {
            candidates.add("食堂区域午晚高峰人流较多，建议错峰前往。");
            return;
        }
        if (containsAny(normalizedType, "library", "图书馆")) {
            candidates.add("图书馆场景建议提前确认闭馆时间，并保持安静通行。");
            return;
        }
        if (containsAny(normalizedType, "dormitory", "宿舍")) {
            candidates.add("宿舍区夜间通行请注意照明，建议优先走主路返程。");
            return;
        }
        if (containsAny(normalizedType, "teaching", "教学")) {
            candidates.add("教学楼课间通行较集中，建议预留换楼步行时间。");
            return;
        }
        candidates.add("当前地点建议优先使用校园主干道，避免在次要小路绕行。");
    }

    private void appendWeatherSuggestions(List<String> candidates,
                                          WeatherCurrentVO weather,
                                          SuggestionContextQueryDTO queryDTO,
                                          String sceneType) {
        if (weather == null || !StringUtils.hasText(weather.getWeatherText())) {
            candidates.add("天气暂时不可用，建议优先使用地点搜索与路线规划。");
            candidates.add("请结合当前位置与校园路径信息，合理安排出行。");
            return;
        }

        String weatherText = weather.getWeatherText();
        boolean severe = containsAny(weatherText, "暴雨", "雷暴", "台风", "冰雹", "强对流", "大雪", "沙尘");
        boolean rainy = containsAny(weatherText, "雨", "雪", "雷");
        boolean windy = parseWindScale(weather.getWindScale()) >= 6 || containsAny(weatherText, "大风", "风");
        Integer temp = parseInteger(weather.getTemp());
        boolean hot = temp != null && temp >= 32;
        boolean cold = temp != null && temp <= 5;

        if (severe) {
            candidates.add("当前天气条件较差，建议减少非必要室外步行并谨慎出行。");
        } else if (rainy) {
            candidates.add("当前有降水，步行请准备雨具并注意湿滑路面。");
        }

        if (hot) {
            candidates.add("气温偏高，建议减少长距离暴晒并及时补水。");
        } else if (cold || windy) {
            candidates.add("天气偏冷或风力较强，建议注意保暖并避免长时间停留室外。");
        }

        if (SCENE_ROUTE_PLANNING.equals(sceneType)
                && rainy
                && queryDTO.getRouteDuration() != null
                && queryDTO.getRouteDuration() > 0) {
            candidates.add("该路线以步行为主，雨天请优先选择有遮挡路段。");
        }
    }

    private void appendTimeSuggestions(List<String> candidates, int hour, String sceneType, String poiType) {
        if (hour >= 11 && hour <= 13) {
            if (SCENE_POI_DETAIL.equals(sceneType) && containsAny(poiType, "canteen", "食堂")) {
                candidates.add("当前为就餐高峰，食堂排队时间可能增加。");
            } else {
                candidates.add("中午时段校园人流较多，建议预留额外步行时间。");
            }
            return;
        }

        if (hour >= 18 || hour < 6) {
            candidates.add("晚间出行请注意照明与返程时间，尽量结伴通行。");
            return;
        }

        if (hour >= 7 && hour <= 9) {
            candidates.add("早高峰时段教学区通行密集，建议提前出发。");
        }
    }

    private WeatherCurrentVO getWeatherOrNull() {
        try {
            return weatherService.getCurrentWeather();
        } catch (Exception ex) {
            return null;
        }
    }

    private String resolvePoiType(Long poiId) {
        if (poiId == null) {
            return "";
        }
        try {
            PoiVO poi = poiService.getById(poiId);
            return poi != null ? poi.getType() : "";
        } catch (Exception ex) {
            return "";
        }
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

    private int resolveHour(Integer hour) {
        if (hour != null && hour >= 0 && hour <= 23) {
            return hour;
        }
        return LocalDateTime.now().getHour();
    }

    private String resolveTitle(String sceneType) {
        if (SCENE_ROUTE_PLANNING.equals(sceneType)) {
            return "路线出行提示";
        }
        if (SCENE_POI_DETAIL.equals(sceneType)) {
            return "地点场景提示";
        }
        return "校园出行提示";
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
            return minutes + "分钟";
        }
        long hours = minutes / 60;
        long restMinutes = minutes % 60;
        if (restMinutes == 0) {
            return hours + "小时";
        }
        return hours + "小时" + restMinutes + "分钟";
    }

    private String formatDistance(Long distanceMeters) {
        if (distanceMeters == null || distanceMeters <= 0) {
            return "-";
        }
        if (distanceMeters >= 1000) {
            return String.format(Locale.ROOT, "%.1f公里", distanceMeters / 1000.0);
        }
        return distanceMeters + "米";
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
        for (String keyword : keywords) {
            if (StringUtils.hasText(keyword) && source.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}