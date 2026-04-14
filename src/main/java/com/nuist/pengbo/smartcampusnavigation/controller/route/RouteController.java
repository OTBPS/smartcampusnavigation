package com.nuist.pengbo.smartcampusnavigation.controller.route;

import com.nuist.pengbo.smartcampusnavigation.common.ApiResponse;
import com.nuist.pengbo.smartcampusnavigation.dto.route.WalkingRouteQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.service.RouteService;
import com.nuist.pengbo.smartcampusnavigation.vo.route.WalkingRouteVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @GetMapping("/walking")
    public ApiResponse<WalkingRouteVO> planWalkingRoute(@RequestParam BigDecimal originLng,
                                                        @RequestParam BigDecimal originLat,
                                                        @RequestParam BigDecimal destinationLng,
                                                        @RequestParam BigDecimal destinationLat) {
        WalkingRouteQueryDTO queryDTO = new WalkingRouteQueryDTO();
        queryDTO.setOriginLng(originLng);
        queryDTO.setOriginLat(originLat);
        queryDTO.setDestinationLng(destinationLng);
        queryDTO.setDestinationLat(destinationLat);
        return ApiResponse.success(routeService.planWalkingRoute(queryDTO));
    }
}
