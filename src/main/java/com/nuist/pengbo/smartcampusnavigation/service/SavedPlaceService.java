package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.dto.saved.SavedPlaceCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.saved.SavedPlaceImportItem;
import com.nuist.pengbo.smartcampusnavigation.vo.saved.SavedPlaceVO;

import java.util.List;
import java.util.Map;

public interface SavedPlaceService {
    List<SavedPlaceVO> list();

    int countAll();

    SavedPlaceVO save(SavedPlaceCreateRequest request);

    SavedPlaceVO rename(Long id, String name);

    void delete(Long id);

    Map<String, Integer> importFromLocal(List<SavedPlaceImportItem> items);
}
