package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryUpdateRequest;
import com.nuist.pengbo.smartcampusnavigation.entity.RouteHistory;
import com.nuist.pengbo.smartcampusnavigation.mapper.RouteHistoryMapper;
import com.nuist.pengbo.smartcampusnavigation.service.RouteHistoryService;
import com.nuist.pengbo.smartcampusnavigation.vo.history.RouteHistoryVO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;

@Service
public class RouteHistoryServiceImpl implements RouteHistoryService {
    private static final int MAX_HISTORY_SIZE = 10;
    private static final Set<String> SUPPORTED_MODES = Set.of("walking", "cycling");

    private final RouteHistoryMapper routeHistoryMapper;

    public RouteHistoryServiceImpl(RouteHistoryMapper routeHistoryMapper) {
        this.routeHistoryMapper = routeHistoryMapper;
    }

    @Override
    public List<RouteHistoryVO> list(RouteHistoryQueryRequest queryRequest) {
        String keyword = normalizeOptionalText(queryRequest == null ? null : queryRequest.getKeyword());
        return routeHistoryMapper.selectRecentByKeyword(keyword, MAX_HISTORY_SIZE)
                .stream()
                .map(this::toVO)
                .toList();
    }

    @Override
    public int countAll() {
        return routeHistoryMapper.countAll();
    }

    @Override
    public RouteHistoryVO create(RouteHistoryCreateRequest request) {
        RouteHistory routeHistory = new RouteHistory();
        routeHistory.setMode(normalizeMode(request.getMode()));
        routeHistory.setStartName(requireText(request.getStartName(), "startName"));
        routeHistory.setStartLng(request.getStartLng());
        routeHistory.setStartLat(request.getStartLat());
        routeHistory.setEndName(requireText(request.getEndName(), "endName"));
        routeHistory.setEndLng(request.getEndLng());
        routeHistory.setEndLat(request.getEndLat());
        routeHistory.setViaJson(normalizeOptionalText(request.getViaJson()));
        routeHistory.setDistance(request.getDistance() == null ? 0L : Math.max(0L, request.getDistance()));
        routeHistory.setDuration(request.getDuration() == null ? 0L : Math.max(0L, request.getDuration()));

        String title = normalizeOptionalText(request.getTitle());
        if (!StringUtils.hasText(title)) {
            title = routeHistory.getStartName() + " -> " + routeHistory.getEndName();
        }
        routeHistory.setTitle(title);

        RouteHistory existing = routeHistoryMapper.selectByRouteSignature(
                routeHistory.getStartLng(),
                routeHistory.getStartLat(),
                routeHistory.getEndLng(),
                routeHistory.getEndLat(),
                routeHistory.getViaJson()
        );

        if (existing == null) {
            int inserted = routeHistoryMapper.insert(routeHistory);
            if (inserted == 0 || routeHistory.getId() == null) {
                throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to save route history");
            }
        } else {
            routeHistory.setId(existing.getId());
            int refreshed = routeHistoryMapper.refreshRouteById(existing.getId());
            if (refreshed == 0) {
                throw new BusinessException(ResultCode.INTERNAL_ERROR, "Failed to refresh route history");
            }
        }

        routeHistoryMapper.deleteOverflow(MAX_HISTORY_SIZE);
        RouteHistory saved = routeHistoryMapper.selectById(routeHistory.getId());
        return toVO(saved == null ? routeHistory : saved);
    }

    @Override
    public RouteHistoryVO updateTitle(Long id, RouteHistoryUpdateRequest request) {
        String title = requireText(request.getTitle(), "title");
        int affected = routeHistoryMapper.updateTitleById(id, title);
        if (affected == 0) {
            throw new BusinessException(ResultCode.NOT_FOUND, "Route history not found");
        }
        RouteHistoryQueryRequest query = new RouteHistoryQueryRequest();
        List<RouteHistoryVO> recent = list(query);
        return recent.stream()
                .filter(item -> id.equals(item.getId()))
                .findFirst()
                .orElseGet(() -> {
                    RouteHistoryVO vo = new RouteHistoryVO();
                    vo.setId(id);
                    vo.setTitle(title);
                    return vo;
                });
    }

    @Override
    public void delete(Long id) {
        int affected = routeHistoryMapper.deleteById(id);
        if (affected == 0) {
            throw new BusinessException(ResultCode.NOT_FOUND, "Route history not found");
        }
    }

    @Override
    public int clearAll() {
        return routeHistoryMapper.deleteAll();
    }

    private RouteHistoryVO toVO(RouteHistory entity) {
        RouteHistoryVO vo = new RouteHistoryVO();
        vo.setId(entity.getId());
        vo.setTitle(entity.getTitle());
        vo.setMode(entity.getMode());
        vo.setStartName(entity.getStartName());
        vo.setStartLng(entity.getStartLng());
        vo.setStartLat(entity.getStartLat());
        vo.setEndName(entity.getEndName());
        vo.setEndLng(entity.getEndLng());
        vo.setEndLat(entity.getEndLat());
        vo.setViaJson(entity.getViaJson());
        vo.setDistance(entity.getDistance());
        vo.setDuration(entity.getDuration());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        return vo;
    }

    private String normalizeMode(String mode) {
        String normalized = requireText(mode, "mode").toLowerCase();
        if (!SUPPORTED_MODES.contains(normalized)) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "Unsupported route mode: " + normalized);
        }
        return normalized;
    }

    private String normalizeOptionalText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String requireText(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(ResultCode.BAD_REQUEST, fieldName + " cannot be blank");
        }
        return value.trim();
    }
}
