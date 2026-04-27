package com.nuist.pengbo.smartcampusnavigation.vo.assistant;

import java.util.ArrayList;
import java.util.List;

public class AssistantChatVO {
    private String answer;
    private boolean fallback;
    private String model;
    private String warning;
    private String contextSummary;
    private List<AssistantEvidenceVO> evidence = new ArrayList<>();

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public boolean isFallback() {
        return fallback;
    }

    public void setFallback(boolean fallback) {
        this.fallback = fallback;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getWarning() {
        return warning;
    }

    public void setWarning(String warning) {
        this.warning = warning;
    }

    public String getContextSummary() {
        return contextSummary;
    }

    public void setContextSummary(String contextSummary) {
        this.contextSummary = contextSummary;
    }

    public List<AssistantEvidenceVO> getEvidence() {
        return evidence;
    }

    public void setEvidence(List<AssistantEvidenceVO> evidence) {
        this.evidence = evidence;
    }
}
