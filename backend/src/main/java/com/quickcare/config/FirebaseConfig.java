package com.quickcare.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${quickcare.firebase.config-path:src/main/resources/firebase-service-account.json}")
    private String configPath;

    @Value("${quickcare.firebase.project-id:quick-care-healthcare}")
    private String projectId;

    @Bean
    public Firestore firestore() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                File file = new File(configPath);
                InputStream serviceAccountStream = null;

                if (file.exists()) {
                    serviceAccountStream = new FileInputStream(file);
                    logger.info("Loading Firebase credentials from file: {}", configPath);
                } else {
                    serviceAccountStream = getClass().getClassLoader().getResourceAsStream("firebase-service-account.json");
                    if (serviceAccountStream != null) {
                        logger.info("Loading Firebase credentials from classpath");
                    }
                }

                if (serviceAccountStream != null) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                            .setProjectId(projectId)
                            .build();

                    FirebaseApp.initializeApp(options);
                    logger.info("Firebase App initialized successfully with Firestore project: {}", projectId);
                    return FirestoreClient.getFirestore();
                } else {
                    logger.warn("Firebase credentials not found at {}. Initializing in Standalone/Demo mode.", configPath);
                    return null;
                }
            } else {
                return FirestoreClient.getFirestore();
            }
        } catch (Exception e) {
            logger.warn("Could not connect to live Cloud Firestore ({}). Using high-speed standalone Firestore memory persistence.", e.getMessage());
            return null;
        }
    }
}
