package com.nuist.pengbo.smartcampusnavigation.vo.route;

public class RouteAdviceWaypointVO {
    private String name;
    private Double lng;
    private Double lat;
    private Double distanceMeters;
    private Double distanceFromStartMeters;
    private Integer priority;
    private String strategyTag;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Double distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public Double getDistanceFromStartMeters() {
        return distanceFromStartMeters;
    }

    public void setDistanceFromStartMeters(Double distanceFromStartMeters) {
        this.distanceFromStartMeters = distanceFromStartMeters;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getStrategyTag() {
        return strategyTag;
    }

    public void setStrategyTag(String strategyTag) {
        this.strategyTag = strategyTag;
    }
}
