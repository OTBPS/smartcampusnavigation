package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.dto.saved.SavedPlaceCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.saved.SavedPlaceImportItem;
import com.nuist.pengbo.smartcampusnavigation.entity.SavedPlace;
import com.nuist.pengbo.smartcampusnavigation.mapper.SavedPlaceMapper;
import com.nuist.pengbo.smartcampusnavigation.service.SavedPlaceService;
import com.nuist.pengbo.smartcampusnavigation.vo.saved.SavedPlaceVO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class SavedPlaceServiceImpl implements SavedPlaceService {
    private static final String UNCATEGORIZED = "Uncategorized";
    private static final Set<String> UNCATEGORIZED_TYPE_SET = Set.of(
            "unknown",
            "uncategorized",
            "map_point",
            "-",
            "null",
            "undefined",
            ""
    );

    private final SavedPlaceMapper savedPlaceMapper;

    public SavedPlaceServiceImpl(SavedPlaceMapper savedPlaceMapper) {
        this.savedPlaceMapper = savedPlaceMapper;
    }

    @Override
    public List<SavedPlaceVO> list() {
        return savedPlaceMapper.selectAll()
                .stream()
                .map(this::toVO)
                .toList();
    }

    @Override
    public int countAll() {
        return savedPlaceMapper.countAll();
    }

    @Override
    public SavedPlaceVO save(SavedPlaceCreateRequest request) {
        SavedPlace candidate = buildFromCreateRequest(request);
        SavedPlace saved = upsertByRule(candidate);
        return toVO(saved);
    }

    @Override
    public SavedPlaceVO rename(Long id, String name) {
        String nextName = requireText(name, "name");
        int affected = savedPlaceMapper.updateNameById(id, nextName);
        if (affected == 0) {
            throw new BusinessException(ResultCode.NOT_FOUND, "Saved place not found");
        }
        SavedPlace latest = savedPlaceMapper.selectById(id);
        if (latest == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "Saved place not found");
        }
        return toVO(latest);
    }

    @Override
    public void delete(Long id) {
        int affected = savedPlaceMapper.deleteById(id);
        if (affected == 0) {
            throw new BusinessException(ResultCode.NOT_FOUND, "Saved place not found");
        }
    }

    @Override
    public Map<String, Integer> importFromLocal(List<SavedPlaceImportItem> items) {
        List<SavedPlaceImportItem> safeItems = items == null ? List.of() : items;
        int inserted = 0;
        int updated = 0;

        for (SavedPlaceImportItem item : safeItems) {
            SavedPlace candidate = buildFromImportItem(item);
            if (candidate == null) {
                continue;
            }
            SavedPlace existing = findExistingByRule(candidate);
            if (existing == null) {
                SavedPlace insertedRecord = insertSavedPlace(candidate);
                if (insertedRecord != null) {
                    inserted += 1;
                }
            } else {
                candidate.setId(existing.getId());
                SavedPlace updatedRecord = updateSavedPlace(candidate);
                if (updatedRecord != null) {
                    updated += 1;
                }
            }
        }

        return Map.of(
                "imported", inserted + updated,
                "inserted", inserted,
                "updated", updated,
                "totalCount", countAll()
        );
    }

    private SavedPlace buildFromCreateRequest(SavedPlaceCreateRequest request) {
        SavedPlace candidate = new SavedPlace();
        candidate.setPoiId(request.getPoiId());
        candidate.setName(requireText(request.getName(), "name"));
        candidate.setType(normalizeOptionalText(request.getType()));
        candidate.setLongitude(normalizeCoordinate(request.getLongitude()));
        candidate.setLatitude(normalizeCoordinate(request.getLatitude()));
        candidate.setDescription(normalizeOptionalText(request.getDescription()));
        candidate.setOpeningHours(normalizeOptionalText(request.getOpeningHours()));
        candidate.setSource(defaultSource(request.getSource()));
        candidate.setSavedAt(LocalDateTime.now());
        return candidate;
    }

    private SavedPlace buildFromImportItem(SavedPlaceImportItem item) {
        if (item == null) {
            return null;
        }
        String name = normalizeOptionalText(item.getName());
        BigDecimal longitude = normalizeCoordinate(item.getLongitude());
        BigDecimal latitude = normalizeCoordinate(item.getLatitude());
        Long poiId = item.getPoiId();

        if (!StringUtils.hasText(name) && poiId == null && (longitude == null || latitude == null)) {
            return null;
        }

        SavedPlace candidate = new SavedPlace();
        candidate.setPoiId(poiId);
        candidate.setName(StringUtils.hasText(name) ? name : "Saved Place");
        candidate.setType(normalizeOptionalText(item.getType()));
        candidate.setLongitude(longitude);
        candidate.setLatitude(latitude);
        candidate.setDescription(normalizeOptionalText(item.getDescription()));
        candidate.setOpeningHours(normalizeOptionalText(item.getOpeningHours()));
        candidate.setSource(defaultSource(item.getSource()));
        candidate.setSavedAt(parseSavedAt(item.getSavedAt()));
        return candidate;
    }

    private SavedPlace upsertByRule(SavedPlace candidate) {
        SavedPlace existing = findExistingByRule(candidate);
        if (existing == null) {
            return insertSavedPlace(candidate);
        }
        candidate.setId(existing.getId());
        return updateSavedPlace(candidate);
    }

    private SavedPlace findExistingByRule(SavedPlace candidate) {
        if (candidate == null) {
            return null;
        }
        if (candidate.getPoiId() != null) {
            SavedPlace byPoiId = savedPlaceMapper.selectByPoiId(candidate.getPoiId());
            if (byPoiId != null) {
                return byPoiId;
            }
        }
        if (candidate.getLongitude() != null && candidate.getLatitude() != null) {
            return savedPlaceMapper.selectByRoundedCoordinate(candidate.getLongitude(), candidate.getLatitude());
        }
        return null;
    }

    private SavedPlace insertSavedPlace(SavedPlace candidate) {
        if (candidate == null) {
            return null;
        }
        if (candidate.getSavedAt() == null) {
            candidate.setSavedAt(LocalDateTime.now());
        }
        int inserted = savedPlaceMapper.insert(candidate);
        if (inserted == 0 || candidate.getId() == null) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to save place");
        }
        SavedPlace latest = savedPlaceMapper.selectById(candidate.getId());
        return latest == null ? candidate : latest;
    }

    private SavedPlace updateSavedPlace(SavedPlace candidate) {
        if (candidate == null || candidate.getId() == null) {
            return null;
        }
        if (candidate.getSavedAt() == null) {
            candidate.setSavedAt(LocalDateTime.now());
        }
        int affected = savedPlaceMapper.updateById(candidate);
        if (affected == 0) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to update saved place");
        }
        SavedPlace latest = savedPlaceMapper.selectById(candidate.getId());
        return latest == null ? candidate : latest;
    }

    private SavedPlaceVO toVO(SavedPlace entity) {
        SavedPlaceVO vo = new SavedPlaceVO();
        vo.setId(entity.getId());
        vo.setPoiId(entity.getPoiId());
        vo.setName(entity.getName());
        vo.setType(entity.getType());
        vo.setLongitude(entity.getLongitude());
        vo.setLatitude(entity.getLatitude());
        vo.setDescription(entity.getDescription());
        vo.setOpeningHours(entity.getOpeningHours());
        vo.setSource(entity.getSource());
        vo.setSavedAt(entity.getSavedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        vo.setCategoryKey(resolveCategoryKey(entity.getType()));
        return vo;
    }

    private String resolveCategoryKey(String type) {
        String normalized = normalizeOptionalText(type);
        if (!StringUtils.hasText(normalized)) {
            return UNCATEGORIZED;
        }
        String key = normalized.toLowerCase(Locale.ROOT);
        if (UNCATEGORIZED_TYPE_SET.contains(key)) {
            return UNCATEGORIZED;
        }
        return normalized;
    }

    private BigDecimal normalizeCoordinate(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.setScale(6, RoundingMode.HALF_UP);
    }

    private String normalizeOptionalText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String defaultSource(String source) {
        String normalized = normalizeOptionalText(source);
        return StringUtils.hasText(normalized) ? normalized : "poi-detail";
    }

    private LocalDateTime parseSavedAt(String value) {
        String normalized = normalizeOptionalText(value);
        if (!StringUtils.hasText(normalized)) {
            return LocalDateTime.now();
        }
        try {
            return OffsetDateTime.parse(normalized).toLocalDateTime();
        } catch (DateTimeParseException ignore) {
            // Try local datetime fallback.
        }
        try {
            return LocalDateTime.parse(normalized);
        } catch (DateTimeParseException ignore) {
            return LocalDateTime.now();
        }
    }

    private String requireText(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(ResultCode.BAD_REQUEST, fieldName + " cannot be blank");
        }
        return value.trim();
    }
}
