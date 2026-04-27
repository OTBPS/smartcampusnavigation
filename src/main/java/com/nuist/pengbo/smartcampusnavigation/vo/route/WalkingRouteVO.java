package com.nuist.pengbo.smartcampusnavigation.vo.route;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class WalkingRouteVO {
    private Long distance;
    private Long duration;
    private List<WalkingRouteStepVO> steps;
    private List<List<Double>> routePolyline;
    private List<WalkingRouteVO> alternatives;
    private String weatherRiskLevel;
    private String weatherRiskType;
    private String smartTravelAdvice;
    private List<RouteAdviceWaypointVO> recommendedWaypoints;
    private String recommendedWaypointName;
    private String recommendedStrategyTag;
    private Double recommendedWaypointLng;
    private Double recommendedWaypointLat;

    public Long getDistance() {
        return distance;
    }

    public void setDistance(Long distance) {
        this.distance = distance;
    }

    public Long getDuration() {
        return duration;
    }

    public void setDuration(Long duration) {
        this.duration = duration;
    }

    public List<WalkingRouteStepVO> getSteps() {
        return steps;
    }

    public void setSteps(List<WalkingRouteStepVO> steps) {
        this.steps = steps;
    }

    public List<List<Double>> getRoutePolyline() {
        return routePolyline;
    }

    public void setRoutePolyline(List<List<Double>> routePolyline) {
        this.routePolyline = routePolyline;
    }

    public List<WalkingRouteVO> getAlternatives() {
        return alternatives;
    }

    public void setAlternatives(List<WalkingRouteVO> alternatives) {
        this.alternatives = alternatives;
    }

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
