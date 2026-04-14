package com.nuist.pengbo.smartcampusnavigation.vo.route;

import java.util.List;

public class WalkingRouteStepVO {
    private String instruction;
    private Long distance;
    private Long duration;
    private List<List<Double>> polyline;

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
    }

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

    public List<List<Double>> getPolyline() {
        return polyline;
    }

    public void setPolyline(List<List<Double>> polyline) {
        this.polyline = polyline;
    }
}
