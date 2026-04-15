package com.nuist.pengbo.smartcampusnavigation.dto.history;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class RouteHistoryCreateRequest {
    private String title;

    @NotBlank(message = "mode cannot be blank")
    private String mode;

    @NotBlank(message = "startName cannot be blank")
    private String startName;

    @NotNull(message = "startLng cannot be null")
    @DecimalMin(value = "-180", message = "startLng out of range")
    @DecimalMax(value = "180", message = "startLng out of range")
    private BigDecimal startLng;

    @NotNull(message = "startLat cannot be null")
    @DecimalMin(value = "-90", message = "startLat out of range")
    @DecimalMax(value = "90", message = "startLat out of range")
    private BigDecimal startLat;

    @NotBlank(message = "endName cannot be blank")
    private String endName;

    @NotNull(message = "endLng cannot be null")
    @DecimalMin(value = "-180", message = "endLng out of range")
    @DecimalMax(value = "180", message = "endLng out of range")
    private BigDecimal endLng;

    @NotNull(message = "endLat cannot be null")
    @DecimalMin(value = "-90", message = "endLat out of range")
    @DecimalMax(value = "90", message = "endLat out of range")
    private BigDecimal endLat;

    private String viaJson;
    private Long distance;
    private Long duration;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getStartName() {
        return startName;
    }

    public void setStartName(String startName) {
        this.startName = startName;
    }

    public BigDecimal getStartLng() {
        return startLng;
    }

    public void setStartLng(BigDecimal startLng) {
        this.startLng = startLng;
    }

    public BigDecimal getStartLat() {
        return startLat;
    }

    public void setStartLat(BigDecimal startLat) {
        this.startLat = startLat;
    }

    public String getEndName() {
        return endName;
    }

    public void setEndName(String endName) {
        this.endName = endName;
    }

    public BigDecimal getEndLng() {
        return endLng;
    }

    public void setEndLng(BigDecimal endLng) {
        this.endLng = endLng;
    }

    public BigDecimal getEndLat() {
        return endLat;
    }

    public void setEndLat(BigDecimal endLat) {
        this.endLat = endLat;
    }

    public String getViaJson() {
        return viaJson;
    }

    public void setViaJson(String viaJson) {
        this.viaJson = viaJson;
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
}

