package com.nuist.pengbo.smartcampusnavigation.controller.poi;

import com.nuist.pengbo.smartcampusnavigation.common.ApiResponse;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiUpdateRequest;
import com.nuist.pengbo.smartcampusnavigation.service.PoiService;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pois")
public class PoiController {

    private final PoiService poiService;

    public PoiController(PoiService poiService) {
        this.poiService = poiService;
    }

    @GetMapping
    public ApiResponse<List<PoiVO>> list(PoiQueryRequest queryRequest) {
        return ApiResponse.success(poiService.list(queryRequest));
    }

    @GetMapping("/types")
    public ApiResponse<List<String>> listTypes() {
        return ApiResponse.success(poiService.listTypes());
    }

    @GetMapping("/{id}")
    public ApiResponse<PoiVO> getById(@PathVariable Long id) {
        return ApiResponse.success(poiService.getById(id));
    }

    @PostMapping
    public ApiResponse<PoiVO> create(@Valid @RequestBody PoiCreateRequest request) {
        return ApiResponse.success("POI created", poiService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<PoiVO> update(@PathVariable Long id, @Valid @RequestBody PoiUpdateRequest request) {
        return ApiResponse.success("POI updated", poiService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        poiService.delete(id);
        return ApiResponse.success("POI deleted", null);
    }
}
