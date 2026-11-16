package com.quickcare.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Bucket;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.StorageClient;
import com.quickcare.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CertificateStorageService {

    private static final Logger logger = LoggerFactory.getLogger(CertificateStorageService.class);

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    @Value("${quickcare.firebase.storage-bucket:quickcare-hospital.appspot.com}")
    private String storageBucket;

    // Cache of stored certificates metadata: storagePath -> metadata
    private final Map<String, Map<String, Object>> certificateStore = new ConcurrentHashMap<>();

    // Base directory for local secure file storage
    private final Path localBaseDir = Paths.get("uploads", "doctor-certificates");

    public CertificateStorageService() {
        try {
            Files.createDirectories(localBaseDir);
        } catch (IOException e) {
            logger.warn("Could not create local upload directory: {}", e.getMessage());
        }
    }

    /**
     * Requirement 3: Validates and stores medical qualification certificate.
     */
    public Map<String, Object> storeCertificate(MultipartFile file, String doctorUid) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a qualification certificate file to upload.");
        }

        // Validate File Size (Max 5 MB)
        if (file.getSize() > MAX_FILE_SIZE) {
            double sizeInMb = file.getSize() / (1024.0 * 1024.0);
            throw new BadRequestException(String.format("File size exceeds 5 MB limit. Selected file size: %.2f MB", sizeInMb));
        }

        // Validate Extension
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "qualification_certificate.pdf";
        String ext = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("Unsupported file format. Only PDF (.pdf), JPG (.jpg, .jpeg), and PNG (.png) documents are allowed.");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || (!ALLOWED_MIME_TYPES.contains(contentType.toLowerCase()) && !contentType.startsWith("image/"))) {
            // If MIME is generic binary stream, allow if extension is known
            if (!"application/octet-stream".equalsIgnoreCase(contentType) && !"binary/octet-stream".equalsIgnoreCase(contentType)) {
                throw new BadRequestException("Invalid file MIME type: " + contentType + ". Only PDF and image documents are accepted.");
            }
        }

        try {
            byte[] bytes = file.getBytes();
            return saveCertificateBytes(bytes, originalFilename, ext, contentType, doctorUid);
        } catch (IOException e) {
            logger.error("Failed to read uploaded certificate: {}", e.getMessage());
            throw new BadRequestException("Failed to read certificate upload: " + e.getMessage());
        }
    }

    /**
     * Support Base64 JSON upload for cross-platform / browser resilience.
     */
    public Map<String, Object> storeCertificateBase64(String base64Data, String filename, String contentType, String doctorUid) {
        if (base64Data == null || base64Data.trim().isEmpty()) {
            throw new BadRequestException("No certificate data received.");
        }

        String raw = base64Data;
        if (raw.contains(",")) {
            raw = raw.substring(raw.indexOf(",") + 1);
        }

        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(raw);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid Base64 document payload.");
        }

        if (bytes.length > MAX_FILE_SIZE) {
            double sizeInMb = bytes.length / (1024.0 * 1024.0);
            throw new BadRequestException(String.format("File size exceeds 5 MB limit. Selected file size: %.2f MB", sizeInMb));
        }

        String cleanName = filename != null && !filename.trim().isEmpty() ? filename : "qualification_certificate.pdf";
        String ext = getFileExtension(cleanName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("Unsupported file format. Only PDF, JPG, and PNG files are allowed.");
        }

        return saveCertificateBytes(bytes, cleanName, ext, contentType, doctorUid);
    }

    private Map<String, Object> saveCertificateBytes(byte[] bytes, String originalFilename, String ext, String contentType, String doctorUid) {
        String cleanUid = (doctorUid != null && !doctorUid.trim().isEmpty())
                ? doctorUid.trim().replaceAll("[^a-zA-Z0-9_-]", "")
                : "doc_" + UUID.randomUUID().toString().substring(0, 8);

        String timestamp = String.valueOf(System.currentTimeMillis());
        String storagePath = String.format("doctor-certificates/%s/qualification_certificate_%s.%s", cleanUid, timestamp, ext);
        String resolvedContentType = (contentType != null && !contentType.isEmpty())
                ? contentType
                : (ext.equals("pdf") ? "application/pdf" : ("image/" + (ext.equals("jpg") ? "jpeg" : ext)));

        // 1. Save locally for guaranteed instant preview & download
        try {
            Path targetDir = localBaseDir.resolve(cleanUid);
            Files.createDirectories(targetDir);
            Path filePath = targetDir.resolve(String.format("qualification_certificate_%s.%s", timestamp, ext));
            Files.write(filePath, bytes);
            logger.info("Saved certificate file locally at: {}", filePath.toAbsolutePath());
        } catch (IOException e) {
            logger.warn("Could not write certificate locally: {}", e.getMessage());
        }

        // 2. Upload to Firebase Storage if Firebase is configured
        boolean uploadedToCloud = false;
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                Bucket bucket = StorageClient.getInstance().bucket();
                if (bucket != null) {
                    BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucket.getName(), storagePath))
                            .setContentType(resolvedContentType)
                            .setMetadata(Map.of("doctorUid", cleanUid, "originalFileName", originalFilename))
                            .build();
                    bucket.getStorage().create(blobInfo, bytes);
                    uploadedToCloud = true;
                    logger.info("Uploaded certificate to Cloud Firebase Storage bucket {} at {}", bucket.getName(), storagePath);
                }
            }
        } catch (Exception e) {
            logger.warn("Cloud Firebase Storage sync note (local fallback active): {}", e.getMessage());
        }

        // 3. Register metadata
        Map<String, Object> meta = new HashMap<>();
        meta.put("certificatePath", storagePath);
        meta.put("certificateFileName", originalFilename);
        meta.put("certificateFileType", resolvedContentType);
        meta.put("certificateUploadedAt", Instant.now().toString());
        meta.put("fileSize", bytes.length);
        meta.put("doctorUid", cleanUid);
        meta.put("cloudStored", uploadedToCloud);
        // Secure preview endpoint
        meta.put("viewUrl", "/api/doctors/" + cleanUid + "/certificate");

        certificateStore.put(storagePath, meta);
        certificateStore.put(cleanUid, meta);

        return meta;
    }

    public byte[] getCertificateBytes(String doctorUidOrPath) {
        if (doctorUidOrPath == null) return null;

        // Try finding by path in local directory
        String cleanPath = doctorUidOrPath.replace('\\', '/');
        Path p = Paths.get("uploads", cleanPath);
        if (Files.exists(p)) {
            try {
                return Files.readAllBytes(p);
            } catch (IOException ignored) {}
        }

        // Try finding inside doctorUid folder
        Path dir = localBaseDir.resolve(doctorUidOrPath);
        if (Files.exists(dir) && Files.isDirectory(dir)) {
            File[] files = dir.toFile().listFiles();
            if (files != null && files.length > 0) {
                // sort descending by last modified
                Arrays.sort(files, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
                try {
                    return Files.readAllBytes(files[0].toPath());
                } catch (IOException ignored) {}
            }
        }

        // Try Cloud Storage
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                Bucket bucket = StorageClient.getInstance().bucket();
                if (bucket != null) {
                    byte[] content = bucket.get(cleanPath).getContent();
                    if (content != null) return content;
                }
            }
        } catch (Exception ignored) {}

        return null;
    }

    public Map<String, Object> getCertificateMetadata(String doctorUidOrPath) {
        return certificateStore.get(doctorUidOrPath);
    }

    private String getFileExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx + 1) : "";
    }
}
