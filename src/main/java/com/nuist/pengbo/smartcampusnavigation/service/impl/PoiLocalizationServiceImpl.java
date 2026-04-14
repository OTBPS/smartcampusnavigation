package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuist.pengbo.smartcampusnavigation.entity.Poi;
import com.nuist.pengbo.smartcampusnavigation.service.PoiLocalizationService;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PoiLocalizationServiceImpl implements PoiLocalizationService {
    private static final Logger log = LoggerFactory.getLogger(PoiLocalizationServiceImpl.class);

    private final ObjectMapper objectMapper;
    private final Resource mappingResource;

    private final Map<Long, PoiTranslation> translationById = new HashMap<>();
    private final Map<String, PoiTranslation> translationByOriginalName = new HashMap<>();

    public PoiLocalizationServiceImpl(ObjectMapper objectMapper,
                                      @Value("classpath:i18n/poi-en.json") Resource mappingResource) {
        this.objectMapper = objectMapper;
        this.mappingResource = mappingResource;
    }

    @PostConstruct
    public void loadMappings() {
        translationById.clear();
        translationByOriginalName.clear();

        if (mappingResource == null || !mappingResource.exists()) {
            log.warn("POI i18n mapping file not found: classpath:i18n/poi-en.json");
            return;
        }

        try (InputStream inputStream = mappingResource.getInputStream()) {
            JsonNode root = objectMapper.readTree(inputStream);
            JsonNode items = root.path("pois");
            if (!items.isArray()) {
                log.warn("POI i18n mapping format is invalid: 'pois' is not an array");
                return;
            }

            for (JsonNode item : items) {
                if (item == null || item.isNull()) {
                    continue;
                }
                Long id = item.path("id").isNumber() ? item.path("id").asLong() : null;
                String originalName = trimToNull(item.path("originalName").asText());
                String translatedName = trimToNull(item.path("name").asText());
                String translatedDescription = trimToNull(item.path("description").asText());
                List<String> aliases = parseAliases(item.path("aliases"));

                PoiTranslation translation = new PoiTranslation(
                        translatedName,
                        translatedDescription,
                        aliases
                );

                if (id != null) {
                    translationById.put(id, translation);
                }
                if (StringUtils.hasText(originalName)) {
                    translationByOriginalName.put(normalize(originalName), translation);
                }
            }
            log.info("POI i18n mapping loaded: idMappings={} nameMappings={}",
                    translationById.size(),
                    translationByOriginalName.size());
        } catch (Exception ex) {
            log.error("Failed to load POI i18n mapping", ex);
        }
    }

    @Override
    public PoiVO localize(PoiVO poiVO) {
        if (poiVO == null) {
            return null;
        }
        PoiTranslation translation = findTranslation(poiVO.getId(), poiVO.getName());
        if (translation == null) {
            return poiVO;
        }

        if (StringUtils.hasText(translation.name())) {
            poiVO.setName(translation.name());
        }
        if (StringUtils.hasText(translation.description())) {
            poiVO.setDescription(translation.description());
        }
        return poiVO;
    }

    @Override
    public boolean matchesKeyword(Poi poi, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        if (poi == null) {
            return false;
        }

        String normalizedKeyword = normalize(keyword);
        PoiTranslation translation = findTranslation(poi.getId(), poi.getName());

        if (contains(poi.getName(), normalizedKeyword)
                || contains(poi.getDescription(), normalizedKeyword)) {
            return true;
        }

        if (translation == null) {
            return false;
        }
        if (contains(translation.name(), normalizedKeyword)
                || contains(translation.description(), normalizedKeyword)) {
            return true;
        }
        for (String alias : translation.aliases()) {
            if (contains(alias, normalizedKeyword)) {
                return true;
            }
        }
        return false;
    }

    private PoiTranslation findTranslation(Long id, String originalName) {
        if (id != null && translationById.containsKey(id)) {
            return translationById.get(id);
        }
        if (StringUtils.hasText(originalName)) {
            return translationByOriginalName.get(normalize(originalName));
        }
        return null;
    }

    private List<String> parseAliases(JsonNode aliasesNode) {
        List<String> aliases = new ArrayList<>();
        if (aliasesNode == null || !aliasesNode.isArray()) {
            return aliases;
        }

        for (JsonNode aliasNode : aliasesNode) {
            String alias = trimToNull(aliasNode.asText());
            if (alias != null) {
                aliases.add(alias);
            }
        }
        return aliases;
    }

    private boolean contains(String source, String keyword) {
        if (!StringUtils.hasText(source) || !StringUtils.hasText(keyword)) {
            return false;
        }
        return normalize(source).contains(keyword);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private record PoiTranslation(String name, String description, List<String> aliases) {
    }
}
