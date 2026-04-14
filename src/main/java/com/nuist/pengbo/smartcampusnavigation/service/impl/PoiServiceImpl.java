package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiUpdateRequest;
import com.nuist.pengbo.smartcampusnavigation.entity.Poi;
import com.nuist.pengbo.smartcampusnavigation.mapper.PoiMapper;
import com.nuist.pengbo.smartcampusnavigation.service.PoiService;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PoiServiceImpl implements PoiService {

    private final PoiMapper poiMapper;

    public PoiServiceImpl(PoiMapper poiMapper) {
        this.poiMapper = poiMapper;
    }

    @Override
    public List<PoiVO> list(PoiQueryRequest queryRequest) {
        PoiQueryRequest normalizedQuery = normalizeQuery(queryRequest);
        return poiMapper.selectByCondition(normalizedQuery).stream().map(this::toVO).toList();
    }

    @Override
    public PoiVO getById(Long id) {
        Poi poi = poiMapper.selectById(id);
        if (poi == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }
        return toVO(poi);
    }

    @Override
    public PoiVO create(PoiCreateRequest request) {
        Poi poi = new Poi();
        poi.setName(request.getName());
        poi.setType(request.getType());
        poi.setLongitude(request.getLongitude());
        poi.setLatitude(request.getLatitude());
        poi.setDescription(request.getDescription());
        poi.setOpeningHours(request.getOpeningHours());
        poi.setEnabled(resolveCreateEnabled(request.getEnabled()));

        int affectedRows = poiMapper.insert(poi);
        if (affectedRows == 0) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to create POI");
        }

        Poi created = poiMapper.selectById(poi.getId());
        return toVO(created != null ? created : poi);
    }

    @Override
    public PoiVO update(Long id, PoiUpdateRequest request) {
        Poi existing = poiMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }

        existing.setName(request.getName());
        existing.setType(request.getType());
        existing.setLongitude(request.getLongitude());
        existing.setLatitude(request.getLatitude());
        existing.setDescription(request.getDescription());
        existing.setOpeningHours(request.getOpeningHours());
        existing.setEnabled(resolveUpdateEnabled(request.getEnabled(), existing.getEnabled()));

        int affectedRows = poiMapper.updateById(existing);
        if (affectedRows == 0) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }

        Poi updated = poiMapper.selectById(id);
        if (updated == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "POI not found");
        }
        return toVO(updated);
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
        query.setType(trimToNull(source.getType()));
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
}
