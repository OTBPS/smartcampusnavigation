package com.nuist.pengbo.smartcampusnavigation.controller.weather;

import com.nuist.pengbo.smartcampusnavigation.common.ApiResponse;
import com.nuist.pengbo.smartcampusnavigation.service.WeatherService;
import com.nuist.pengbo.smartcampusnavigation.vo.weather.WeatherCurrentVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/weather")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/current")
    public ApiResponse<WeatherCurrentVO> getCurrentWeather() {
        return ApiResponse.success(weatherService.getCurrentWeather());
    }
}
