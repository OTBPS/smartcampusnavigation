package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.entity.Poi;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;

public interface PoiLocalizationService {
    PoiVO localize(PoiVO poiVO);

    boolean matchesKeyword(Poi poi, String keyword);
}
