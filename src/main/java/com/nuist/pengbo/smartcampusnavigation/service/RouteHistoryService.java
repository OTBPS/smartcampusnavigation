package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryUpdateRequest;
import com.nuist.pengbo.smartcampusnavigation.vo.history.RouteHistoryVO;

import java.util.List;

public interface RouteHistoryService {
    List<RouteHistoryVO> list(RouteHistoryQueryRequest queryRequest);

    int countAll();

    RouteHistoryVO create(RouteHistoryCreateRequest request);

    RouteHistoryVO updateTitle(Long id, RouteHistoryUpdateRequest request);

    void delete(Long id);
}

