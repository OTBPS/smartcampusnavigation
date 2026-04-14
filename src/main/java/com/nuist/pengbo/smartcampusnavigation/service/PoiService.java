package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiUpdateRequest;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;

import java.util.List;

public interface PoiService {
    List<PoiVO> list(PoiQueryRequest queryRequest);

    PoiVO getById(Long id);

    PoiVO create(PoiCreateRequest request);

    PoiVO update(Long id, PoiUpdateRequest request);

    void delete(Long id);
}
