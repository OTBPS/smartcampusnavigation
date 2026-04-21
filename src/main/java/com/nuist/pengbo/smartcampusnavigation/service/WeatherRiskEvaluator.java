package com.nuist.pengbo.smartcampusnavigation.service;

public interface WeatherRiskEvaluator {

    WeatherRiskResult evaluate(String weatherText, String windScale, String temp);

    class WeatherRiskResult {
        private String riskLevel;
        private String riskType;
        private String triggerFamily;

        public String getRiskLevel() {
            return riskLevel;
        }

        public void setRiskLevel(String riskLevel) {
            this.riskLevel = riskLevel;
        }

        public String getRiskType() {
            return riskType;
        }

        public void setRiskType(String riskType) {
            this.riskType = riskType;
        }

        public String getTriggerFamily() {
            return triggerFamily;
        }

        public void setTriggerFamily(String triggerFamily) {
            this.triggerFamily = triggerFamily;
        }
    }
}
