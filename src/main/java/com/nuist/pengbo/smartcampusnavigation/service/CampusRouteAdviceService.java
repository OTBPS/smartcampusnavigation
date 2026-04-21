package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.dto.route.WalkingRouteQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.vo.route.RouteAdviceVO;

import java.util.List;

public interface CampusRouteAdviceService {
    RouteAdviceVO buildAdvice(WalkingRouteQueryDTO queryDTO,
                              List<List<Double>> baselinePolyline,
                              boolean allowCoveredWaypointRecommendation);
}
