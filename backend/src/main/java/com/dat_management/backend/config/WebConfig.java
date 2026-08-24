package com.dat_management.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:./imageStorage/certificates}")
    private String certificateUploadDir;

    @Value("${file.profile-upload-dir:./imageStorage/profiles}")
    private String profileUploadDir;

    @Value("${file.course-upload-dir:./imageStorage/courses}")
    private String courseUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String certificateLocation = toResourceLocation(certificateUploadDir);
        String profileLocation = toResourceLocation(profileUploadDir);
        String courseLocation = toResourceLocation(courseUploadDir);

        System.out.println("=========================================");
        System.out.println("📁 WebConfig - Certificate location: " + certificateLocation);
        System.out.println("📁 WebConfig - Profile location: " + profileLocation);
        System.out.println("📁 WebConfig - Course location: " + courseLocation);

        // Serve certificates: /uploads/certificates/** -> ./imageStorage/certificates/
        registry.addResourceHandler("/uploads/certificates/**")
                .addResourceLocations(certificateLocation);

        // Serve profiles: /uploads/profiles/** -> ./imageStorage/profiles/
        registry.addResourceHandler("/uploads/profiles/**")
                .addResourceLocations(profileLocation);

        // Serve courses: /uploads/courses/** -> ./imageStorage/courses/
        registry.addResourceHandler("/uploads/courses/**")
                .addResourceLocations(courseLocation);

        // Backward compatibility for /profiles/**
        registry.addResourceHandler("/profiles/**")
                .addResourceLocations(profileLocation);

        // Backward compatibility for /courses/**
        registry.addResourceHandler("/courses/**")
                .addResourceLocations(courseLocation);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
        
        registry.addMapping("/uploads/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    private String toResourceLocation(String configuredDir) {
        Path resolved = Paths.get(configuredDir).toAbsolutePath().normalize();
        return "file:" + resolved + "/";
    }
}