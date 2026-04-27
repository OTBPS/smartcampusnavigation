package com.nuist.pengbo.smartcampusnavigation.dto.assistant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class AssistantChatRequest {
    @NotBlank(message = "question cannot be blank")
    @Size(max = 500, message = "question is too long")
    private String question;
    private AssistantPoiContext selectedPoi;
    private AssistantRouteContext routeContext;

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public AssistantPoiContext getSelectedPoi() {
        return selectedPoi;
    }

    public void setSelectedPoi(AssistantPoiContext selectedPoi) {
        this.selectedPoi = selectedPoi;
    }

    public AssistantRouteContext getRouteContext() {
        return routeContext;
    }

    public void setRouteContext(AssistantRouteContext routeContext) {
        this.routeContext = routeContext;
    }

    public static class AssistantPoiContext {
        private Long id;
        private String name;
        private String type;
        private BigDecimal longitude;
        private BigDecimal latitude;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public BigDecimal getLongitude() {
            return longitude;
        }

        public void setLongitude(BigDecimal longitude) {
            this.longitude = longitude;
        }

        public BigDecimal getLatitude() {
            return latitude;
        }

        public void setLatitude(BigDecimal latitude) {
            this.latitude = latitude;
        }
    }

    public static class AssistantRouteContext {
        private String mode;
        private AssistantPoiContext start;
        private AssistantPoiContext destination;
        private List<AssistantPoiContext> waypoints = new ArrayList<>();
        private Long distance;
        private Long duration;

        public String getMode() {
            return mode;
        }

        public void setMode(String mode) {
            this.mode = mode;
        }

        public AssistantPoiContext getStart() {
            return start;
        }

        public void setStart(AssistantPoiContext start) {
            this.start = start;
        }

        public AssistantPoiContext getDestination() {
            return destination;
        }

        public void setDestination(AssistantPoiContext destination) {
            this.destination = destination;
        }

        public List<AssistantPoiContext> getWaypoints() {
            return waypoints;
        }

        public void setWaypoints(List<AssistantPoiContext> waypoints) {
            this.waypoints = waypoints;
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
}
