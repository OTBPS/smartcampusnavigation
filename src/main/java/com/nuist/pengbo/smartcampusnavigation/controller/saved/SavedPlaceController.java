package com.nuist.pengbo.smartcampusnavigation.controller.saved;

import com.nuist.pengbo.smartcampusnavigation.common.ApiResponse;
import com.nuist.pengbo.smartcampusnavigation.dto.saved.SavedPlaceCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.saved.SavedPlaceImportRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.saved.SavedPlaceRenameRequest;
import com.nuist.pengbo.smartcampusnavigation.service.SavedPlaceService;
import com.nuist.pengbo.smartcampusnavigation.vo.saved.SavedPlaceVO;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/saved-places")
public class SavedPlaceController {
    private final SavedPlaceService savedPlaceService;

    public SavedPlaceController(SavedPlaceService savedPlaceService) {
        this.savedPlaceService = savedPlaceService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> list() {
        List<SavedPlaceVO> items = savedPlaceService.list();
        int totalCount = savedPlaceService.countAll();
        return ApiResponse.success(Map.of(
                "items", items,
                "totalCount", totalCount
        ));
    }

    @PostMapping
    public ApiResponse<SavedPlaceVO> create(@Valid @RequestBody SavedPlaceCreateRequest request) {
        return ApiResponse.success("Saved place stored", savedPlaceService.save(request));
    }

    @PutMapping("/{id}/name")
    public ApiResponse<SavedPlaceVO> rename(@PathVariable Long id,
                                            @Valid @RequestBody SavedPlaceRenameRequest request) {
        return ApiResponse.success("Saved place renamed", savedPlaceService.rename(id, request.getName()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        savedPlaceService.delete(id);
        return ApiResponse.success("Saved place removed", null);
    }

    @PostMapping("/import")
    public ApiResponse<Map<String, Integer>> importFromLocal(@RequestBody SavedPlaceImportRequest request) {
        List<com.nuist.pengbo.smartcampusnavigation.dto.saved.SavedPlaceImportItem> items =
                request == null ? null : request.getItems();
        Map<String, Integer> result = savedPlaceService.importFromLocal(items);
        return ApiResponse.success("Saved places imported", result);
    }
}
