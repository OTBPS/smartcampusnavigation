package com.nuist.pengbo.smartcampusnavigation.controller;

import com.nuist.pengbo.smartcampusnavigation.config.AmapProperties;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final AmapProperties amapProperties;

    public HomeController(AmapProperties amapProperties) {
        this.amapProperties = amapProperties;
    }

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("amapJsKey", amapProperties.getJsKey());
        model.addAttribute("amapSecurityJsCode", amapProperties.getSecurityJsCode());
        model.addAttribute("assetVersion", System.currentTimeMillis());
        return "index";
    }
}
