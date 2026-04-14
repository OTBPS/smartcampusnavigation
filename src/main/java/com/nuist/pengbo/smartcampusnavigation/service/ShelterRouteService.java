package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.vo.route.CoveredPathNodeVO;

import java.math.BigDecimal;
import java.util.List;

public interface ShelterRouteService {
    List<CoveredPathNodeVO> listCoveredPathNodes();

    List<CoveredPathNodeVO> recommendCoveredNodes(BigDecimal originLng,
                                                  BigDecimal originLat,
                                                  BigDecimal destinationLng,
                                                  BigDecimal destinationLat,
                                                  Integer limit);
}
