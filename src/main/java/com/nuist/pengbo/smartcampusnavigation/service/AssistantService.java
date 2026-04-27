package com.nuist.pengbo.smartcampusnavigation.service;

import com.nuist.pengbo.smartcampusnavigation.dto.assistant.AssistantChatRequest;
import com.nuist.pengbo.smartcampusnavigation.vo.assistant.AssistantChatVO;

public interface AssistantService {
    AssistantChatVO chat(AssistantChatRequest request);
}
