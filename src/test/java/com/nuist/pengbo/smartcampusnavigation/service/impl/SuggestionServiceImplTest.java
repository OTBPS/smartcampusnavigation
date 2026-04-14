package com.nuist.pengbo.smartcampusnavigation.service.impl;

import com.nuist.pengbo.smartcampusnavigation.common.BusinessException;
import com.nuist.pengbo.smartcampusnavigation.common.ResultCode;
import com.nuist.pengbo.smartcampusnavigation.dto.suggestion.SuggestionContextQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.service.PoiService;
import com.nuist.pengbo.smartcampusnavigation.service.WeatherService;
import com.nuist.pengbo.smartcampusnavigation.vo.poi.PoiVO;
import com.nuist.pengbo.smartcampusnavigation.vo.suggestion.SuggestionContextVO;
import com.nuist.pengbo.smartcampusnavigation.vo.weather.WeatherCurrentVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SuggestionServiceImplTest {

    @Mock
    private WeatherService weatherService;

    @Mock
    private PoiService poiService;

    @InjectMocks
    private SuggestionServiceImpl suggestionService;

    @Test
    void shouldGenerateRouteSuggestionsWithinLimit() {
        when(weatherService.getCurrentWeather()).thenReturn(buildWeather("Rain", "29", "4"));

        SuggestionContextQueryDTO queryDTO = new SuggestionContextQueryDTO();
        queryDTO.setSceneType("route_planning");
        queryDTO.setRouteDistance(2200L);
        queryDTO.setRouteDuration(1600L);

        SuggestionContextVO result = suggestionService.generateContextSuggestion(queryDTO);

        assertNotNull(result);
        assertNotNull(result.getTitle());
        assertNotNull(result.getGeneratedAt());
        assertFalse(result.getSuggestions().isEmpty());
        assertTrue(result.getSuggestions().size() <= 3);
    }

    @Test
    void shouldGeneratePoiSuggestionWhenWeatherUnavailable() {
        when(weatherService.getCurrentWeather())
                .thenThrow(new BusinessException(ResultCode.INTERNAL_ERROR, "mock unavailable"));
        PoiVO poi = new PoiVO();
        poi.setType("canteen");
        when(poiService.getById(1L)).thenReturn(poi);

        SuggestionContextQueryDTO queryDTO = new SuggestionContextQueryDTO();
        queryDTO.setSceneType("poi_detail");
        queryDTO.setPoiId(1L);
        queryDTO.setHour(12);

        SuggestionContextVO result = suggestionService.generateContextSuggestion(queryDTO);

        assertNotNull(result);
        assertNotNull(result.getTitle());
        assertNotNull(result.getSuggestions());
        assertFalse(result.getSuggestions().isEmpty());
        assertTrue(result.getSuggestions().size() <= 3);
    }

    private WeatherCurrentVO buildWeather(String weatherText, String temp, String windScale) {
        WeatherCurrentVO weatherCurrentVO = new WeatherCurrentVO();
        weatherCurrentVO.setWeatherText(weatherText);
        weatherCurrentVO.setText(weatherText);
        weatherCurrentVO.setTemp(temp);
        weatherCurrentVO.setWindScale(windScale);
        return weatherCurrentVO;
    }
}