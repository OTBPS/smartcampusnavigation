package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.entity.CoveredPathNode;
import com.nuist.pengbo.smartcampusnavigation.mapper.CoveredPathNodeMapper;
import com.nuist.pengbo.smartcampusnavigation.service.ShelterRouteService;
import com.nuist.pengbo.smartcampusnavigation.vo.route.CoveredPathNodeVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ShelterRouteServiceImpl implements ShelterRouteService {
    private static final int DEFAULT_LIMIT = 5;
    private static final int MAX_LIMIT = 20;
    private static final double EARTH_RADIUS_METERS = 6371000.0;

    private final CoveredPathNodeMapper coveredPathNodeMapper;

    public ShelterRouteServiceImpl(CoveredPathNodeMapper coveredPathNodeMapper) {
        this.coveredPathNodeMapper = coveredPathNodeMapper;
    }

    @Override
    public List<CoveredPathNodeVO> listCoveredPathNodes() {
        List<CoveredPathNode> nodes = coveredPathNodeMapper.selectEnabledNodes();
        List<CoveredPathNodeVO> result = new ArrayList<>();
        for (CoveredPathNode node : nodes) {
            result.add(toVO(node));
        }
        return result;
    }

    @Override
    public List<CoveredPathNodeVO> recommendCoveredNodes(BigDecimal originLng,
                                                         BigDecimal originLat,
                                                         BigDecimal destinationLng,
                                                         BigDecimal destinationLat,
                                                         Integer limit) {
        validateCoordinate(originLng, originLat, "origin");
        validateCoordinate(destinationLng, destinationLat, "destination");

        List<CoveredPathNode> nodes = coveredPathNodeMapper.selectEnabledNodes();
        if (nodes.isEmpty()) {
            return List.of();
        }

        int safeLimit = resolveLimit(limit);
        double refLat = (originLat.doubleValue() + destinationLat.doubleValue()) / 2.0;
        double[] startPoint = toMeters(originLng.doubleValue(), originLat.doubleValue(), refLat);
        double[] endPoint = toMeters(destinationLng.doubleValue(), destinationLat.doubleValue(), refLat);

        return nodes.stream()
                .sorted((left, right) -> compareNodes(left, right, refLat, startPoint, endPoint))
                .limit(safeLimit)
                .map(this::toVO)
                .toList();
    }

    private int resolveLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private void validateCoordinate(BigDecimal lng, BigDecimal lat, String label) {
        if (lng == null || lat == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, label + " coordinates are required");
        }
        if (lng.compareTo(BigDecimal.valueOf(-180)) < 0 || lng.compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST, label + " longitude out of range");
        }
        if (lat.compareTo(BigDecimal.valueOf(-90)) < 0 || lat.compareTo(BigDecimal.valueOf(90)) > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST, label + " latitude out of range");
        }
    }

    private CoveredPathNodeVO toVO(CoveredPathNode node) {
        CoveredPathNodeVO vo = new CoveredPathNodeVO();
        vo.setId(node.getId());
        vo.setName(node.getName());
        vo.setLongitude(node.getLongitude());
        vo.setLatitude(node.getLatitude());
        vo.setDescription(node.getDescription());
        vo.setPriority(node.getPriority());
        return vo;
    }

    private int compareNodes(CoveredPathNode left,
                             CoveredPathNode right,
                             double refLat,
                             double[] startPoint,
                             double[] endPoint) {
        double leftDistance = distancePointToSegmentMeters(left, refLat, startPoint, endPoint);
        double rightDistance = distancePointToSegmentMeters(right, refLat, startPoint, endPoint);
        int byDistance = Double.compare(leftDistance, rightDistance);
        if (byDistance != 0) {
            return byDistance;
        }

        int leftPriority = left != null && left.getPriority() != null ? left.getPriority() : 0;
        int rightPriority = right != null && right.getPriority() != null ? right.getPriority() : 0;
        int byPriority = Integer.compare(rightPriority, leftPriority);
        if (byPriority != 0) {
            return byPriority;
        }

        long leftId = left != null && left.getId() != null ? left.getId() : Long.MAX_VALUE;
        long rightId = right != null && right.getId() != null ? right.getId() : Long.MAX_VALUE;
        return Long.compare(leftId, rightId);
    }

    private double distancePointToSegmentMeters(CoveredPathNode node,
                                                double refLat,
                                                double[] startPoint,
                                                double[] endPoint) {
        if (node == null || node.getLongitude() == null || node.getLatitude() == null) {
            return Double.MAX_VALUE;
        }

        double[] point = toMeters(node.getLongitude().doubleValue(), node.getLatitude().doubleValue(), refLat);
        return pointToSegmentDistance(point[0], point[1], startPoint[0], startPoint[1], endPoint[0], endPoint[1]);
    }

    private double[] toMeters(double lng, double lat, double refLat) {
        double cosRef = Math.cos(Math.toRadians(refLat));
        double x = Math.toRadians(lng) * EARTH_RADIUS_METERS * cosRef;
        double y = Math.toRadians(lat) * EARTH_RADIUS_METERS;
        return new double[]{x, y};
    }

    private double pointToSegmentDistance(double px, double py,
                                          double x1, double y1,
                                          double x2, double y2) {
        double dx = x2 - x1;
        double dy = y2 - y1;
        if (dx == 0 && dy == 0) {
            return euclideanDistance(px, py, x1, y1);
        }

        double t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
        if (t < 0) {
            return euclideanDistance(px, py, x1, y1);
        }
        if (t > 1) {
            return euclideanDistance(px, py, x2, y2);
        }

        double projectionX = x1 + t * dx;
        double projectionY = y1 + t * dy;
        return euclideanDistance(px, py, projectionX, projectionY);
    }

    private double euclideanDistance(double x1, double y1, double x2, double y2) {
        double dx = x1 - x2;
        double dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
