package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.config.QWeatherProperties;
import com.nuist.pengbo.smartcampusnavigation.service.WeatherService;
import com.nuist.pengbo.smartcampusnavigation.vo.weather.WeatherCurrentVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.zip.GZIPInputStream;

@Service
public class WeatherServiceImpl implements WeatherService {
    private static final Logger log = LoggerFactory.getLogger(WeatherServiceImpl.class);
    private static final String WEATHER_NOW_PATH = "/v7/weather/now";
    private static final String DEFAULT_HOST = "https://nc2pg7kpbt.re.qweatherapi.com";
    private static final String DEFAULT_LOCATION = "118.7169,32.2072";
    private static final String AUTH_TYPE_API_KEY = "api-key";

    private final QWeatherProperties qWeatherProperties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public WeatherServiceImpl(QWeatherProperties qWeatherProperties, ObjectMapper objectMapper) {
        this.qWeatherProperties = qWeatherProperties;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    @Override
    public WeatherCurrentVO getCurrentWeather() {
        ensureApiKeyAuthOnly();
        String host = normalizeHost(qWeatherProperties.getHost());
        String apiKey = requireApiKey();
        String location = resolveLocation();
        String lang = qWeatherProperties.getLang();
        String unit = qWeatherProperties.getUnit();

        String weatherNowUrl = buildWeatherNowUrl(host);
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(weatherNowUrl)
                .queryParam("location", location);
        if (StringUtils.hasText(lang)) {
            builder.queryParam("lang", lang.trim());
        }
        if (StringUtils.hasText(unit)) {
            builder.queryParam("unit", unit.trim());
        }
        String requestUrl = builder.toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        headers.set("X-QW-Api-Key", apiKey);

        log.info("QWeather request start: method=GET url={} authType=api-key-header location={}",
                requestUrl, location);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    requestUrl,
                    HttpMethod.GET,
                    requestEntity,
                    byte[].class
            );
            String contentType = response.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
            String contentEncoding = response.getHeaders().getFirst(HttpHeaders.CONTENT_ENCODING);
            byte[] bodyBytes = response.getBody();
            if (bodyBytes == null || bodyBytes.length == 0) {
                QWeatherErrorInfo errorInfo = new QWeatherErrorInfo(
                        String.valueOf(response.getStatusCode().value()),
                        "QWeather API error",
                        "Empty response body",
                        ""
                );
                logQWeatherError(
                        requestUrl,
                        response.getStatusCode().value(),
                        errorInfo,
                        contentType,
                        contentEncoding,
                        ""
                );
                throw new BusinessException(ResultCode.BAD_REQUEST, buildClientErrorMessage(errorInfo));
            }
            String body = decodeResponseBody(bodyBytes, contentEncoding);
            return parseSuccessOrError(body, response.getStatusCode().value(), requestUrl, contentType);
        } catch (BusinessException ex) {
            throw ex;
        } catch (HttpStatusCodeException ex) {
            int status = ex.getStatusCode().value();
            String contentType = ex.getResponseHeaders() != null
                    ? ex.getResponseHeaders().getFirst(HttpHeaders.CONTENT_TYPE)
                    : "";
            String contentEncoding = ex.getResponseHeaders() != null
                    ? ex.getResponseHeaders().getFirst(HttpHeaders.CONTENT_ENCODING)
                    : "";
            byte[] rawBodyBytes = ex.getResponseBodyAsByteArray();
            String rawBody = decodeResponseBody(rawBodyBytes, contentEncoding);
            QWeatherErrorInfo errorInfo = parseQWeatherError(rawBody, status);
            logQWeatherError(requestUrl, status, errorInfo, contentType, contentEncoding, rawBody);
            throw new BusinessException(ResultCode.BAD_REQUEST, buildClientErrorMessage(errorInfo));
        } catch (ResourceAccessException ex) {
            log.warn("QWeather timeout/network error: url={} message={}", requestUrl, ex.getMessage());
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "QWeather timeout or network error");
        } catch (RestClientException ex) {
            log.warn("QWeather request failed: url={} message={}", requestUrl, ex.getMessage());
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "QWeather request failed");
        } catch (Exception ex) {
            log.error("QWeather response parse failed: url={}", requestUrl, ex);
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "QWeather unexpected response processing error");
        }
    }

    private WeatherCurrentVO parseSuccessOrError(String body,
                                                 int httpStatus,
                                                 String requestUrl,
                                                 String contentType) throws Exception {
        JsonNode root;
        try {
            root = objectMapper.readTree(body);
        } catch (Exception ex) {
            String bodyPreview = truncate(body, 220);
            log.warn("QWeather non-JSON response: httpStatus={} contentType={} url={} bodyPreview={}",
                    httpStatus,
                    StringUtils.hasText(contentType) ? contentType : "-",
                    requestUrl,
                    buildBodyPreview(bodyPreview));
            throw new BusinessException(ResultCode.BAD_REQUEST,
                    "QWeather invalid response format (non-JSON). Check host/auth/network gateway");
        }
        String v1Code = root.path("code").asText();
        if (!"200".equals(v1Code)) {
            QWeatherErrorInfo errorInfo = parseQWeatherError(body, httpStatus);
            logQWeatherError(requestUrl, httpStatus, errorInfo, contentType, "", body);
            throw new BusinessException(ResultCode.BAD_REQUEST, buildClientErrorMessage(errorInfo));
        }

        JsonNode now = root.path("now");
        if (now.isMissingNode() || now.isNull()) {
            QWeatherErrorInfo errorInfo = new QWeatherErrorInfo(
                    "INVALID_RESPONSE",
                    "QWeather payload error",
                    "Missing now field in weather response",
                    ""
            );
            logQWeatherError(requestUrl, httpStatus, errorInfo, contentType, "", body);
            throw new BusinessException(ResultCode.INTERNAL_ERROR, buildClientErrorMessage(errorInfo));
        }

        WeatherCurrentVO weather = new WeatherCurrentVO();
        String text = now.path("text").asText("");
        weather.setText(text);
        weather.setWeatherText(text);
        weather.setTemp(now.path("temp").asText(""));
        weather.setFeelsLike(now.path("feelsLike").asText(""));
        weather.setHumidity(now.path("humidity").asText(""));
        weather.setWindDir(now.path("windDir").asText(""));
        weather.setWindScale(now.path("windScale").asText(""));
        weather.setIcon(now.path("icon").asText(""));

        String obsTime = now.path("obsTime").asText("");
        if (!StringUtils.hasText(obsTime)) {
            obsTime = root.path("updateTime").asText("");
        }
        weather.setObsTime(obsTime);
        weather.setUpdateTime(root.path("updateTime").asText(""));
        return weather;
    }

    private void ensureApiKeyAuthOnly() {
        String authType = qWeatherProperties.getAuthType();
        if (!StringUtils.hasText(authType)) {
            return;
        }
        String normalized = authType.trim().toLowerCase(Locale.ROOT);
        if (!AUTH_TYPE_API_KEY.equals(normalized)) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR,
                    "Unsupported qweather.auth-type. This project only uses api-key mode.");
        }
    }

    private String requireApiKey() {
        String apiKey = qWeatherProperties.getApiKey();
        if (!StringUtils.hasText(apiKey)) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "QWeather api-key is not configured");
        }
        return apiKey.trim();
    }

    private String resolveLocation() {
        String location = qWeatherProperties.getLocation();
        if (StringUtils.hasText(location)) {
            return location.trim();
        }
        return DEFAULT_LOCATION;
    }

    private String normalizeHost(String host) {
        String value = StringUtils.hasText(host) ? host.trim() : DEFAULT_HOST;
        if (value.startsWith("host:")) {
            value = value.substring("host:".length()).trim();
        }
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "https://" + value;
        }
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String buildWeatherNowUrl(String host) {
        if (host.endsWith(WEATHER_NOW_PATH)) {
            return host;
        }
        if (host.endsWith("/v7/weather")) {
            return host + "/now";
        }
        if (host.contains("/v7/weather/now")) {
            int idx = host.indexOf("/v7/weather/now");
            return host.substring(0, idx) + WEATHER_NOW_PATH;
        }
        return host + WEATHER_NOW_PATH;
    }

    private QWeatherErrorInfo parseQWeatherError(String rawBody, int httpStatus) {
        if (!StringUtils.hasText(rawBody)) {
            return new QWeatherErrorInfo(
                    String.valueOf(httpStatus),
                    "QWeather HTTP error",
                    "Empty response body",
                    ""
            );
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            JsonNode errorNode = root.path("error");
            if (!errorNode.isMissingNode() && errorNode.isObject()) {
                String code = firstNonBlank(errorNode.path("code").asText(), String.valueOf(httpStatus));
                String title = firstNonBlank(errorNode.path("title").asText(), "QWeather API error");
                String detail = firstNonBlank(errorNode.path("detail").asText(), "QWeather request failed");
                String invalidParams = errorNode.path("invalidParams").isMissingNode()
                        ? ""
                        : errorNode.path("invalidParams").toString();
                return new QWeatherErrorInfo(code, title, detail, invalidParams);
            }

            String code = firstNonBlank(root.path("code").asText(), String.valueOf(httpStatus));
            String detail = mapV1CodeToDetail(code);
            return new QWeatherErrorInfo(code, "QWeather API error", detail, "");
        } catch (Exception ex) {
            return new QWeatherErrorInfo(
                    String.valueOf(httpStatus),
                    "QWeather parse error",
                    "Unrecognized error response from QWeather",
                    ""
            );
        }
    }

    private void logQWeatherError(String requestUrl,
                                  int httpStatus,
                                  QWeatherErrorInfo errorInfo,
                                  String contentType,
                                  String contentEncoding,
                                  String rawBody) {
        log.warn("QWeather error: httpStatus={} code={} title={} detail={} invalidParams={} authType=api-key-header url={} contentType={} contentEncoding={} bodyPreview={}",
                httpStatus,
                safe(errorInfo.code),
                safe(errorInfo.title),
                safe(errorInfo.detail),
                safe(errorInfo.invalidParams),
                requestUrl,
                StringUtils.hasText(contentType) ? contentType : "-",
                StringUtils.hasText(contentEncoding) ? contentEncoding : "-",
                buildBodyPreview(rawBody));
    }

    private String buildClientErrorMessage(QWeatherErrorInfo errorInfo) {
        StringBuilder builder = new StringBuilder("QWeather ");
        builder.append(StringUtils.hasText(errorInfo.code) ? errorInfo.code : "error");
        if (StringUtils.hasText(errorInfo.title)) {
            builder.append(" ").append(errorInfo.title);
        }
        if (StringUtils.hasText(errorInfo.detail)) {
            builder.append(": ").append(errorInfo.detail);
        }
        return truncate(builder.toString(), 280);
    }

    private String mapV1CodeToDetail(String code) {
        if (!StringUtils.hasText(code)) {
            return "Unknown QWeather error";
        }
        return switch (code) {
            case "200" -> "Success";
            case "204" -> "No weather data for this location";
            case "400" -> "Invalid parameter or missing required parameter";
            case "401" -> "Authentication failed";
            case "402" -> "Request quota exceeded or account balance issue";
            case "403" -> "Permission denied";
            case "404" -> "Requested location or weather data not found";
            case "429" -> "Too many requests (QPM exceeded)";
            case "500" -> "QWeather service internal error";
            default -> "QWeather error code " + code;
        };
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private String safe(String text) {
        return StringUtils.hasText(text) ? text : "-";
    }

    private String truncate(String text, int maxLength) {
        if (!StringUtils.hasText(text) || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }

    private String buildBodyPreview(String rawBody) {
        if (!StringUtils.hasText(rawBody)) {
            return "-";
        }

        String text = rawBody.trim();
        int controlChars = 0;
        for (char ch : text.toCharArray()) {
            if (Character.isISOControl(ch) && ch != '\n' && ch != '\r' && ch != '\t') {
                controlChars++;
            }
        }

        if (controlChars > 5) {
            byte[] bytes = text.getBytes(StandardCharsets.ISO_8859_1);
            return "hex=" + bytesToHex(bytes, 120);
        }

        String sanitized = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "?");
        return truncate(sanitized, 260);
    }

    private String bytesToHex(byte[] bytes, int limit) {
        if (bytes == null || bytes.length == 0) {
            return "-";
        }
        int max = Math.min(bytes.length, limit);
        StringBuilder sb = new StringBuilder(max * 2 + 8);
        for (int i = 0; i < max; i++) {
            sb.append(String.format("%02x", bytes[i]));
        }
        if (bytes.length > max) {
            sb.append("...");
        }
        return sb.toString();
    }

    private String decodeResponseBody(byte[] bodyBytes, String contentEncoding) {
        if (bodyBytes == null || bodyBytes.length == 0) {
            return "";
        }

        byte[] decoded = bodyBytes;
        if (isGzipEncoding(contentEncoding) || looksLikeGzip(decoded)) {
            try {
                decoded = unzipGzip(decoded);
            } catch (Exception ex) {
                log.warn("QWeather gzip decode failed: contentEncoding={} fallbackToRaw={}",
                        contentEncoding, ex.getMessage());
            }
        }
        return new String(decoded, StandardCharsets.UTF_8);
    }

    private boolean isGzipEncoding(String contentEncoding) {
        return StringUtils.hasText(contentEncoding)
                && contentEncoding.toLowerCase(Locale.ROOT).contains("gzip");
    }

    private boolean looksLikeGzip(byte[] bytes) {
        return bytes != null
                && bytes.length >= 2
                && (bytes[0] & 0xff) == 0x1f
                && (bytes[1] & 0xff) == 0x8b;
    }

    private byte[] unzipGzip(byte[] compressed) throws Exception {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(compressed);
             GZIPInputStream gis = new GZIPInputStream(bais);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gis.read(buffer)) > 0) {
                baos.write(buffer, 0, len);
            }
            return baos.toByteArray();
        }
    }

    private static class QWeatherErrorInfo {
        private final String code;
        private final String title;
        private final String detail;
        private final String invalidParams;

        private QWeatherErrorInfo(String code, String title, String detail, String invalidParams) {
            this.code = code;
            this.title = title;
            this.detail = detail;
            this.invalidParams = invalidParams;
        }
    }
}
