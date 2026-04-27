package com.nuist.pengbo.smartcampusnavigation.dto.saved;

import jakarta.validation.constraints.NotBlank;

public class SavedPlaceRenameRequest {
    @NotBlank(message = "name cannot be blank")
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
