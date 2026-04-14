package com.nuist.pengbo.smartcampusnavigation.vo.suggestion;

import java.time.LocalDateTime;
import java.util.List;

public class SuggestionContextVO {
    private String title;
    private List<String> suggestions;
    private LocalDateTime generatedAt;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
