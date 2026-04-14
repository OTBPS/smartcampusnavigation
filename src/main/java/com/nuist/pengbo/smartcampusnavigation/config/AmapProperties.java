package com.nuist.pengbo.smartcampusnavigation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "amap")
public class AmapProperties {
    private String jsKey;
    private String securityJsCode;
    private String webServiceKey;

    public String getJsKey() {
        return jsKey;
    }

    public void setJsKey(String jsKey) {
        this.jsKey = jsKey;
    }

    public String getSecurityJsCode() {
        return securityJsCode;
    }

    public void setSecurityJsCode(String securityJsCode) {
        this.securityJsCode = securityJsCode;
    }

    public String getWebServiceKey() {
        return webServiceKey;
    }

    public void setWebServiceKey(String webServiceKey) {
        this.webServiceKey = webServiceKey;
    }
}
