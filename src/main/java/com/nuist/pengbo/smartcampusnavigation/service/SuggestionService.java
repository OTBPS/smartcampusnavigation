package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.dto.suggestion.SuggestionContextQueryDTO;
import com.nuist.pengbo.smartcampusnavigation.vo.suggestion.SuggestionContextVO;

public interface SuggestionService {
    SuggestionContextVO generateContextSuggestion(SuggestionContextQueryDTO queryDTO);
}
