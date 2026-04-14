package com.nuist.pengbo.smartcampusnavigation.dto.suggestion;

public class SuggestionContextQueryDTO {
    private Long poiId;
    private Long routeDistance;
    private Long routeDuration;
    private String sceneType;
    private Integer hour;

    public Long getPoiId() {
        return poiId;
    }

    public void setPoiId(Long poiId) {
        this.poiId = poiId;
    }

    public Long getRouteDistance() {
        return routeDistance;
    }

    public void setRouteDistance(Long routeDistance) {
        this.routeDistance = routeDistance;
    }

    public Long getRouteDuration() {
        return routeDuration;
    }

    public void setRouteDuration(Long routeDuration) {
        this.routeDuration = routeDuration;
    }

    public String getSceneType() {
        return sceneType;
    }

    public void setSceneType(String sceneType) {
        this.sceneType = sceneType;
    }

    public Integer getHour() {
        return hour;
    }

    public void setHour(Integer hour) {
        this.hour = hour;
    }
}
