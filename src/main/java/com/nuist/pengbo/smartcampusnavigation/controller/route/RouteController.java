package com.nuist.pengbo.smartcampusnavigation.controller.route;

import com.nuist.pengbo.smartcampusnavigation.common.ApiResponse;
import com.nuist.pengbo.smartcampusnavigation.dto.route.WalkingRouteQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.service.RouteService;
import com.nuist.pengbo.smartcampusnavigation.service.ShelterRouteService;
import com.nuist.pengbo.smartcampusnavigation.vo.route.CoveredPathNodeVO;
import com.nuist.pengbo.smartcampusnavigation.vo.route.WalkingRouteVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;
    private final ShelterRouteService shelterRouteService;

    public RouteController(RouteService routeService, ShelterRouteService shelterRouteService) {
        this.routeService = routeService;
        this.shelterRouteService = shelterRouteService;
    }

    @GetMapping("/walking")
    public ApiResponse<WalkingRouteVO> planWalkingRoute(@RequestParam BigDecimal originLng,
                                                        @RequestParam BigDecimal originLat,
                                                        @RequestParam(required = false) String originType,
                                                        @RequestParam(required = false, name = "viaLng") List<BigDecimal> viaLngList,
                                                        @RequestParam(required = false, name = "viaLat") List<BigDecimal> viaLatList,
                                                        @RequestParam BigDecimal destinationLng,
                                                        @RequestParam BigDecimal destinationLat,
                                                        @RequestParam(required = false) String destinationType) {
        WalkingRouteQueryDTO queryDTO = new WalkingRouteQueryDTO();
        queryDTO.setOriginLng(originLng);
        queryDTO.setOriginLat(originLat);
        queryDTO.setOriginType(originType);
        queryDTO.setViaLngList(viaLngList);
        queryDTO.setViaLatList(viaLatList);
        queryDTO.setDestinationLng(destinationLng);
        queryDTO.setDestinationLat(destinationLat);
        queryDTO.setDestinationType(destinationType);
        return ApiResponse.success(routeService.planWalkingRoute(queryDTO));
    }

    @GetMapping("/cycling")
    public ApiResponse<WalkingRouteVO> planCyclingRoute(@RequestParam BigDecimal originLng,
                                                         @RequestParam BigDecimal originLat,
                                                         @RequestParam(required = false) String originType,
                                                         @RequestParam(required = false, name = "viaLng") List<BigDecimal> viaLngList,
                                                         @RequestParam(required = false, name = "viaLat") List<BigDecimal> viaLatList,
                                                         @RequestParam BigDecimal destinationLng,
                                                         @RequestParam BigDecimal destinationLat,
                                                         @RequestParam(required = false) String destinationType) {
        WalkingRouteQueryDTO queryDTO = new WalkingRouteQueryDTO();
        queryDTO.setOriginLng(originLng);
        queryDTO.setOriginLat(originLat);
        queryDTO.setOriginType(originType);
        queryDTO.setViaLngList(viaLngList);
        queryDTO.setViaLatList(viaLatList);
        queryDTO.setDestinationLng(destinationLng);
        queryDTO.setDestinationLat(destinationLat);
        queryDTO.setDestinationType(destinationType);
        return ApiResponse.success(routeService.planCyclingRoute(queryDTO));
    }

    @GetMapping("/shelter/nodes")
    public ApiResponse<List<CoveredPathNodeVO>> listCoveredPathNodes() {
        return ApiResponse.success(shelterRouteService.listCoveredPathNodes());
    }

    @GetMapping("/shelter/recommendations")
    public ApiResponse<List<CoveredPathNodeVO>> recommendCoveredNodes(@RequestParam BigDecimal originLng,
                                                                      @RequestParam BigDecimal originLat,
                                                                      @RequestParam BigDecimal destinationLng,
                                                                      @RequestParam BigDecimal destinationLat,
                                                                      @RequestParam(required = false) Integer limit) {
        return ApiResponse.success(shelterRouteService.recommendCoveredNodes(
                originLng, originLat, destinationLng, destinationLat, limit));
    }
}
