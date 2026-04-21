package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.service.WeatherRiskEvaluator;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Set;

@Service
public class WeatherRiskEvaluatorImpl implements WeatherRiskEvaluator {
    private static final Set<String> RAIN_KEYWORDS = Set.of(
            "shower rain", "heavy shower rain", "thundershower", "heavy thunderstorm", "hail",
            "light rain", "moderate rain", "heavy rain", "extreme rain", "drizzle rain",
            "rainstorm", "heavy rainstorm", "severe rainstorm", "freezing rain",
            "light to moderate rain", "moderate to heavy rain", "heavy rain to rainstorm",
            "rainstorm to heavy rainstorm", "heavy to severe rainstorm", "rain"
    );

    private static final Set<String> SNOW_KEYWORDS = Set.of(
            "light snow", "moderate snow", "heavy snow", "snowstorm", "sleet", "rain and snow",
            "shower rain and snow", "snow flurry", "light to moderate snow", "moderate to heavy snow",
            "heavy snow to snowstorm", "snow"
    );

    private static final Set<String> LOW_VISIBILITY_KEYWORDS = Set.of(
            "mist", "fog", "dense fog", "strong fog", "heavy fog", "extra heavy fog",
            "haze", "moderate haze", "heavy haze", "severe haze", "sand", "dust", "duststorm", "sandstorm"
    );

    @Override
    public WeatherRiskResult evaluate(String weatherText, String windScale, String temp) {
        WeatherRiskResult result = new WeatherRiskResult();
        result.setRiskLevel("NONE");
        result.setRiskType("NORMAL");
        result.setTriggerFamily("normal");

        String normalizedWeather = normalize(weatherText);
        int wind = parseInteger(windScale, -1);
        Integer temperature = parseInteger(temp, null);

        boolean rainFamily = containsAny(normalizedWeather, RAIN_KEYWORDS);
        boolean snowFamily = containsAny(normalizedWeather, SNOW_KEYWORDS);
        boolean visibilityRisk = containsAny(normalizedWeather, LOW_VISIBILITY_KEYWORDS);
        boolean strongWind = wind >= 6;
        boolean badWind = wind >= 8;
        boolean extremeTemp = containsAny(normalizedWeather, Set.of("hot", "cold"))
                || (temperature != null && (temperature >= 35 || temperature <= 0));

        if (rainFamily || snowFamily) {
            result.setRiskLevel("HIGH");
            result.setRiskType(rainFamily ? "RAIN_FAMILY" : "SNOW_FAMILY");
            result.setTriggerFamily(rainFamily ? "rain_family" : "snow_family");
            return result;
        }

        if (visibilityRisk) {
            result.setRiskLevel("HIGH");
            result.setRiskType("LOW_VISIBILITY");
            result.setTriggerFamily("low_visibility");
            return result;
        }

        if (badWind) {
            result.setRiskLevel("HIGH");
            result.setRiskType("STRONG_WIND");
            result.setTriggerFamily("strong_wind");
            return result;
        }

        if (strongWind) {
            result.setRiskLevel("MEDIUM");
            result.setRiskType("STRONG_WIND");
            result.setTriggerFamily("strong_wind");
            return result;
        }

        if (extremeTemp) {
            result.setRiskLevel("MEDIUM");
            result.setRiskType("EXTREME_TEMPERATURE");
            result.setTriggerFamily("extreme_temperature");
        }

        return result;
    }

    private boolean containsAny(String text, Set<String> keywords) {
        if (!StringUtils.hasText(text) || keywords == null || keywords.isEmpty()) {
            return false;
        }
        for (String keyword : keywords) {
            if (StringUtils.hasText(keyword) && text.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        return text.trim().toLowerCase(Locale.ROOT);
    }

    private Integer parseInteger(String value, Integer defaultValue) {
        if (!StringUtils.hasText(value)) {
            return defaultValue;
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
            return defaultValue;
        }
        try {
            return Integer.parseInt(digits.toString());
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}
