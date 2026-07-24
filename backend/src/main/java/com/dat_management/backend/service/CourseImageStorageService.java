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
    // Find the project root (dat-courses-management-system)
    Path currentDir = Paths.get(System.getProperty("user.dir"));
    Path projectRoot = null;

    // Traverse up to find the directory that contains both backend and frontend
    while (currentDir != null) {
      if (Files.exists(currentDir.resolve("backend")) && Files.exists(currentDir.resolve("frontend"))) {
        projectRoot = currentDir;
        break;
      }
      currentDir = currentDir.getParent();
    }

    // If not found, default to relative path
    if (projectRoot == null) {
      // Fallback: try to use parent of upload directory (certificates path)
      Path certificatesPath = Paths.get(uploadDir);
      Path uploadsPath = certificatesPath.getParent();
      Path publicPath = uploadsPath.getParent();
      return publicPath.resolve("courses").toString();
    }

    // Build the path to frontend/public/courses from the project root
    return projectRoot.resolve("frontend").resolve("public").resolve("courses").toString();
  }

  public String storeImage(MultipartFile file, Integer courseId) throws IOException {
    System.out.println("=========================================");
    System.out.println("📁 Course image upload started for course id: " + courseId);
    System.out.println("📁 Current working directory: " + System.getProperty("user.dir"));
    System.out.println("📁 Base upload dir configured: " + uploadDir);

    Path uploadPath = Paths.get(getCourseUploadDir());
    System.out.println("📁 Resolved course upload path: " + uploadPath.toAbsolutePath());

    try {
      if (!Files.exists(uploadPath)) {
        System.out.println("📁 Directory does not exist, attempting to create...");
        Files.createDirectories(uploadPath);
        System.out.println("✅ Created course upload directory");
      } else {
        System.out.println("✅ Directory exists: " + uploadPath.toAbsolutePath());
      }
    } catch (Exception e) {
      System.err.println("❌ Failed to create directory: " + e.getMessage());
      throw new IOException("Cannot create course upload directory: " + e.getMessage(), e);
    }

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
      System.out.println("✅ Course image saved successfully!");

      // Verify file exists
      if (Files.exists(filePath)) {
        System.out.println("✅ Verified: File exists at: " + filePath.toAbsolutePath());
      } else {
        System.err.println("❌ Warning: File not found after save!");
      }
    } catch (Exception e) {
      System.err.println("❌ Failed to save course image: " + e.getMessage());
      throw new IOException("Failed to save course image: " + e.getMessage(), e);
    }

    return "courses/" + fileName;
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