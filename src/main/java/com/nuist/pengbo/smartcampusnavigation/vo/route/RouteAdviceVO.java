package com.nuist.pengbo.smartcampusnavigation.vo.route;

import java.util.List;

public class RouteAdviceVO {
    private String weatherRiskLevel;
    private String weatherRiskType;
    private String smartTravelAdvice;
    private List<RouteAdviceWaypointVO> recommendedWaypoints;
    private String recommendedWaypointName;
    private String recommendedStrategyTag;
    private Double recommendedWaypointLng;
    private Double recommendedWaypointLat;

    public String getWeatherRiskLevel() {
        return weatherRiskLevel;
    }

    public void setWeatherRiskLevel(String weatherRiskLevel) {
        this.weatherRiskLevel = weatherRiskLevel;
    }

    public String getWeatherRiskType() {
        return weatherRiskType;
    }

    public void setWeatherRiskType(String weatherRiskType) {
        this.weatherRiskType = weatherRiskType;
    }

    public String getSmartTravelAdvice() {
        return smartTravelAdvice;
    }

    public void setSmartTravelAdvice(String smartTravelAdvice) {
        this.smartTravelAdvice = smartTravelAdvice;
    }

    public List<RouteAdviceWaypointVO> getRecommendedWaypoints() {
        return recommendedWaypoints;
    }

    public void setRecommendedWaypoints(List<RouteAdviceWaypointVO> recommendedWaypoints) {
        this.recommendedWaypoints = recommendedWaypoints;
    }

    public String getRecommendedWaypointName() {
        return recommendedWaypointName;
    }

    public void setRecommendedWaypointName(String recommendedWaypointName) {
        this.recommendedWaypointName = recommendedWaypointName;
    }

    public String getRecommendedStrategyTag() {
        return recommendedStrategyTag;
    }

    public void setRecommendedStrategyTag(String recommendedStrategyTag) {
        this.recommendedStrategyTag = recommendedStrategyTag;
    }

    public Double getRecommendedWaypointLng() {
        return recommendedWaypointLng;
    }

    public void setRecommendedWaypointLng(Double recommendedWaypointLng) {
        this.recommendedWaypointLng = recommendedWaypointLng;
    }

    public Double getRecommendedWaypointLat() {
        return recommendedWaypointLat;
    }

    public void setRecommendedWaypointLat(Double recommendedWaypointLat) {
        this.recommendedWaypointLat = recommendedWaypointLat;
    }
}
