package com.dat_management.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Same property keys CertificateFileStorageService / CourseImageStorageService /
    // EmployeeProfileService already read to decide WHERE to save a file. Resolving
    // through those here — instead of hardcoding "/data/uploads/..." — means this
    // handler always points at wherever the file actually landed, in both the
    // "local" profile (writes into frontend/public/uploads/...) and the "prod"
    // profile used by Docker (writes into /data/uploads/...).
    @Value("${file.upload-dir:/data/uploads/certificates}")
    private String certificateUploadDir;

    @Value("${file.profile-upload-dir:/data/uploads/profiles}")
    private String profileUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String certificateLocation = toResourceLocation(certificateUploadDir);
        String profileLocation = toResourceLocation(profileUploadDir);

        registry.addResourceHandler("/courses/**")
                .addResourceLocations(certificateLocation + "courses/");

        registry.addResourceHandler("/uploads/certificates/**")
                .addResourceLocations(certificateLocation);

        registry.addResourceHandler("/profiles/**")
                .addResourceLocations(profileLocation);
    }

    // Resolves a configured dir (relative or absolute) to an absolute "file:" resource
    // location, the same way CertificateFileStorageService/EmployeeProfileService
    // resolve it before writing — so serving and storing always agree.
    private String toResourceLocation(String configuredDir) {
        Path resolved = Paths.get(configuredDir).toAbsolutePath().normalize();
        return "file:" + resolved + "/";
    }
}