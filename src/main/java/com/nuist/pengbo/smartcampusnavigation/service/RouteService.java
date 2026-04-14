package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.dto.route.WalkingRouteQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.vo.route.WalkingRouteVO;

public interface RouteService {
    WalkingRouteVO planWalkingRoute(WalkingRouteQueryDTO queryDTO);

    WalkingRouteVO planCyclingRoute(WalkingRouteQueryDTO queryDTO);
}
