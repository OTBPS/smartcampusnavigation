package com.nuist.pengbo.smartcampusnavigation.dto.saved;

import jakarta.validation.Valid;

import java.util.List;

public class SavedPlaceImportRequest {
    @Valid
    private List<SavedPlaceImportItem> items;

    public List<SavedPlaceImportItem> getItems() {
        return items;
    }

    public void setItems(List<SavedPlaceImportItem> items) {
        this.items = items;
    }
}
