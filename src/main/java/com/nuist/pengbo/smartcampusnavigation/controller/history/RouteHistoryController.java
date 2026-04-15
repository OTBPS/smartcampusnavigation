package com.nuist.pengbo.smartcampusnavigation.controller.history;

import com.nuist.pengbo.smartcampusnavigation.common.ApiResponse;
import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.history.RouteHistoryUpdateRequest;
import com.nuist.pengbo.smartcampusnavigation.service.RouteHistoryService;
import com.nuist.pengbo.smartcampusnavigation.vo.history.RouteHistoryVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/route-histories")
public class RouteHistoryController {

    private final RouteHistoryService routeHistoryService;

    public RouteHistoryController(RouteHistoryService routeHistoryService) {
        this.routeHistoryService = routeHistoryService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> list(RouteHistoryQueryRequest queryRequest) {
        List<RouteHistoryVO> items = routeHistoryService.list(queryRequest);
        int totalCount = routeHistoryService.countAll();
        return ApiResponse.success(Map.of(
                "items", items,
                "totalCount", totalCount
        ));
    }

    @PostMapping
    public ApiResponse<RouteHistoryVO> create(@Valid @RequestBody RouteHistoryCreateRequest request) {
        return ApiResponse.success("Route history saved", routeHistoryService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<RouteHistoryVO> updateTitle(@PathVariable Long id,
                                                   @Valid @RequestBody RouteHistoryUpdateRequest request) {
        return ApiResponse.success("Route history updated", routeHistoryService.updateTitle(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        routeHistoryService.delete(id);
        return ApiResponse.success("Route history deleted", null);
    }
}

