package com.quickcare.service;

import com.quickcare.dto.AiChatRequest;
import com.quickcare.dto.AiChatResponse;
import com.quickcare.model.Doctor;
import com.quickcare.repository.FirestoreDatabaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);

    @Autowired
    private FirestoreDatabaseService db;

    @Value("${quickcare.ai.api-key:}")
    private String apiKey;

    @Value("${quickcare.ai.model:gemini-1.5-flash}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();

    // Critical Emergency Keywords
    private static final List<String> EMERGENCY_KEYWORDS = Arrays.asList(
            "chest pain", "heart attack", "can't breathe", "cannot breathe", "shortness of breath",
            "severe bleeding", "unconscious", "stroke", "paralysis", "coughing blood",
            "choking", "suicide", "poisoning", "severe head injury", "छाती में दर्द", "सांस लेने में तकलीफ",
            "छातीत दुखणे", "श्वास घेण्यास त्रास"
    );

    public AiChatResponse processMessage(AiChatRequest req) {
        String msg = req.getMessage().trim();
        String lang = req.getLanguage() != null ? req.getLanguage().toLowerCase() : "en";

        AiChatResponse response = new AiChatResponse();
        response.setConversationId(req.getConversationId() != null ? req.getConversationId() : UUID.randomUUID().toString());

        // 1. Check for Critical Emergency
        boolean isEmergency = checkEmergency(msg);
        response.setEmergency(isEmergency);

        if (isEmergency) {
            response.setEmergencyDisclaimer(getEmergencyWarning(lang));
            response.setReply(getEmergencyReply(lang));
            return response;
        }

        // 2. Identify specialization from symptoms
        String suggestedSpecialization = detectSpecialization(msg);
        response.setSuggestedSpecialization(suggestedSpecialization);

        // 3. Find recommended verified doctors matching specialization
        List<Doctor> matchingDoctors = db.findVerifiedDoctors().stream()
                .filter(d -> d.getSpecialization() != null &&
                        d.getSpecialization().equalsIgnoreCase(suggestedSpecialization))
                .limit(3)
                .collect(Collectors.toList());

        if (matchingDoctors.isEmpty()) {
            matchingDoctors = db.findVerifiedDoctors().stream().limit(3).collect(Collectors.toList());
        }
        response.setRecommendedDoctors(matchingDoctors);

        // 4. Generate intelligent healthcare response
        String replyText = null;
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            replyText = callGeminiApi(msg, lang, suggestedSpecialization);
        }

        if (replyText == null || replyText.trim().isEmpty()) {
            replyText = generateClinicalTriagingResponse(msg, lang, suggestedSpecialization, matchingDoctors);
        }

        response.setReply(replyText);
        return response;
    }

    private boolean checkEmergency(String text) {
        String lower = text.toLowerCase();
        for (String kw : EMERGENCY_KEYWORDS) {
            if (lower.contains(kw.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    private String detectSpecialization(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("heart") || lower.contains("chest") || lower.contains("palpitation") || lower.contains("bp") || lower.contains("blood pressure")) {
            return "Cardiology";
        } else if (lower.contains("skin") || lower.contains("rash") || lower.contains("acne") || lower.contains("itching") || lower.contains("hair")) {
            return "Dermatology";
        } else if (lower.contains("bone") || lower.contains("joint") || lower.contains("fracture") || lower.contains("back pain") || lower.contains("knee")) {
            return "Orthopedics";
        } else if (lower.contains("child") || lower.contains("baby") || lower.contains("infant") || lower.contains("kid")) {
            return "Pediatrics";
        } else if (lower.contains("eye") || lower.contains("vision") || lower.contains("blur") || lower.contains("glasses")) {
            return "Ophthalmology";
        } else if (lower.contains("teeth") || lower.contains("tooth") || lower.contains("gum") || lower.contains("dental")) {
            return "Dentistry";
        } else if (lower.contains("headache") || lower.contains("migraine") || lower.contains("dizzy") || lower.contains("numbness") || lower.contains("seizure")) {
            return "Neurology";
        } else if (lower.contains("stress") || lower.contains("anxiety") || lower.contains("depression") || lower.contains("sleep") || lower.contains("mental")) {
            return "Psychiatry";
        } else if (lower.contains("ear") || lower.contains("nose") || lower.contains("throat") || lower.contains("tonsil") || lower.contains("sinus")) {
            return "ENT Specialist";
        }
        return "General Physician";
    }

    private String callGeminiApi(String message, String lang, String specialization) {
        try {
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            String systemPrompt = "You are QuickCare AI, a professional healthcare guidance assistant. " +
                    "Analyze patient symptoms, offer supportive preventive tips, explain what might be happening simply, " +
                    "and guide them to see a " + specialization + ". " +
                    "IMPORTANT: Do not prescribe specific medicines or claim a definitive medical diagnosis. " +
                    "Respond concisely in " + ("hi".equals(lang) ? "Hindi" : "mr".equals(lang) ? "Marathi" : "English") + ".";

            Map<String, Object> body = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", systemPrompt + "\nPatient message: " + message);
            content.put("parts", List.of(part));
            body.put("contents", List.of(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> first = candidates.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> resContent = (Map<String, Object>) first.get("content");
                    if (resContent != null) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) resContent.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map<String, Object> p = parts.get(0);
                            return (String) p.get("text");
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("External AI call failed or key absent: {}. Falling back to clinical rules triaging.", e.getMessage());
        }
        return null;
    }

    private String generateClinicalTriagingResponse(String msg, String lang, String specialization, List<Doctor> doctors) {
        String docNames = doctors.stream().map(d -> "Dr. " + d.getFullName()).collect(Collectors.joining(", "));

        if ("hi".equalsIgnoreCase(lang)) {
            return "नमस्ते! आपके बताए लक्षणों के आधार पर आपको " + specialization + " (विशेषज्ञ) से परामर्श लेने की सलाह दी जाती है।\n\n" +
                    "• प्राथमिक देखभाल: पर्याप्त पानी पिएं, पर्याप्त आराम करें और तनाव से बचें।\n" +
                    "• डॉक्टर की सलाह: हमारे पास उपलब्ध सत्यापित विशेषज्ञ: " + docNames + "।\n" +
                    "• त्वरित अपॉइंटमेंट: आप नीचे दिए गए डॉक्टरों में से किसी के साथ तुरंत ऑनलाइन वीडियो या क्लिनिक अपॉइंटमेंट बुक कर सकते हैं।\n\n" +
                    "*सूचना: यह एक सामान्य स्वास्थ्य मार्गदर्शन है और चिकित्सीय निदान का विकल्प नहीं है।*";
        } else if ("mr".equalsIgnoreCase(lang)) {
            return "नमस्कार! तुमच्या लक्षणांच्या आधारे तुम्हाला " + specialization + " (तज्ज्ञ) डॉक्टरांचा सल्ला घेण्याची शिफारस केली जाते.\n\n" +
                    "• प्राथमिक काळजी: भरपूर पाणी प्या, पुरेशी विश्रांती घ्या आणि जड कामे टाळा.\n" +
                    "• उपलब्ध तज्ज्ञ डॉक्टर: " + docNames + ".\n" +
                    "• अपॉइंटमेंट बुकिंग: तुम्ही खालील तज्ज्ञांपैकी कोणाचीही ऑनलाइन व्हिडिओ किंवा थेट क्लिनिक भेट बुक करू शकता.\n\n" +
                    "*टीप: हे केवळ आरोग्य विषयक मार्गदर्शन असून अंतिम वैद्यकीय निदान नाही.*";
        } else {
            return "Hello! Based on the symptoms you reported, consulting a specialist in **" + specialization + "** is strongly recommended.\n\n" +
                    "**Initial Self-Care Guidance:**\n" +
                    "• Stay well hydrated and ensure adequate rest.\n" +
                    "• Monitor your symptoms closely, note down when they started and their severity.\n" +
                    "• Avoid self-medicating with antibiotics or strong painkillers without a prescription.\n\n" +
                    "**Recommended Verified Specialists:**\n" +
                    "We have verified doctors available on QuickCare: " + docNames + ".\n\n" +
                    "You can easily book a confirmed video consultation or clinic visit using the doctor cards below.\n\n" +
                    "*Medical Disclaimer: QuickCare AI provides informational guidance only and is not a substitute for professional clinical diagnosis.*";
        }
    }

    private String getEmergencyWarning(String lang) {
        if ("hi".equalsIgnoreCase(lang)) {
            return "⚠️ आपातकालीन चेतावनी: आपके लक्षण संभावित रूप से गंभीर स्थिति का संकेत दे सकते हैं। तुरंत नजदीकी आपातकालीन अस्पताल (108 / 112) से संपर्क करें!";
        } else if ("mr".equalsIgnoreCase(lang)) {
            return "⚠️ तातडीची चेतावणी: तुमची लक्षणे गंभीर स्थिती दर्शवू शकतात. कृपया त्वरित जवळच्या रुग्णालयाशी किंवा आपत्कालीन क्रमांकाशी (108 / 112) संपर्क साधा!";
        } else {
            return "⚠️ MEDICAL EMERGENCY WARNING: The symptoms described may indicate an urgent or life-threatening medical emergency. Please immediately call emergency services (108 / 911 / 112) or proceed to the nearest emergency hospital!";
        }
    }

    private String getEmergencyReply(String lang) {
        if ("hi".equalsIgnoreCase(lang)) {
            return "कृपया तुरंत आपातकालीन सहायता प्राप्त करें। किसी भी ऑनलाइन चैट पर निर्भर न रहें और तुरंत नजदीकी अस्पताल के आपातकालीन कक्ष (Casualty) में जाएं।";
        } else if ("mr".equalsIgnoreCase(lang)) {
            return "कृपया त्वरित वैद्यकीय मदत घ्या. ऑनलाइन चॅटवर अवलंबून न राहता ताबडतोब नजीकच्या हॉस्पिटलच्या इमर्जन्सी वॉर्डमध्ये जा.";
        } else {
            return "Please seek immediate emergency medical care. Do not wait for online consultation. Call an ambulance or have someone drive you to the nearest emergency hospital immediately.";
        }
    }
}
