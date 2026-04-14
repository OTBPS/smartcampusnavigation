package com.nuist.pengbo.smartcampusnavigation.vo.route;

import java.util.List;

public class WalkingRouteVO {
    private Long distance;
    private Long duration;
    private List<WalkingRouteStepVO> steps;
    private List<List<Double>> routePolyline;

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
}