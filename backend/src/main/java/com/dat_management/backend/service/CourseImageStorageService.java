package com.dat_management.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class CourseImageStorageService {

    // Course images - stored in imageStorage/courses
    @Value("${file.course-upload-dir:./imageStorage/courses}")
    private String uploadDir;
    
    private Path uploadPath;  // ← This was missing!

    @PostConstruct  // ← This was missing!
    public void init() {
        this.uploadPath = Paths.get(uploadDir).normalize().toAbsolutePath();

        System.out.println("=========================================");
        System.out.println("📁 Course image storage initialized");
        System.out.println("📁 Current working directory: " + System.getProperty("user.dir"));
        System.out.println("📁 Configured upload directory: " + uploadDir);
        System.out.println("📁 Resolved upload path: " + uploadPath);

        try {
            if (!Files.exists(uploadPath)) {
                System.out.println("📁 Directory does not exist, creating...");
                Files.createDirectories(uploadPath);
                System.out.println(" Created course upload directory: " + uploadPath);
            } else {
                System.out.println(" Directory exists: " + uploadPath);
            }
        } catch (Exception e) {
            System.err.println(" Failed to create directory: " + e.getMessage());
            throw new RuntimeException("Cannot create upload directory: " + e.getMessage(), e);
        }
    }

    public String storeImage(MultipartFile file, Integer courseId) throws IOException {
        System.out.println("=========================================");
        System.out.println("📁 Course image upload started for course id: " + courseId);
        System.out.println("📁 Upload directory: " + uploadPath);

        if (file == null || file.isEmpty()) {
            throw new IOException("File is null or empty");
        }

        if (!isAllowedImageFile(file)) {
            throw new RuntimeException("Only JPG and PNG image files are allowed");
        }

        System.out.println("📎 File name: " + file.getOriginalFilename());
        System.out.println("📎 File size: " + file.getSize());

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
        }

        String fileName = "course_" + courseId + extension;
        Path filePath = uploadPath.resolve(fileName);

        try {
            System.out.println("💾 Saving course image to: " + filePath.toAbsolutePath());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println(" Course image saved successfully!");

            // Verify file exists
            if (Files.exists(filePath)) {
                System.out.println(" Verified: File exists at: " + filePath.toAbsolutePath());
            } else {
                System.err.println(" Warning: File not found after save!");
            }
        } catch (Exception e) {
            System.err.println(" Failed to save course image: " + e.getMessage());
            throw new IOException("Failed to save course image: " + e.getMessage(), e);
        }

        // Return the relative path for the database
        return "/uploads/courses/" + fileName;
    }

    public void deleteImage(String imagePath) throws IOException {
        if (imagePath != null && !imagePath.isEmpty()) {
            String filename = Paths.get(imagePath).getFileName().toString();
            Path path = uploadPath.resolve(filename);
            if (Files.exists(path)) {
                Files.delete(path);
                System.out.println(" Course image deleted: " + filename);
            }
        }
    }

    public boolean isAllowedImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return false;

        String contentType = file.getContentType();
        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (ct.equals("image/jpeg") || ct.equals("image/jpg") || ct.equals("image/png")) {
                return true;
            }
        }

        String fileName = file.getOriginalFilename();
        if (fileName != null) {
            String fn = fileName.toLowerCase();
            if (fn.endsWith(".jpg") || fn.endsWith(".jpeg") || fn.endsWith(".png")) {
                return true;
            }
        }

        return false;
    }
}