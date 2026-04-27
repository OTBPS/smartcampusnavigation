package com.nuist.pengbo.smartcampusnavigation.controller.assistant;

import com.nuist.pengbo.smartcampusnavigation.common.ApiResponse;
import com.nuist.pengbo.smartcampusnavigation.dto.assistant.AssistantChatRequest;
import com.nuist.pengbo.smartcampusnavigation.service.AssistantService;
import com.nuist.pengbo.smartcampusnavigation.vo.assistant.AssistantChatVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {
    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/chat")
    public ApiResponse<AssistantChatVO> chat(@Valid @RequestBody AssistantChatRequest request) {
        return ApiResponse.success(assistantService.chat(request));
    }
}
