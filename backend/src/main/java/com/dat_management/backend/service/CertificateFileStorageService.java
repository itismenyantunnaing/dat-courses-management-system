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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CertificateFileStorageService {

    @Value("${file.upload-dir:/data/uploads/certificates}")
    private String uploadDir;
    
    private Path uploadPath;

    @PostConstruct
    public void init() {
        // Use configured uploadDir (overridden by profiles)
        this.uploadPath = Paths.get(uploadDir).normalize().toAbsolutePath();

        System.out.println("=========================================");
        System.out.println("📁 Current working directory: " + System.getProperty("user.dir"));
        System.out.println("📁 Configured upload directory: " + uploadDir);
        System.out.println("📁 Resolved upload path: " + uploadPath);

        try {
            if (!Files.exists(uploadPath)) {
                System.out.println("📁 Directory does not exist, creating...");
                Files.createDirectories(uploadPath);
                System.out.println("✅ Created directory: " + uploadPath);
            } else {
                System.out.println("✅ Directory exists: " + uploadPath);
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to create directory: " + e.getMessage());
            throw new RuntimeException("Cannot create upload directory: " + e.getMessage(), e);
        }
    }

    public String storeFile(MultipartFile file, String employeeId, String certificateType, String japaneseLevel)
            throws IOException {

        System.out.println("=========================================");
        System.out.println("📁 Upload directory: " + uploadPath);

        // ✅ Check if file is null or empty
        if (file == null || file.isEmpty()) {
            throw new IOException("File is null or empty");
        }

        System.out.println("📎 File name: " + file.getOriginalFilename());
        System.out.println("📎 File size: " + file.getSize());

        // Get file extension
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
        }

        // Validate file
        if (!isAllowedImageFile(file)) {
            throw new RuntimeException("Only JPG and PNG image files are allowed. Provided: " + extension);
        }

        // Generate filename with timestamp to ensure uniqueness
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String fileName = String.format("%s_%s_%s_%s%s",
                employeeId,
                certificateType.toUpperCase(),
                japaneseLevel.toUpperCase(),
                timestamp,
                extension);

        // Handle duplicates (if same timestamp, add counter)
        Path filePath = uploadPath.resolve(fileName);
        int counter = 1;
        while (Files.exists(filePath)) {
            fileName = String.format("%s_%s_%s_%s_%d%s",
                    employeeId,
                    certificateType.toUpperCase(),
                    japaneseLevel.toUpperCase(),
                    timestamp,
                    counter++,
                    extension);
            filePath = uploadPath.resolve(fileName);
        }

        // ✅ Save file with better error handling
        try {
            System.out.println("💾 Saving file to: " + filePath.toAbsolutePath());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("✅ File saved successfully!");

            // ✅ Verify file exists after saving
            if (Files.exists(filePath)) {
                System.out.println("✅ Verified: File exists at: " + filePath.toAbsolutePath());
            } else {
                System.err.println("❌ Warning: File not found after save!");
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to save file: " + e.getMessage());
            throw new IOException("Failed to save file: " + e.getMessage(), e);
        }

        // Return the relative path for the database
        return "/uploads/certificates/" + fileName;
    }

    public void deleteFile(String filePath) throws IOException {
        if (filePath != null && !filePath.isEmpty()) {
            String filename = Paths.get(filePath).getFileName().toString();
            Path path = uploadPath.resolve(filename);
            if (Files.exists(path)) {
                Files.delete(path);
                System.out.println("🗑️ Deleted file: " + path);
            }
        }
    }

    public byte[] getFile(String filePath) throws IOException {
        // Extract just the filename from the path
        String filename = Paths.get(filePath).getFileName().toString();
        Path path = uploadPath.resolve(filename);
        if (!Files.exists(path)) {
            throw new RuntimeException("File not found: " + filePath + " at path: " + path);
        }
        return Files.readAllBytes(path);
    }

    public boolean isAllowedImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType != null) {
            String contentTypeLower = contentType.toLowerCase();
            // Only allow image content types
            if (contentTypeLower.equals("image/jpeg") ||
                    contentTypeLower.equals("image/jpg") ||
                    contentTypeLower.equals("image/png")) {
                return true;
            }
        }

        // Additional check: verify file extension
        String fileName = file.getOriginalFilename();
        if (fileName != null) {
            String extension = fileName.toLowerCase();
            if (extension.endsWith(".jpg") ||
                    extension.endsWith(".jpeg") ||
                    extension.endsWith(".png")) {
                return true;
            }
        }

        return false;
    }

    public boolean isValidFileSize(MultipartFile file, long maxSize) {
        if (file == null) {
            return false;
        }
        return file.getSize() <= maxSize;
    }

    public long getFileSize(MultipartFile file) {
        if (file == null) {
            return 0;
        }
        return file.getSize();
    }

    public String getFileExtension(MultipartFile file) {
        if (file == null || file.getOriginalFilename() == null) {
            return "";
        }
        String fileName = file.getOriginalFilename();
        int lastDotIndex = fileName.lastIndexOf(".");
        if (lastDotIndex > 0) {
            return fileName.substring(lastDotIndex).toLowerCase();
        }
        return "";
    }
}