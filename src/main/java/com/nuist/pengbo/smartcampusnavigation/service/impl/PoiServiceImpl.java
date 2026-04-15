package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiUpdateRequest;
import com.nuist.pengbo.smartcampusnavigation.entity.Poi;
import com.nuist.pengbo.smartcampusnavigation.mapper.PoiMapper;
import com.nuist.pengbo.smartcampusnavigation.service.PoiLocalizationService;
import com.nuist.pengbo.smartcampusnavigation.service.PoiService;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class PoiServiceImpl implements PoiService {
    private static final Pattern TYPE_PATTERN = Pattern.compile("^[a-z]+(_[a-z]+)*$");
    private static final Pattern OPENING_HOURS_SLOT_PATTERN =
            Pattern.compile("^([01]\\d|2[0-4]):[0-5]\\d-([01]\\d|2[0-4]):[0-5]\\d$");
    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "activity_center",
            "administrative_office",
            "academy_building",
            "atm",
            "auditorium",
            "bank",
            "basketball_court",
            "bathhouse",
            "campus_poi",
            "canteen",
            "cafe",
            "college",
            "college_office",
            "convenience_store",
            "dorm_service",
            "express_station",
            "football_field",
            "gate",
            "gymnasium",
            "hospital",
            "laboratory_building",
            "laundry",
            "library",
            "medical_service",
            "parking",
            "playground",
            "print_shop",
            "research_institute",
            "residential_area",
            "restaurant",
            "service_center",
            "sports",
            "stadium",
            "sports_facility",
            "supermarket",
            "teaching_building",
            "telecom_hall",
            "toilet",
            "bus_stop"
    );
    private static final Map<String, String> TYPE_ALIASES = Map.of(
            "dining_hall", "canteen"
    );
    private static final Map<String, List<String>> CATEGORY_TYPE_MAPPING = Map.of(
            "administrative", List.of("administrative_office", "college_office", "service_center", "activity_center"),
            "academic", List.of("teaching_building", "laboratory_building", "library", "academy_building", "college"),
            "dining", List.of("canteen", "restaurant", "cafe"),
            "sports", List.of("gymnasium", "stadium", "playground", "basketball_court", "football_field", "sports_facility", "sports"),
            "convenience", List.of(
                    "bank", "atm", "telecom_hall", "supermarket", "convenience_store", "print_shop",
                    "express_station", "bus_stop", "parking", "dorm_service", "medical_service", "bathhouse",
                    "laundry", "toilet", "hospital", "residential_area", "campus_poi"
            )
    );
    private static final Map<String, String> DEFAULT_OPENING_HOURS = Map.ofEntries(
            Map.entry("canteen", "06:30-23:00"),
            Map.entry("restaurant", "09:00-21:00"),
            Map.entry("cafe", "09:00-22:00"),
            Map.entry("library", "08:00-22:00"),
            Map.entry("stadium", "06:00-22:00"),
            Map.entry("gymnasium", "06:30-22:00"),
            Map.entry("sports_facility", "06:00-22:00"),
            Map.entry("basketball_court", "06:00-22:00"),
            Map.entry("football_field", "06:00-22:00"),
            Map.entry("playground", "06:00-22:00"),
            Map.entry("administrative_office", "08:00-17:30"),
            Map.entry("college_office", "08:00-17:30"),
            Map.entry("service_center", "08:00-17:30"),
            Map.entry("teaching_building", "08:00-22:00"),
            Map.entry("laboratory_building", "08:00-20:00"),
            Map.entry("academy_building", "08:00-22:00"),
            Map.entry("bank", "09:00-17:00"),
            Map.entry("atm", "00:00-24:00"),
            Map.entry("telecom_hall", "09:00-18:00"),
            Map.entry("supermarket", "08:00-22:30"),
            Map.entry("convenience_store", "07:00-23:00"),
            Map.entry("print_shop", "08:00-20:00"),
            Map.entry("express_station", "09:00-20:00"),
            Map.entry("bus_stop", "00:00-24:00"),
            Map.entry("parking", "00:00-24:00"),
            Map.entry("dorm_service", "00:00-24:00"),
            Map.entry("medical_service", "00:00-24:00"),
            Map.entry("bathhouse", "06:00-23:00"),
            Map.entry("laundry", "00:00-24:00"),
            Map.entry("toilet", "00:00-24:00")
    );

    private final PoiMapper poiMapper;
    private final PoiLocalizationService poiLocalizationService;

    public PoiServiceImpl(PoiMapper poiMapper, PoiLocalizationService poiLocalizationService) {
        this.poiMapper = poiMapper;
        this.poiLocalizationService = poiLocalizationService;
    }

    @Override
    public List<PoiVO> list(PoiQueryRequest queryRequest) {
        PoiQueryRequest normalizedQuery = normalizeQuery(queryRequest);

        PoiQueryRequest dbQuery = new PoiQueryRequest();
        dbQuery.setType(normalizedQuery.getType());
        dbQuery.setTypeList(normalizedQuery.getTypeList());
        dbQuery.setEnabled(normalizedQuery.getEnabled());

        String nameKeyword = normalizedQuery.getName();
        return poiMapper.selectByCondition(dbQuery).stream()
                .filter(poi -> poiLocalizationService.matchesKeyword(poi, nameKeyword))
                .map(this::toVO)
                .map(poiLocalizationService::localize)
                .toList();
    }

    @Override
    public List<String> listTypes() {
        return poiMapper.selectAllTypes().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .sorted()
                .toList();
    }

    @Override
    public PoiVO getById(Long id) {
        Poi poi = poiMapper.selectById(id);
        if (poi == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }
        return poiLocalizationService.localize(toVO(poi));
    }

    @Override
    public PoiVO create(PoiCreateRequest request) {
        Poi poi = new Poi();
        poi.setName(requireText(request.getName(), "name"));
        poi.setType(normalizeAndValidateType(request.getType()));
        poi.setLongitude(validateLongitude(request.getLongitude()));
        poi.setLatitude(validateLatitude(request.getLatitude()));
        poi.setDescription(normalizeOptionalText(request.getDescription()));
        poi.setOpeningHours(normalizeAndValidateOpeningHours(request.getOpeningHours(), poi.getType()));
        poi.setEnabled(resolveCreateEnabled(request.getEnabled()));

        int affectedRows = poiMapper.insert(poi);
        if (affectedRows == 0) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to create POI");
        }

        Poi created = poiMapper.selectById(poi.getId());
        return poiLocalizationService.localize(toVO(created != null ? created : poi));
    }

    @Override
    public PoiVO update(Long id, PoiUpdateRequest request) {
        Poi existing = poiMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }

        existing.setName(requireText(request.getName(), "name"));
        existing.setType(normalizeAndValidateType(request.getType()));
        existing.setLongitude(validateLongitude(request.getLongitude()));
        existing.setLatitude(validateLatitude(request.getLatitude()));
        existing.setDescription(normalizeOptionalText(request.getDescription()));
        existing.setOpeningHours(normalizeAndValidateOpeningHours(request.getOpeningHours(), existing.getType()));
        existing.setEnabled(resolveUpdateEnabled(request.getEnabled(), existing.getEnabled()));

        int affectedRows = poiMapper.updateById(existing);
        if (affectedRows == 0) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }

        Poi updated = poiMapper.selectById(id);
        if (updated == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }
        return poiLocalizationService.localize(toVO(updated));
    }

    @Override
    public void delete(Long id) {
        int affectedRows = poiMapper.deleteById(id);
        if (affectedRows == 0) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }
    }

    private PoiVO toVO(Poi poi) {
        PoiVO vo = new PoiVO();
        vo.setId(poi.getId());
        vo.setName(poi.getName());
        vo.setType(poi.getType());
        vo.setLongitude(poi.getLongitude());
        vo.setLatitude(poi.getLatitude());
        vo.setDescription(poi.getDescription());
        vo.setOpeningHours(poi.getOpeningHours());
        vo.setEnabled(poi.getEnabled());
        vo.setCreatedAt(poi.getCreatedAt());
        vo.setUpdatedAt(poi.getUpdatedAt());
        return vo;
    }

    private PoiQueryRequest normalizeQuery(PoiQueryRequest source) {
        PoiQueryRequest query = new PoiQueryRequest();
        if (source == null) {
            return query;
        }

        query.setName(trimToNull(source.getName()));
        query.setType(normalizeQueryType(source.getType()));
        query.setCategory(normalizeQueryCategory(source.getCategory()));
        query.setTypeList(resolveTypeListByCategory(query.getType(), query.getCategory()));
        query.setEnabled(source.getEnabled());
        return query;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean resolveCreateEnabled(Boolean enabled) {
        return enabled == null || enabled;
    }

    private boolean resolveUpdateEnabled(Boolean requestEnabled, Boolean currentEnabled) {
        if (requestEnabled != null) {
            return requestEnabled;
        }
        return currentEnabled != null ? currentEnabled : true;
    }

    private String requireText(String value, String fieldName) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, fieldName + " cannot be blank");
        }
        return normalized;
    }

    private String normalizeOptionalText(String value) {
        return trimToNull(value);
    }

    private String normalizeQueryType(String type) {
        String normalized = trimToNull(type);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.toLowerCase().replace(' ', '_');
        return TYPE_ALIASES.getOrDefault(normalized, normalized);
    }

    private String normalizeQueryCategory(String category) {
        String normalized = trimToNull(category);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.toLowerCase().replace(' ', '_').replace('-', '_');
        if (!CATEGORY_TYPE_MAPPING.containsKey(normalized)) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "unsupported category: " + normalized);
        }
        return normalized;
    }

    private List<String> resolveTypeListByCategory(String normalizedType, String normalizedCategory) {
        if (StringUtils.hasText(normalizedType) || !StringUtils.hasText(normalizedCategory)) {
            return Collections.emptyList();
        }
        List<String> mappedTypes = CATEGORY_TYPE_MAPPING.getOrDefault(normalizedCategory, Collections.emptyList());
        if (mappedTypes.isEmpty()) {
            return Collections.emptyList();
        }
        return new ArrayList<>(mappedTypes);
    }

    private String normalizeAndValidateType(String type) {
        String normalized = normalizeQueryType(requireText(type, "type"));

        if (!TYPE_PATTERN.matcher(normalized).matches()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "type format is invalid");
        }
        if (!SUPPORTED_TYPES.contains(normalized)) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "unsupported POI type: " + normalized);
        }
        return normalized;
    }

    private BigDecimal validateLongitude(BigDecimal longitude) {
        if (longitude == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "longitude cannot be null");
        }
        if (longitude.compareTo(BigDecimal.valueOf(-180)) < 0
                || longitude.compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "longitude out of range");
        }
        return longitude;
    }

    private BigDecimal validateLatitude(BigDecimal latitude) {
        if (latitude == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "latitude cannot be null");
        }
        if (latitude.compareTo(BigDecimal.valueOf(-90)) < 0
                || latitude.compareTo(BigDecimal.valueOf(90)) > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "latitude out of range");
        }
        return latitude;
    }

    private String normalizeAndValidateOpeningHours(String openingHours, String type) {
        String normalized = trimToNull(openingHours);
        if (normalized == null) {
            return DEFAULT_OPENING_HOURS.getOrDefault(type, "08:00-22:00");
        }

        String[] slots = normalized.split(";");
        for (String slot : slots) {
            String trimmedSlot = slot == null ? "" : slot.trim();
            if (trimmedSlot.isEmpty()) {
                continue;
            }
            if (!OPENING_HOURS_SLOT_PATTERN.matcher(trimmedSlot).matches()) {
                throw new BusinessException(ResultCode.BAD_REQUEST,
                        "openingHours format is invalid, expected HH:mm-HH:mm or multi-slot split by ';'");
            }
        }
        return normalized;
    }
}
