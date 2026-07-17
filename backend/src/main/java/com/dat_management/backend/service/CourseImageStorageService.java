package com.dat_management.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class CourseImageStorageService {

    @Value("${file.upload-dir:../uploads/certificates}")
    private String uploadDir;

    private String getCourseUploadDir() {
        Path base = Paths.get(uploadDir).getParent();
        if (base == null) base = Paths.get(uploadDir);
        return base.resolve("courses").toString();
    }

    public String storeImage(MultipartFile file, Integer courseId) throws IOException {
        System.out.println("📁 Course image upload started for course id: " + courseId);

        Path uploadPath = Paths.get(getCourseUploadDir());
        System.out.println("📁 Course upload path: " + uploadPath.toAbsolutePath());

        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("✅ Created course upload directory");
            }
        } catch (Exception e) {
            throw new IOException("Cannot create course upload directory: " + e.getMessage(), e);
        }

        if (file == null || file.isEmpty()) {
            throw new IOException("File is null or empty");
        }

        if (!isAllowedImageFile(file)) {
            throw new RuntimeException("Only JPG and PNG image files are allowed");
        }

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
            System.out.println("✅ Course image saved successfully!");
        } catch (Exception e) {
            throw new IOException("Failed to save course image: " + e.getMessage(), e);
        }

        return "uploads/courses/" + fileName;
    }

    public void deleteImage(String imagePath) throws IOException {
        if (imagePath != null && !imagePath.isEmpty()) {
            Path uploadPath = Paths.get(getCourseUploadDir());
            String filename = Paths.get(imagePath).getFileName().toString();
            Path path = uploadPath.resolve(filename);
            if (Files.exists(path)) {
                Files.delete(path);
                System.out.println("✅ Course image deleted: " + filename);
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