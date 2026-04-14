package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.config.AmapProperties;
import com.nuist.pengbo.smartcampusnavigation.dto.route.WalkingRouteQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.service.RouteService;
import com.nuist.pengbo.smartcampusnavigation.vo.route.WalkingRouteStepVO;
import com.nuist.pengbo.smartcampusnavigation.vo.route.WalkingRouteVO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class RouteServiceImpl implements RouteService {
    private static final String AMAP_WALKING_URL = "https://restapi.amap.com/v3/direction/walking";

    private final AmapProperties amapProperties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public RouteServiceImpl(AmapProperties amapProperties, ObjectMapper objectMapper) {
        this.amapProperties = amapProperties;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public WalkingRouteVO planWalkingRoute(WalkingRouteQueryDTO queryDTO) {
        validateQuery(queryDTO);

        String webServiceKey = amapProperties.getWebServiceKey();
        if (!StringUtils.hasText(webServiceKey)) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "AMap web service key is not configured");
        }

        String origin = formatCoordinatePair(queryDTO.getOriginLng(), queryDTO.getOriginLat());
        String destination = formatCoordinatePair(queryDTO.getDestinationLng(), queryDTO.getDestinationLat());

        String url = UriComponentsBuilder.fromUriString(AMAP_WALKING_URL)
                .queryParam("origin", origin)
                .queryParam("destination", destination)
                .queryParam("key", webServiceKey)
                .toUriString();

        try {
            String responseText = restTemplate.getForObject(url, String.class);
            if (!StringUtils.hasText(responseText)) {
                throw new BusinessException(ResultCode.INTERNAL_ERROR, "Walking route service returned empty response");
            }
            return convertResponse(responseText);
        } catch (BusinessException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to request walking route service");
        } catch (Exception ex) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to parse walking route response");
        }
    }

    private WalkingRouteVO convertResponse(String responseText) throws Exception {
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
}
