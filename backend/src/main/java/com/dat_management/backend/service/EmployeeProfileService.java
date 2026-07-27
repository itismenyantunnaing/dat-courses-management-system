package com.dat_management.backend.service;

import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmployeeProfileService {

    private final EmployeeRepository employeeRepository;

    @Value("${file.upload-dir:../uploads/profiles}")
    private String uploadDir;

    private String getProfileUploadDir() {
        Path currentDir = Paths.get(System.getProperty("user.dir"));
        Path projectRoot = null;

        while (currentDir != null) {
            if (Files.exists(currentDir.resolve("backend")) && Files.exists(currentDir.resolve("frontend"))) {
                projectRoot = currentDir;
                break;
            }
            currentDir = currentDir.getParent();
        }

        if (projectRoot == null) {
            Path profilesPath = Paths.get(uploadDir);
            Path uploadsPath = profilesPath.getParent();
            Path publicPath = uploadsPath.getParent();
            return publicPath.resolve("profiles").toString();
        }

        return projectRoot.resolve("frontend").resolve("public").resolve("profiles").toString();
    }

    @Transactional
    public String storeProfileImage(MultipartFile file, String employeeId) throws IOException {
        System.out.println("=========================================");
        System.out.println("📁 Profile image upload started for employee: " + employeeId);
        System.out.println("📁 Current working directory: " + System.getProperty("user.dir"));
        System.out.println("📁 Base upload dir configured: " + uploadDir);

        Path uploadPath = Paths.get(getProfileUploadDir());
        System.out.println("📁 Resolved profile upload path: " + uploadPath.toAbsolutePath());

        try {
            if (!Files.exists(uploadPath)) {
                System.out.println("📁 Directory does not exist, attempting to create...");
                Files.createDirectories(uploadPath);
                System.out.println("✅ Created profile upload directory");
            } else {
                System.out.println("✅ Directory exists: " + uploadPath.toAbsolutePath());
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to create directory: " + e.getMessage());
            throw new IOException("Cannot create profile upload directory: " + e.getMessage(), e);
        }

        if (file == null || file.isEmpty()) {
            throw new IOException("File is null or empty");
        }

        if (!isAllowedImageFile(file)) {
            throw new RuntimeException("Only JPG, JPEG and PNG image files are allowed");
        }

        System.out.println("📎 File name: " + file.getOriginalFilename());
        System.out.println("📎 File size: " + file.getSize());

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
        }

        // Get employee before making changes
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

        // FIX 1: Delete ALL old profile images for this employee (not just the one in DB)
        deleteAllOldProfileImages(employeeId, uploadPath);

        // FIX 2: Generate UNIQUE filename with timestamp to bust browser cache
        String timestamp = String.valueOf(System.currentTimeMillis());
        String fileName = "employee_" + employeeId + "_" + timestamp + extension;
        Path filePath = uploadPath.resolve(fileName);

        try {
            System.out.println("💾 Saving profile image to: " + filePath.toAbsolutePath());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("✅ Profile image saved successfully!");

            if (Files.exists(filePath)) {
                System.out.println("✅ Verified: File exists at: " + filePath.toAbsolutePath());
            } else {
                System.err.println("❌ Warning: File not found after save!");
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to save profile image: " + e.getMessage());
            throw new IOException("Failed to save profile image: " + e.getMessage(), e);
        }

        // FIX 3: Store the new path with unique filename
        String profilePath = "profiles/" + fileName;
        employee.setProfilePhotoPath(profilePath);
        employee.setUpdatedAt(LocalDateTime.now());
        employeeRepository.save(employee);
        
        System.out.println("✅ Employee updated with new profile path: " + profilePath);
        System.out.println("✅ Updated at: " + employee.getUpdatedAt());

        return profilePath;
    }

    // New method to delete ALL old profile images
    private void deleteAllOldProfileImages(String employeeId, Path uploadPath) {
        try {
            // List all files that match the pattern employee_{employeeId}_*
            Files.list(uploadPath)
                    .filter(path -> path.getFileName().toString().startsWith("employee_" + employeeId + "_") ||
                                   path.getFileName().toString().equals("employee_" + employeeId + ".jpg") ||
                                   path.getFileName().toString().equals("employee_" + employeeId + ".jpeg") ||
                                   path.getFileName().toString().equals("employee_" + employeeId + ".png"))
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            System.out.println("🗑️ Deleted old profile image: " + path.getFileName());
                        } catch (IOException e) {
                            System.err.println("⚠️ Could not delete old profile image: " + e.getMessage());
                        }
                    });
        } catch (IOException e) {
            System.err.println("⚠️ Error cleaning up old profile images: " + e.getMessage());
        }
    }

    public void deleteImage(String imagePath) throws IOException {
        if (imagePath != null && !imagePath.isEmpty()) {
            Path uploadPath = Paths.get(getProfileUploadDir());
            String filename = Paths.get(imagePath).getFileName().toString();
            Path path = uploadPath.resolve(filename);
            if (Files.exists(path)) {
                Files.delete(path);
                System.out.println("✅ Profile image deleted: " + filename);
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