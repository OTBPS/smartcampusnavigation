package com.nuist.pengbo.smartcampusnavigation.dto.route;

import java.math.BigDecimal;
import java.util.List;

public class WalkingRouteQueryDTO {
    private BigDecimal originLng;
    private BigDecimal originLat;
    private List<BigDecimal> viaLngList;
    private List<BigDecimal> viaLatList;
    private BigDecimal destinationLng;
    private BigDecimal destinationLat;

    public BigDecimal getOriginLng() {
        return originLng;
    }

    public void setOriginLng(BigDecimal originLng) {
        this.originLng = originLng;
    }

    public BigDecimal getOriginLat() {
        return originLat;
    }

    public void setOriginLat(BigDecimal originLat) {
        this.originLat = originLat;
    }

    public List<BigDecimal> getViaLngList() {
        return viaLngList;
    }

    public void setViaLngList(List<BigDecimal> viaLngList) {
        this.viaLngList = viaLngList;
    }

    public List<BigDecimal> getViaLatList() {
        return viaLatList;
    }

    public void setViaLatList(List<BigDecimal> viaLatList) {
        this.viaLatList = viaLatList;
    }

    public BigDecimal getDestinationLng() {
        return destinationLng;
    }

    public void setDestinationLng(BigDecimal destinationLng) {
        this.destinationLng = destinationLng;
    }

    public BigDecimal getDestinationLat() {
        return destinationLat;
    }

    public void setDestinationLat(BigDecimal destinationLat) {
        this.destinationLat = destinationLat;
    }
}