package com.dat_management.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/courses/**")
                .addResourceLocations("file:/data/uploads/certificates/courses/");

        registry.addResourceHandler("/uploads/certificates/**")
                .addResourceLocations("file:/data/uploads/certificates/");
    }
}

