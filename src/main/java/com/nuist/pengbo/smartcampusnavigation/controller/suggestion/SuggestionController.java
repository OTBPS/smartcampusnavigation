package com.nuist.pengbo.smartcampusnavigation.controller.suggestion;

import com.nuist.pengbo.smartcampusnavigation.common.ApiResponse;
import com.nuist.pengbo.smartcampusnavigation.dto.suggestion.SuggestionContextQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.service.SuggestionService;
import com.nuist.pengbo.smartcampusnavigation.vo.suggestion.SuggestionContextVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/suggestions")
public class SuggestionController {

    private final SuggestionService suggestionService;

    public SuggestionController(SuggestionService suggestionService) {
        this.suggestionService = suggestionService;
    }

    @GetMapping("/context")
    public ApiResponse<SuggestionContextVO> getContextSuggestion(SuggestionContextQueryDTO queryDTO) {
        return ApiResponse.success(suggestionService.generateContextSuggestion(queryDTO));
    }
}
