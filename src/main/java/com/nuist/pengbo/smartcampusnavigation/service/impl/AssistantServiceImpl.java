package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.config.DeepSeekProperties;
import com.nuist.pengbo.smartcampusnavigation.dto.assistant.AssistantChatRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.service.AssistantService;
import com.nuist.pengbo.smartcampusnavigation.service.PoiService;
import com.nuist.pengbo.smartcampusnavigation.vo.assistant.AssistantChatVO;
import com.nuist.pengbo.smartcampusnavigation.vo.assistant.AssistantEvidenceVO;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AssistantServiceImpl implements AssistantService {
    private static final Logger log = LoggerFactory.getLogger(AssistantServiceImpl.class);
    private static final int MAX_CONTEXT_EVIDENCE = 12;
    private static final int MAX_NEAREST_EVIDENCE = 5;
    private static final double EARTH_RADIUS_METERS = 6371000.0;
    private static final Set<String> CAMPUS_KEYWORDS = Set.of(
            "campus", "nuist", "poi", "place", "places", "route", "walk", "walking", "cycle", "cycling",
            "nearest", "near", "canteen", "library", "building", "weather", "dorm", "gym", "saved",
            "start", "destination", "waypoint", "食堂", "图书馆", "路线", "导航", "地点", "教学楼"
    );
    private static final Map<String, List<String>> TYPE_HINTS = Map.ofEntries(
            Map.entry("canteen", List.of("canteen", "restaurant", "cafe")),
            Map.entry("dining", List.of("canteen", "restaurant", "cafe")),
            Map.entry("food", List.of("canteen", "restaurant", "cafe")),
            Map.entry("library", List.of("library")),
            Map.entry("teaching", List.of("teaching_building", "academy_building", "college", "laboratory_building")),
            Map.entry("building", List.of("teaching_building", "academy_building", "laboratory_building", "college")),
            Map.entry("sports", List.of("sports", "gymnasium", "stadium", "playground", "sports_facility")),
            Map.entry("gym", List.of("gymnasium", "sports", "sports_facility")),
            Map.entry("dorm", List.of("residential_area", "dorm_service")),
            Map.entry("gate", List.of("gate"))
    );

    private final PoiService poiService;
    private final DeepSeekProperties deepSeekProperties;
    private volatile String resolvedApiKeyCache;

    public AssistantServiceImpl(PoiService poiService, DeepSeekProperties deepSeekProperties) {
        this.poiService = poiService;
        this.deepSeekProperties = deepSeekProperties;
    }

    @Override
    public AssistantChatVO chat(AssistantChatRequest request) {
        String question = normalize(request.getQuestion());
        List<PoiVO> enabledPois = loadEnabledPois();
        AssistantContext context = buildContext(question, request, enabledPois);

        AssistantChatVO response = new AssistantChatVO();
        response.setEvidence(context.evidence);
        response.setContextSummary(context.summary);
        response.setModel(resolveModelName());

        if (!isCampusQuestion(question)) {
            response.setFallback(true);
            response.setWarning("Out of scope");
            response.setAnswer("I can answer campus navigation questions based on NUIST POI, route, weather, and saved-place context. Please ask about campus places or routes.");
            return response;
        }

        String fallbackAnswer = buildDeterministicAnswer(question, context);
        if (!isDeepSeekConfigured()) {
            response.setFallback(true);
            response.setWarning("DeepSeek is not configured. Showing an evidence-based local answer.");
            response.setAnswer(fallbackAnswer);
            return response;
        }

        try {
            String answer = callDeepSeek(question, context);
            if (!StringUtils.hasText(answer)) {
                response.setFallback(true);
                response.setWarning("DeepSeek returned an empty answer. Showing local answer.");
                response.setAnswer(fallbackAnswer);
                return response;
            }
            response.setFallback(false);
            response.setAnswer(answer.trim());
            return response;
        } catch (RuntimeException ex) {
            log.warn("DeepSeek assistant request failed: {}", ex.getMessage());
            response.setFallback(true);
            response.setWarning("DeepSeek is temporarily unavailable. Showing an evidence-based local answer.");
            response.setAnswer(fallbackAnswer);
            return response;
        }
    }

    private List<PoiVO> loadEnabledPois() {
        PoiQueryRequest query = new PoiQueryRequest();
        query.setEnabled(true);
        return poiService.list(query);
    }

    private AssistantContext buildContext(String question, AssistantChatRequest request, List<PoiVO> pois) {
        AssistantContext context = new AssistantContext();
        context.routeSummary = summarizeRoute(request.getRouteContext());
        context.selectedPoiSummary = summarizePoiContext(request.getSelectedPoi());

        NearestRequest nearestRequest = detectNearestRequest(question, pois);
        if (nearestRequest != null) {
            context.evidence.addAll(buildNearestEvidence(nearestRequest, pois));
        }

        if (request.getSelectedPoi() != null) {
            context.evidence.add(toEvidence(request.getSelectedPoi(), "selected_poi", null,
                    "Currently selected POI in the user interface"));
        }

        if (request.getRouteContext() != null) {
            addRouteEvidence(context.evidence, request.getRouteContext());
        }

        if (context.evidence.size() < MAX_CONTEXT_EVIDENCE) {
            addLexicalEvidence(context.evidence, question, pois);
        }

        context.evidence = deduplicateEvidence(context.evidence).stream()
                .limit(MAX_CONTEXT_EVIDENCE)
                .toList();
        context.summary = buildContextSummary(context);
        return context;
    }

    private NearestRequest detectNearestRequest(String question, List<PoiVO> pois) {
        String normalized = normalizeLower(question);
        boolean nearest = normalized.contains("nearest") || normalized.contains("closest") || normalized.contains(" near ")
                || normalized.contains("near the") || normalized.contains("nearby");
        if (!nearest) {
            return null;
        }

        List<String> targetTypes = detectTargetTypes(normalized);
        PoiVO anchor = detectAnchorPoi(normalized, pois);
        if (targetTypes.isEmpty() || anchor == null || !hasValidCoordinate(anchor)) {
            return null;
        }
        NearestRequest request = new NearestRequest();
        request.anchor = anchor;
        request.targetTypes = targetTypes;
        return request;
    }

    private List<String> detectTargetTypes(String normalizedQuestion) {
        Set<String> typeSet = new HashSet<>();
        for (Map.Entry<String, List<String>> entry : TYPE_HINTS.entrySet()) {
            if (normalizedQuestion.contains(entry.getKey())) {
                typeSet.addAll(entry.getValue());
            }
        }
        if ((normalizedQuestion.contains("食堂") || normalizedQuestion.contains("餐厅")) && typeSet.isEmpty()) {
            typeSet.addAll(List.of("canteen", "restaurant", "cafe"));
        }
        return new ArrayList<>(typeSet);
    }

    private PoiVO detectAnchorPoi(String normalizedQuestion, List<PoiVO> pois) {
        if (normalizedQuestion.contains("library") || normalizedQuestion.contains("图书馆")) {
            return pois.stream()
                    .filter(poi -> "library".equalsIgnoreCase(normalize(poi.getType())))
                    .filter(this::hasValidCoordinate)
                    .findFirst()
                    .orElse(null);
        }

        List<PoiVO> nameMatches = pois.stream()
                .filter(this::hasValidCoordinate)
                .filter(poi -> {
                    String name = normalizeLower(poi.getName());
                    return StringUtils.hasText(name) && normalizedQuestion.contains(name);
                })
                .toList();
        return nameMatches.isEmpty() ? null : nameMatches.get(0);
    }

    private List<AssistantEvidenceVO> buildNearestEvidence(NearestRequest nearestRequest, List<PoiVO> pois) {
        return pois.stream()
                .filter(this::hasValidCoordinate)
                .filter(poi -> poi.getType() != null && nearestRequest.targetTypes.contains(poi.getType()))
                .filter(poi -> !samePoi(poi, nearestRequest.anchor))
                .map(poi -> {
                    long distance = Math.round(distanceMeters(nearestRequest.anchor, poi));
                    return toEvidence(poi, "nearest_candidate", distance,
                            "Distance from " + normalize(nearestRequest.anchor.getName()) + " to this candidate");
                })
                .sorted(Comparator.comparing(AssistantEvidenceVO::getDistanceMeters, Comparator.nullsLast(Long::compareTo)))
                .limit(MAX_NEAREST_EVIDENCE)
                .toList();
    }

    private void addRouteEvidence(List<AssistantEvidenceVO> evidence, AssistantChatRequest.AssistantRouteContext routeContext) {
        if (routeContext.getStart() != null) {
            evidence.add(toEvidence(routeContext.getStart(), "route_start", null, "Current route start point"));
        }
        if (routeContext.getDestination() != null) {
            evidence.add(toEvidence(routeContext.getDestination(), "route_destination", null, "Current route destination"));
        }
        if (routeContext.getWaypoints() != null) {
            for (AssistantChatRequest.AssistantPoiContext waypoint : routeContext.getWaypoints()) {
                evidence.add(toEvidence(waypoint, "route_waypoint", null, "Current route waypoint"));
            }
        }
    }

    private void addLexicalEvidence(List<AssistantEvidenceVO> evidence, String question, List<PoiVO> pois) {
        String normalized = normalizeLower(question);
        Set<String> tokens = tokenize(normalized);
        pois.stream()
                .filter(this::hasValidCoordinate)
                .map(poi -> Map.entry(poi, lexicalScore(poi, normalized, tokens)))
                .filter(entry -> entry.getValue() > 0)
                .sorted(Map.Entry.<PoiVO, Integer>comparingByValue().reversed())
                .limit(MAX_CONTEXT_EVIDENCE)
                .forEach(entry -> evidence.add(toEvidence(entry.getKey(), "matched_poi", null, "Matched the question keywords")));
    }

    private int lexicalScore(PoiVO poi, String normalizedQuestion, Set<String> tokens) {
        int score = 0;
        String name = normalizeLower(poi.getName());
        String type = normalizeLower(poi.getType());
        String description = normalizeLower(poi.getDescription());
        if (StringUtils.hasText(name) && normalizedQuestion.contains(name)) {
            score += 10;
        }
        if (StringUtils.hasText(type) && normalizedQuestion.contains(type.replace('_', ' '))) {
            score += 5;
        }
        for (String token : tokens) {
            if (token.length() < 3) {
                continue;
            }
            if (name.contains(token)) {
                score += 3;
            }
            if (type.contains(token)) {
                score += 2;
            }
            if (description.contains(token)) {
                score += 1;
            }
        }
        return score;
    }

    private Set<String> tokenize(String value) {
        String[] parts = value.replaceAll("[^a-z0-9_\\u4e00-\\u9fa5]+", " ").split("\\s+");
        Set<String> tokens = new HashSet<>();
        for (String part : parts) {
            String token = normalizeLower(part);
            if (StringUtils.hasText(token)) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private List<AssistantEvidenceVO> deduplicateEvidence(List<AssistantEvidenceVO> source) {
        Map<String, AssistantEvidenceVO> map = new LinkedHashMap<>();
        for (AssistantEvidenceVO item : source) {
            String key = item.getId() != null ? "id:" + item.getId() : normalize(item.getName()) + "|" + item.getLongitude() + "|" + item.getLatitude();
            map.putIfAbsent(key, item);
        }
        return new ArrayList<>(map.values());
    }

    private String buildContextSummary(AssistantContext context) {
        List<String> lines = new ArrayList<>();
        if (StringUtils.hasText(context.selectedPoiSummary)) {
            lines.add("Selected POI: " + context.selectedPoiSummary);
        }
        if (StringUtils.hasText(context.routeSummary)) {
            lines.add("Route state: " + context.routeSummary);
        }
        lines.add("Evidence POIs: " + context.evidence.size());
        return String.join("\n", lines);
    }

    private String summarizeRoute(AssistantChatRequest.AssistantRouteContext routeContext) {
        if (routeContext == null) {
            return "No active route context.";
        }
        List<String> parts = new ArrayList<>();
        parts.add("mode=" + normalize(routeContext.getMode()));
        parts.add("start=" + summarizePoiContext(routeContext.getStart()));
        parts.add("destination=" + summarizePoiContext(routeContext.getDestination()));
        if (routeContext.getWaypoints() != null && !routeContext.getWaypoints().isEmpty()) {
            parts.add("waypoints=" + routeContext.getWaypoints().stream().map(this::summarizePoiContext).collect(Collectors.joining("; ")));
        }
        if (routeContext.getDistance() != null) {
            parts.add("distanceMeters=" + routeContext.getDistance());
        }
        if (routeContext.getDuration() != null) {
            parts.add("durationSeconds=" + routeContext.getDuration());
        }
        return String.join(", ", parts);
    }

    private String summarizePoiContext(AssistantChatRequest.AssistantPoiContext poi) {
        if (poi == null) {
            return "not selected";
        }
        return normalize(poi.getName()) + " [" + normalize(poi.getType()) + "] "
                + coordinateText(poi.getLongitude(), poi.getLatitude());
    }

    private String buildDeterministicAnswer(String question, AssistantContext context) {
        if (context.evidence.isEmpty()) {
            return "I do not have enough campus POI evidence to answer this reliably. Try naming a campus place or asking about a route point.";
        }
        AssistantEvidenceVO first = context.evidence.get(0);
        String lower = normalizeLower(question);
        if ((lower.contains("nearest") || lower.contains("closest") || lower.contains("near")) && first.getDistanceMeters() != null) {
            return "Based on campus POI data, the nearest matched place is " + first.getName()
                    + " (" + first.getType() + "), about " + first.getDistanceMeters()
                    + " meters away. Evidence: " + first.getReason() + ".";
        }
        return "Based on the available campus POI context, the most relevant place is " + first.getName()
                + " (" + first.getType() + "). "
                + "I can only use the provided campus data, so ask a more specific place or route question if you need more detail.";
    }

    private String callDeepSeek(String question, AssistantContext context) {
        String baseUrl = normalize(deepSeekProperties.getBaseUrl());
        String apiUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : stripTrailingSlash(baseUrl) + "/chat/completions";
        String apiKey = resolveDeepSeekApiKey();
        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException("DeepSeek API key is empty.");
        }

        RestTemplate restTemplate = createRestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());

        Map<String, Object> body = new HashMap<>();
        body.put("model", resolveModelName());
        body.put("temperature", deepSeekProperties.getTemperature());
        body.put("messages", List.of(
                Map.of("role", "system", "content", buildSystemPrompt()),
                Map.of("role", "user", "content", buildUserPrompt(question, context))
        ));

        Object raw = restTemplate.postForObject(apiUrl, new HttpEntity<>(body, headers), Object.class);
        return extractAssistantContent(raw);
    }

    @SuppressWarnings("unchecked")
    private String extractAssistantContent(Object raw) {
        if (!(raw instanceof Map<?, ?> map)) {
            return "";
        }
        Object choicesObject = map.get("choices");
        if (!(choicesObject instanceof List<?> choices) || choices.isEmpty()) {
            return "";
        }
        Object firstChoice = choices.get(0);
        if (!(firstChoice instanceof Map<?, ?> choiceMap)) {
            return "";
        }
        Object messageObject = choiceMap.get("message");
        if (!(messageObject instanceof Map<?, ?> messageMap)) {
            return "";
        }
        Object content = messageMap.get("content");
        return content == null ? "" : String.valueOf(content);
    }

    private String buildSystemPrompt() {
        return "You are Smart Campus Navigation Assistant for NUIST. "
                + "Answer only campus navigation, POI, weather, saved-place, or route questions. "
                + "Use only the structured context and evidence provided by the server. "
                + "Do not invent buildings, coordinates, opening hours, distances, or routes. "
                + "If the evidence is insufficient, say that the campus data is insufficient. "
                + "Keep the answer concise, practical, and explain what evidence you used.";
    }

    private String buildUserPrompt(String question, AssistantContext context) {
        StringBuilder builder = new StringBuilder();
        builder.append("Question:\n").append(question).append("\n\n");
        builder.append("Context summary:\n").append(context.summary).append("\n\n");
        builder.append("Evidence list:\n");
        for (AssistantEvidenceVO evidence : context.evidence) {
            builder.append("- ")
                    .append(evidence.getName()).append(" | type=").append(evidence.getType())
                    .append(" | kind=").append(evidence.getKind())
                    .append(" | coordinates=").append(coordinateText(evidence.getLongitude(), evidence.getLatitude()));
            if (evidence.getDistanceMeters() != null) {
                builder.append(" | distanceMeters=").append(evidence.getDistanceMeters());
            }
            if (StringUtils.hasText(evidence.getReason())) {
                builder.append(" | reason=").append(evidence.getReason());
            }
            builder.append("\n");
        }
        return builder.toString();
    }

    private RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.max(1000, deepSeekProperties.getConnectTimeoutMs()));
        requestFactory.setReadTimeout(Math.max(2000, deepSeekProperties.getReadTimeoutMs()));
        return new RestTemplate(requestFactory);
    }

    private boolean isDeepSeekConfigured() {
        return deepSeekProperties.isEnabled()
                && StringUtils.hasText(resolveDeepSeekApiKey())
                && StringUtils.hasText(deepSeekProperties.getBaseUrl())
                && StringUtils.hasText(resolveModelName());
    }

    private String resolveModelName() {
        return StringUtils.hasText(deepSeekProperties.getModel()) ? deepSeekProperties.getModel().trim() : "deepseek-chat";
    }

    private boolean isCampusQuestion(String question) {
        String normalized = normalizeLower(question);
        if (!StringUtils.hasText(normalized)) {
            return false;
        }
        for (String keyword : CAMPUS_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return true;
    }

    private AssistantEvidenceVO toEvidence(PoiVO poi, String kind, Long distanceMeters, String reason) {
        AssistantEvidenceVO evidence = new AssistantEvidenceVO();
        evidence.setKind(kind);
        evidence.setId(poi.getId());
        evidence.setName(normalize(poi.getName()));
        evidence.setType(normalize(poi.getType()));
        evidence.setLongitude(poi.getLongitude());
        evidence.setLatitude(poi.getLatitude());
        evidence.setDistanceMeters(distanceMeters);
        evidence.setReason(reason);
        return evidence;
    }

    private AssistantEvidenceVO toEvidence(AssistantChatRequest.AssistantPoiContext poi, String kind, Long distanceMeters, String reason) {
        AssistantEvidenceVO evidence = new AssistantEvidenceVO();
        evidence.setKind(kind);
        evidence.setId(poi.getId());
        evidence.setName(normalize(poi.getName()));
        evidence.setType(normalize(poi.getType()));
        evidence.setLongitude(poi.getLongitude());
        evidence.setLatitude(poi.getLatitude());
        evidence.setDistanceMeters(distanceMeters);
        evidence.setReason(reason);
        return evidence;
    }

    private boolean hasValidCoordinate(PoiVO poi) {
        return poi != null && poi.getLongitude() != null && poi.getLatitude() != null;
    }

    private boolean samePoi(PoiVO left, PoiVO right) {
        if (left == null || right == null) {
            return false;
        }
        if (left.getId() != null && right.getId() != null) {
            return left.getId().equals(right.getId());
        }
        return normalize(left.getName()).equalsIgnoreCase(normalize(right.getName()));
    }

    private double distanceMeters(PoiVO from, PoiVO to) {
        double lng1 = from.getLongitude().doubleValue();
        double lat1 = from.getLatitude().doubleValue();
        double lng2 = to.getLongitude().doubleValue();
        double lat2 = to.getLatitude().doubleValue();
        double latRad1 = Math.toRadians(lat1);
        double latRad2 = Math.toRadians(lat2);
        double deltaLat = Math.toRadians(lat2 - lat1);
        double deltaLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(latRad1) * Math.cos(latRad2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    private String coordinateText(BigDecimal longitude, BigDecimal latitude) {
        if (longitude == null || latitude == null) {
            return "-";
        }
        return longitude + "," + latitude;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeLower(String value) {
        return normalize(value).toLowerCase(Locale.ROOT);
    }

    private String stripTrailingSlash(String value) {
        String normalized = normalize(value);
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String resolveDeepSeekApiKey() {
        if (StringUtils.hasText(deepSeekProperties.getApiKey())) {
            return deepSeekProperties.getApiKey().trim();
        }
        if (StringUtils.hasText(resolvedApiKeyCache)) {
            return resolvedApiKeyCache;
        }
        String filePath = normalize(deepSeekProperties.getApiKeyFile());
        if (!StringUtils.hasText(filePath)) {
            return "";
        }
        try {
            Path path = Paths.get(filePath);
            if (!path.isAbsolute()) {
                path = Paths.get("").toAbsolutePath().resolve(path).normalize();
            }
            if (!Files.exists(path) || !Files.isReadable(path)) {
                return "";
            }
            String content = Files.readString(path).trim();
            if (!StringUtils.hasText(content)) {
                return "";
            }
            String extracted = extractApiKeyToken(content);
            if (!StringUtils.hasText(extracted)) {
                return "";
            }
            resolvedApiKeyCache = extracted.trim();
            return resolvedApiKeyCache;
        } catch (IOException ex) {
            log.warn("Failed to read DeepSeek api key file '{}': {}", filePath, ex.getMessage());
            return "";
        }
    }

    private String extractApiKeyToken(String content) {
        String normalized = normalize(content);
        if (!StringUtils.hasText(normalized)) {
            return "";
        }
        int keyIndex = normalized.indexOf("sk-");
        if (keyIndex >= 0) {
            int end = keyIndex;
            while (end < normalized.length()) {
                char current = normalized.charAt(end);
                if (Character.isLetterOrDigit(current) || current == '-' || current == '_') {
                    end++;
                    continue;
                }
                break;
            }
            return normalized.substring(keyIndex, end);
        }
        String firstToken = normalized.split("\\s+")[0];
        return normalize(firstToken);
    }

    private static class AssistantContext {
        private List<AssistantEvidenceVO> evidence = new ArrayList<>();
        private String selectedPoiSummary;
        private String routeSummary;
        private String summary;
    }

    private static class NearestRequest {
        private PoiVO anchor;
        private List<String> targetTypes;
    }
}
