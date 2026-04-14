package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiCreateRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiUpdateRequest;
import com.nuist.pengbo.smartcampusnavigation.entity.Poi;
import com.nuist.pengbo.smartcampusnavigation.mapper.PoiMapper;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PoiServiceImplTest {

    @Mock
    private PoiMapper poiMapper;

    @InjectMocks
    private PoiServiceImpl poiService;

    @Test
    void createShouldDefaultEnabledToTrueWhenRequestEnabledIsNull() {
        PoiCreateRequest request = new PoiCreateRequest();
        request.setName("Main Library");
        request.setType("library");
        request.setLongitude(new BigDecimal("118.7935120"));
        request.setLatitude(new BigDecimal("32.0602550"));
        request.setDescription("desc");
        request.setOpeningHours("08:00-22:00");
        request.setEnabled(null);

        when(poiMapper.insert(any(Poi.class))).thenAnswer(invocation -> {
            Poi poi = invocation.getArgument(0);
            poi.setId(1L);
            return 1;
        });

        Poi storedPoi = new Poi();
        storedPoi.setId(1L);
        storedPoi.setName("Main Library");
        storedPoi.setType("library");
        storedPoi.setLongitude(new BigDecimal("118.7935120"));
        storedPoi.setLatitude(new BigDecimal("32.0602550"));
        storedPoi.setDescription("desc");
        storedPoi.setOpeningHours("08:00-22:00");
        storedPoi.setEnabled(true);
        when(poiMapper.selectById(1L)).thenReturn(storedPoi);

        PoiVO result = poiService.create(request);

        ArgumentCaptor<Poi> poiCaptor = ArgumentCaptor.forClass(Poi.class);
        verify(poiMapper).insert(poiCaptor.capture());
        Assertions.assertTrue(poiCaptor.getValue().getEnabled());
        Assertions.assertTrue(result.getEnabled());
    }

    @Test
    void deleteShouldThrowNotFoundWhenNoRowsAreDeleted() {
        when(poiMapper.deleteById(99L)).thenReturn(0);

        Assertions.assertThrows(BusinessException.class, () -> poiService.delete(99L));
    }

    @Test
    void getByIdShouldThrowNotFoundWhenRecordDoesNotExist() {
        when(poiMapper.selectById(88L)).thenReturn(null);

        Assertions.assertThrows(BusinessException.class, () -> poiService.getById(88L));
    }

    @Test
    void updateShouldThrowNotFoundWhenUpdateAffectsZeroRows() {
        Poi existing = new Poi();
        existing.setId(1L);
        existing.setEnabled(true);
        when(poiMapper.selectById(1L)).thenReturn(existing);
        when(poiMapper.updateById(any(Poi.class))).thenReturn(0);

        PoiUpdateRequest request = new PoiUpdateRequest();
        request.setName("Updated Name");
        request.setType("library");
        request.setLongitude(new BigDecimal("118.7935000"));
        request.setLatitude(new BigDecimal("32.0602000"));
        request.setDescription("updated");
        request.setOpeningHours("08:00-22:00");
        request.setEnabled(true);

        Assertions.assertThrows(BusinessException.class, () -> poiService.update(1L, request));
    }

    @Test
    void listShouldTrimBlankQueryFields() {
        PoiQueryRequest request = new PoiQueryRequest();
        request.setName("  library  ");
        request.setType("  ");
        request.setEnabled(true);

        when(poiMapper.selectByCondition(any(PoiQueryRequest.class))).thenReturn(List.of());

        poiService.list(request);

        ArgumentCaptor<PoiQueryRequest> queryCaptor = ArgumentCaptor.forClass(PoiQueryRequest.class);
        verify(poiMapper).selectByCondition(queryCaptor.capture());
        Assertions.assertEquals("library", queryCaptor.getValue().getName());
        Assertions.assertNull(queryCaptor.getValue().getType());
        Assertions.assertTrue(queryCaptor.getValue().getEnabled());
    }
}
