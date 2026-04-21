package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.config.AmapProperties;
import com.nuist.pengbo.smartcampusnavigation.dto.route.WalkingRouteQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.service.CampusRouteAdviceService;
import com.nuist.pengbo.smartcampusnavigation.service.RouteService;
import com.nuist.pengbo.smartcampusnavigation.vo.route.RouteAdviceVO;
import com.nuist.pengbo.smartcampusnavigation.vo.route.WalkingRouteStepVO;
import com.nuist.pengbo.smartcampusnavigation.vo.route.WalkingRouteVO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RouteServiceImpl implements RouteService {
    private static final String AMAP_WALKING_URL = "https://restapi.amap.com/v3/direction/walking";
    private static final String AMAP_CYCLING_URL = "https://restapi.amap.com/v4/direction/bicycling";
    private static final int MAX_WAYPOINTS = 3;

    private final AmapProperties amapProperties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final CampusRouteAdviceService campusRouteAdviceService;

    public RouteServiceImpl(AmapProperties amapProperties,
                            ObjectMapper objectMapper,
                            CampusRouteAdviceService campusRouteAdviceService) {
        this.amapProperties = amapProperties;
        this.objectMapper = objectMapper;
        this.campusRouteAdviceService = campusRouteAdviceService;
        this.restTemplate = new RestTemplate();
    }

    private enum RouteMode {
        WALKING,
        CYCLING
    }

    private static class RoutePoint {
        private final BigDecimal lng;
        private final BigDecimal lat;

        RoutePoint(BigDecimal lng, BigDecimal lat) {
            this.lng = lng;
            this.lat = lat;
        }
    }

    @Override
    public WalkingRouteVO planWalkingRoute(WalkingRouteQueryDTO queryDTO) {
        return planRouteWithOptionalVia(queryDTO, RouteMode.WALKING);
    }

    @Override
    public WalkingRouteVO planCyclingRoute(WalkingRouteQueryDTO queryDTO) {
        return planRouteWithOptionalVia(queryDTO, RouteMode.CYCLING);
    }

    private WalkingRouteVO planRouteWithOptionalVia(WalkingRouteQueryDTO queryDTO, RouteMode routeMode) {
        validateQuery(queryDTO);
        boolean hasVia = hasWaypoint(queryDTO);
        WalkingRouteVO routeResult;

        if (!hasVia) {
            routeResult = planSingleSegment(
                    queryDTO.getOriginLng(),
                    queryDTO.getOriginLat(),
                    queryDTO.getDestinationLng(),
                    queryDTO.getDestinationLat(),
                    routeMode,
                    true
            );
            attachWeatherAwareAdvice(routeResult, queryDTO, routeMode);
            return routeResult;
        }

        List<RoutePoint> routePoints = buildRoutePoints(queryDTO);

        List<WalkingRouteVO> segments = new ArrayList<>();
        for (int i = 0; i < routePoints.size() - 1; i++) {
            RoutePoint start = routePoints.get(i);
            RoutePoint end = routePoints.get(i + 1);
            segments.add(planSingleSegment(start.lng, start.lat, end.lng, end.lat, routeMode, false));
        }
        WalkingRouteVO merged = mergeRoutes(segments);
        merged.setAlternatives(List.of(copyRouteForAlternative(merged)));
        routeResult = merged;
        attachWeatherAwareAdvice(routeResult, queryDTO, routeMode);
        return routeResult;
    }

    private List<RoutePoint> buildRoutePoints(WalkingRouteQueryDTO queryDTO) {
        List<RoutePoint> points = new ArrayList<>();
        points.add(new RoutePoint(queryDTO.getOriginLng(), queryDTO.getOriginLat()));

        List<BigDecimal> viaLngList = safeList(queryDTO.getViaLngList());
        List<BigDecimal> viaLatList = safeList(queryDTO.getViaLatList());
        for (int i = 0; i < viaLngList.size(); i++) {
            points.add(new RoutePoint(viaLngList.get(i), viaLatList.get(i)));
        }

        points.add(new RoutePoint(queryDTO.getDestinationLng(), queryDTO.getDestinationLat()));
        return points;
    }

    private WalkingRouteVO planSingleSegment(BigDecimal originLng,
                                             BigDecimal originLat,
                                             BigDecimal destinationLng,
                                             BigDecimal destinationLat,
                                             RouteMode routeMode,
                                             boolean includeAlternatives) {
        String origin = formatCoordinatePair(originLng, originLat);
        String destination = formatCoordinatePair(destinationLng, destinationLat);
        String routeUrl = routeMode == RouteMode.CYCLING ? AMAP_CYCLING_URL : AMAP_WALKING_URL;
        String url = buildRouteUrl(routeUrl, origin, destination);

        try {
            String responseText = restTemplate.getForObject(url, String.class);
            if (!StringUtils.hasText(responseText)) {
                String routeType = routeMode == RouteMode.CYCLING ? "Cycling" : "Walking";
                throw new BusinessException(ResultCode.INTERNAL_ERROR, routeType + " route service returned empty response");
            }
            return routeMode == RouteMode.CYCLING
                    ? convertCyclingResponse(responseText, includeAlternatives)
                    : convertWalkingResponse(responseText, includeAlternatives);
        } catch (BusinessException ex) {
            throw ex;
        } catch (RestClientException ex) {
            String routeType = routeMode == RouteMode.CYCLING ? "cycling" : "walking";
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to request " + routeType + " route service");
        } catch (Exception ex) {
            String routeType = routeMode == RouteMode.CYCLING ? "cycling" : "walking";
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to parse " + routeType + " route response");
        }
    }

    private String buildRouteUrl(String baseUrl, String origin, String destination) {
        String webServiceKey = amapProperties.getWebServiceKey();
        if (!StringUtils.hasText(webServiceKey)) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "AMap web service key is not configured");
        }
        return UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("origin", origin)
                .queryParam("destination", destination)
                .queryParam("key", webServiceKey)
                .toUriString();
    }

    private WalkingRouteVO convertWalkingResponse(String responseText, boolean includeAlternatives) throws Exception {
        JsonNode root = objectMapper.readTree(responseText);
        String status = root.path("status").asText();
        if (!"1".equals(status)) {
            String info = root.path("info").asText();
            if (!StringUtils.hasText(info)) {
                info = "walking route planning failed";
            }
            throw new BusinessException(ResultCode.BAD_REQUEST, info);
        }

        JsonNode pathsNode = root.path("route").path("paths");
        if (!pathsNode.isArray() || pathsNode.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "No walking route found between selected POIs");
        }

        JsonNode firstPath = pathsNode.get(0);
        WalkingRouteVO mainRoute = convertPathNode(firstPath);
        if (includeAlternatives) {
            mainRoute.setAlternatives(buildAlternatives(pathsNode, 3));
        } else {
            mainRoute.setAlternatives(List.of(copyRouteForAlternative(mainRoute)));
        }
        return mainRoute;
    }

    private WalkingRouteVO convertCyclingResponse(String responseText, boolean includeAlternatives) throws Exception {
        JsonNode root = objectMapper.readTree(responseText);
        JsonNode errCodeNode = root.path("errcode");
        int errCode = errCodeNode.isInt() ? errCodeNode.asInt() : parseIntSafely(errCodeNode.asText(), 0);
        if (errCode != 0) {
            String errMsg = root.path("errmsg").asText();
            if (!StringUtils.hasText(errMsg)) {
                errMsg = "cycling route planning failed";
            }
            throw new BusinessException(ResultCode.BAD_REQUEST, errMsg);
        }

        JsonNode pathsNode = root.path("data").path("paths");
        if (!pathsNode.isArray() || pathsNode.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "No cycling route found between selected POIs");
        }

        JsonNode firstPath = pathsNode.get(0);
        WalkingRouteVO mainRoute = convertPathNode(firstPath);
        if (includeAlternatives) {
            mainRoute.setAlternatives(buildAlternatives(pathsNode, 3));
        } else {
            mainRoute.setAlternatives(List.of(copyRouteForAlternative(mainRoute)));
        }
        return mainRoute;
    }

    private WalkingRouteVO convertPathNode(JsonNode firstPath) {
        WalkingRouteVO routeVO = new WalkingRouteVO();
        routeVO.setDistance(parseLongSafely(firstPath.path("distance").asText()));
        routeVO.setDuration(parseLongSafely(firstPath.path("duration").asText()));

        List<List<Double>> routePolyline = new ArrayList<>();
        List<WalkingRouteStepVO> steps = new ArrayList<>();

        JsonNode stepsNode = firstPath.path("steps");
        if (stepsNode.isArray()) {
            for (JsonNode stepNode : stepsNode) {
                WalkingRouteStepVO stepVO = new WalkingRouteStepVO();
                stepVO.setInstruction(stepNode.path("instruction").asText(""));
                stepVO.setDistance(parseLongSafely(stepNode.path("distance").asText()));
                stepVO.setDuration(parseLongSafely(stepNode.path("duration").asText()));

                List<List<Double>> stepPolyline = parsePolyline(stepNode.path("polyline").asText(""));
                stepVO.setPolyline(stepPolyline);
                appendRoutePolyline(routePolyline, stepPolyline);

                steps.add(stepVO);
            }
        }

        routeVO.setSteps(steps);
        routeVO.setRoutePolyline(routePolyline);
        return routeVO;
    }

    private void validateQuery(WalkingRouteQueryDTO queryDTO) {
        if (queryDTO == null
                || queryDTO.getOriginLng() == null
                || queryDTO.getOriginLat() == null
                || queryDTO.getDestinationLng() == null
                || queryDTO.getDestinationLat() == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "Origin and destination coordinates are required");
        }

        if (!isValidLongitude(queryDTO.getOriginLng())
                || !isValidLongitude(queryDTO.getDestinationLng())
                || !isValidLatitude(queryDTO.getOriginLat())
                || !isValidLatitude(queryDTO.getDestinationLat())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "Coordinate out of valid range");
        }

        boolean sameOriginAndDestination =
                queryDTO.getOriginLng().compareTo(queryDTO.getDestinationLng()) == 0
                        && queryDTO.getOriginLat().compareTo(queryDTO.getDestinationLat()) == 0;
        if (sameOriginAndDestination) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "Origin and destination cannot be the same");
        }

        List<BigDecimal> viaLngList = safeList(queryDTO.getViaLngList());
        List<BigDecimal> viaLatList = safeList(queryDTO.getViaLatList());

        if (viaLngList.size() != viaLatList.size()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "Waypoint longitude/latitude count mismatch");
        }

        if (viaLngList.size() > MAX_WAYPOINTS) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "Too many waypoints");
        }

        Set<String> viaSet = new HashSet<>();
        String originKey = formatCoordinatePair(queryDTO.getOriginLng(), queryDTO.getOriginLat());
        String destinationKey = formatCoordinatePair(queryDTO.getDestinationLng(), queryDTO.getDestinationLat());

        for (int i = 0; i < viaLngList.size(); i++) {
            BigDecimal viaLng = viaLngList.get(i);
            BigDecimal viaLat = viaLatList.get(i);

            if (viaLng == null || viaLat == null) {
                throw new BusinessException(ResultCode.BAD_REQUEST, "Waypoint coordinates are required");
            }
            if (!isValidLongitude(viaLng) || !isValidLatitude(viaLat)) {
                throw new BusinessException(ResultCode.BAD_REQUEST, "Waypoint coordinate out of valid range");
            }

            String viaKey = formatCoordinatePair(viaLng, viaLat);
            if (viaKey.equals(originKey) || viaKey.equals(destinationKey)) {
                throw new BusinessException(ResultCode.BAD_REQUEST, "Waypoint must be different from origin and destination");
            }
            if (!viaSet.add(viaKey)) {
                throw new BusinessException(ResultCode.BAD_REQUEST, "Duplicate waypoints are not allowed");
            }
        }
    }

    private boolean isValidLongitude(BigDecimal lng) {
        return lng.compareTo(BigDecimal.valueOf(-180)) >= 0
                && lng.compareTo(BigDecimal.valueOf(180)) <= 0;
    }

    private boolean isValidLatitude(BigDecimal lat) {
        return lat.compareTo(BigDecimal.valueOf(-90)) >= 0
                && lat.compareTo(BigDecimal.valueOf(90)) <= 0;
    }

    private String formatCoordinatePair(BigDecimal lng, BigDecimal lat) {
        return lng.toPlainString() + "," + lat.toPlainString();
    }

    private Long parseLongSafely(String value) {
        try {
            return Long.parseLong(value);
        } catch (Exception ex) {
            return 0L;
        }
    }

    private int parseIntSafely(String value, int defaultValue) {
        try {
            return Integer.parseInt(value);
        } catch (Exception ex) {
            return defaultValue;
        }
    }

    private List<List<Double>> parsePolyline(String polylineText) {
        List<List<Double>> points = new ArrayList<>();
        if (!StringUtils.hasText(polylineText)) {
            return points;
        }

        String[] pairs = polylineText.split(";");
        for (String pair : pairs) {
            String[] lngLat = pair.split(",");
            if (lngLat.length != 2) {
                continue;
            }
            try {
                double lng = Double.parseDouble(lngLat[0]);
                double lat = Double.parseDouble(lngLat[1]);
                List<Double> point = new ArrayList<>(2);
                point.add(lng);
                point.add(lat);
                points.add(point);
            } catch (NumberFormatException ignored) {
                // Skip invalid coordinate segment
            }
        }
        return points;
    }

    private void appendRoutePolyline(List<List<Double>> routePolyline, List<List<Double>> stepPolyline) {
        for (List<Double> point : stepPolyline) {
            if (routePolyline.isEmpty()) {
                routePolyline.add(point);
                continue;
            }
            List<Double> last = routePolyline.get(routePolyline.size() - 1);
            if (last.get(0).equals(point.get(0)) && last.get(1).equals(point.get(1))) {
                continue;
            }
            routePolyline.add(point);
        }
    }

    private WalkingRouteVO mergeRoutes(List<WalkingRouteVO> segments) {
        WalkingRouteVO merged = new WalkingRouteVO();
        long totalDistance = 0L;
        long totalDuration = 0L;

        List<WalkingRouteStepVO> mergedSteps = new ArrayList<>();
        List<List<Double>> mergedPolyline = new ArrayList<>();

        for (WalkingRouteVO segment : segments) {
            if (segment == null) {
                continue;
            }
            totalDistance += segment.getDistance() == null ? 0L : segment.getDistance();
            totalDuration += segment.getDuration() == null ? 0L : segment.getDuration();

            if (segment.getSteps() != null) {
                mergedSteps.addAll(segment.getSteps());
            }
            if (segment.getRoutePolyline() != null) {
                appendRoutePolyline(mergedPolyline, segment.getRoutePolyline());
            }
        }

        merged.setDistance(totalDistance);
        merged.setDuration(totalDuration);
        merged.setSteps(mergedSteps);
        merged.setRoutePolyline(mergedPolyline);
        merged.setAlternatives(List.of(copyRouteForAlternative(merged)));
        return merged;
    }

    private boolean hasWaypoint(WalkingRouteQueryDTO queryDTO) {
        return queryDTO != null
                && !safeList(queryDTO.getViaLngList()).isEmpty()
                && !safeList(queryDTO.getViaLatList()).isEmpty();
    }

    private List<WalkingRouteVO> buildAlternatives(JsonNode pathsNode, int maxCount) {
        List<WalkingRouteVO> alternatives = new ArrayList<>();
        if (pathsNode == null || !pathsNode.isArray()) {
            return alternatives;
        }
        int count = Math.min(maxCount, pathsNode.size());
        for (int i = 0; i < count; i++) {
            WalkingRouteVO route = convertPathNode(pathsNode.get(i));
            route.setAlternatives(null);
            alternatives.add(route);
        }
        return alternatives;
    }

    private WalkingRouteVO copyRouteForAlternative(WalkingRouteVO source) {
        WalkingRouteVO copy = new WalkingRouteVO();
        copy.setDistance(source.getDistance());
        copy.setDuration(source.getDuration());
        copy.setSteps(source.getSteps());
        copy.setRoutePolyline(source.getRoutePolyline());
        copy.setAlternatives(null);
        return copy;
    }

    private List<BigDecimal> safeList(List<BigDecimal> source) {
        return source == null ? List.of() : source;
    }

    private void attachWeatherAwareAdvice(WalkingRouteVO routeVO,
                                          WalkingRouteQueryDTO queryDTO,
                                          RouteMode routeMode) {
        if (routeVO == null || queryDTO == null) {
            return;
        }
        try {
            RouteAdviceVO adviceVO = campusRouteAdviceService.buildAdvice(
                    queryDTO,
                    routeVO.getRoutePolyline(),
                    routeMode == RouteMode.WALKING
            );
            if (adviceVO == null || !StringUtils.hasText(adviceVO.getSmartTravelAdvice())) {
                routeVO.setWeatherRiskLevel(null);
                routeVO.setWeatherRiskType(null);
                routeVO.setSmartTravelAdvice(null);
                routeVO.setRecommendedWaypointName(null);
                routeVO.setRecommendedStrategyTag(null);
                routeVO.setRecommendedWaypointLng(null);
                routeVO.setRecommendedWaypointLat(null);
                return;
            }
            routeVO.setWeatherRiskLevel(adviceVO.getWeatherRiskLevel());
            routeVO.setWeatherRiskType(adviceVO.getWeatherRiskType());
            routeVO.setSmartTravelAdvice(adviceVO.getSmartTravelAdvice());
            routeVO.setRecommendedWaypointName(adviceVO.getRecommendedWaypointName());
            routeVO.setRecommendedStrategyTag(adviceVO.getRecommendedStrategyTag());
            routeVO.setRecommendedWaypointLng(adviceVO.getRecommendedWaypointLng());
            routeVO.setRecommendedWaypointLat(adviceVO.getRecommendedWaypointLat());
        } catch (Exception ignored) {
            routeVO.setWeatherRiskLevel(null);
            routeVO.setWeatherRiskType(null);
            routeVO.setSmartTravelAdvice(null);
            routeVO.setRecommendedWaypointName(null);
            routeVO.setRecommendedStrategyTag(null);
            routeVO.setRecommendedWaypointLng(null);
            routeVO.setRecommendedWaypointLat(null);
        }
    }
}
