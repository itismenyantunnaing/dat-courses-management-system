package com.dat_management.backend.service;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

class CertificateFileStorageServiceTest {

    @TempDir
    private Path tempDir;

    private CertificateFileStorageService service;

    @BeforeEach
    void setUp() {
        service = new CertificateFileStorageService();
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        service.init();
    }

    @Test
    void storeFile_validPng_savesFileAndReturnsPublicPath() throws IOException {
        MockMultipartFile file = pngFile("certificate.png", new byte[] {1, 2, 3});

        String result = service.storeFile(file, "EMP001", "jlpt", "n2");

        Assertions.assertTrue(
                result.matches("/uploads/certificates/EMP001_JLPT_N2_\\d{14}\\.png"));

        String fileName = Path.of(result).getFileName().toString();

        Assertions.assertTrue(Files.exists(tempDir.resolve(fileName)));
        Assertions.assertArrayEquals(
                new byte[] {1, 2, 3},
                Files.readAllBytes(tempDir.resolve(fileName)));
    }

    @Test
    void storeFile_duplicateName_addsCounterSuffix() throws IOException {
        MockMultipartFile first = pngFile("certificate.png", new byte[] {1});
        MockMultipartFile second = pngFile("certificate.png", new byte[] {2});

        String firstPath = service.storeFile(first, "EMP001", "JLPT", "N2");
        String secondPath = service.storeFile(second, "EMP001", "JLPT", "N2");

        Assertions.assertTrue(
                firstPath.matches("/uploads/certificates/EMP001_JLPT_N2_\\d{14}\\.png"));

        Assertions.assertTrue(
                secondPath.matches("/uploads/certificates/EMP001_JLPT_N2_\\d{14}_1\\.png"));

        String firstFileName = Path.of(firstPath).getFileName().toString();
        String secondFileName = Path.of(secondPath).getFileName().toString();

        Assertions.assertTrue(Files.exists(tempDir.resolve(firstFileName)));
        Assertions.assertTrue(Files.exists(tempDir.resolve(secondFileName)));
    }

    @Test
    void storeFile_pdfFile_throwsRuntimeException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "certificate.pdf",
                "application/pdf",
                new byte[] {1});

        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.storeFile(file, "EMP001", "JLPT", "N2"));

        Assertions.assertTrue(ex.getMessage().contains("Only JPG and PNG"));
    }

    @Test
    void deleteFile_existingFile_removesIt() throws IOException {
        Path storedFile = tempDir.resolve("to-delete.png");
        Files.write(storedFile, new byte[] {1});

        service.deleteFile("uploads/certificates/to-delete.png");

        Assertions.assertFalse(Files.exists(storedFile));
    }

    @Test
    void getFile_existingFile_returnsBytes() throws IOException {
        Files.write(tempDir.resolve("certificate.png"), new byte[] {4, 5, 6});

        byte[] result = service.getFile("uploads/certificates/certificate.png");

        Assertions.assertArrayEquals(new byte[] {4, 5, 6}, result);
    }

    @Test
    void getFile_missingFile_throwsRuntimeException() {
        RuntimeException ex = Assertions.assertThrows(
                RuntimeException.class,
                () -> service.getFile("uploads/certificates/missing.png"));

        Assertions.assertTrue(ex.getMessage().contains("File not found"));
    }

    @Test
    void fileValidation_acceptsImageTypesAndRejectsPdf() {
        MockMultipartFile png = pngFile("certificate.png", new byte[] {1});
        MockMultipartFile jpgByExtension = new MockMultipartFile(
                "file",
                "certificate.jpg",
                "application/octet-stream",
                new byte[] {1});
        MockMultipartFile pdf = new MockMultipartFile(
                "file",
                "certificate.pdf",
                "application/pdf",
                new byte[] {1});

        Assertions.assertTrue(service.isAllowedImageFile(png));
        Assertions.assertTrue(service.isAllowedImageFile(jpgByExtension));
        Assertions.assertFalse(service.isAllowedImageFile(pdf));
        Assertions.assertEquals(".pdf", service.getFileExtension(pdf));
        Assertions.assertTrue(service.isValidFileSize(png, 10));
        Assertions.assertFalse(service.isValidFileSize(png, 0));
    }

    private static MockMultipartFile pngFile(String originalFilename, byte[] content) {
        return new MockMultipartFile("file", originalFilename, "image/png", content);
    }
}
