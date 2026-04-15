package com.nuist.pengbo.smartcampusnavigation.dto.history;

import jakarta.validation.constraints.NotBlank;

public class RouteHistoryUpdateRequest {
    @NotBlank(message = "title cannot be blank")
    private String title;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}

