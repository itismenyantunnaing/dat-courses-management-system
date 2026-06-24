// Create this new file
// backend/src/main/java/com/dat_management/backend/config/FileStorageConfig.java

package com.dat_management.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {

    @Value("${file.upload-dir:../uploads/certificates}")
    private String uploadDir;

    public String getUploadDir() {
        return uploadDir;
    }

    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("📁 Created upload directory: " + uploadPath.toAbsolutePath());
            }
            System.out.println("📁 Upload directory configured: " + uploadPath.toAbsolutePath());
        } catch (IOException e) {
            System.err.println("❌ Could not create upload directory: " + e.getMessage());
        }
    }
}