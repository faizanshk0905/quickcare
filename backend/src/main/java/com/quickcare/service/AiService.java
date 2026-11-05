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

    public static class SpecializationInfo {
        private final String specialization;
        private final String specialistTitle;
        private final String hindiTitle;
        private final String marathiTitle;

        public SpecializationInfo(String specialization, String specialistTitle, String hindiTitle, String marathiTitle) {
            this.specialization = specialization;
            this.specialistTitle = specialistTitle;
            this.hindiTitle = hindiTitle;
            this.marathiTitle = marathiTitle;
        }

        public String getSpecialization() { return specialization; }
        public String getSpecialistTitle() { return specialistTitle; }
        public String getHindiTitle() { return hindiTitle; }
        public String getMarathiTitle() { return marathiTitle; }
    }

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
            response.setRecommendedDoctors(Collections.emptyList());
            response.setSpecialistAvailable(false);
            return response;
        }

        // 2. Identify specialization from symptoms or direct request
        SpecializationInfo specInfo = detectSpecializationInfo(msg);
        String suggestedSpecialization = specInfo != null ? specInfo.getSpecialization() : null;
        response.setSuggestedSpecialization(suggestedSpecialization);

        // 3. Strict Doctor Specialization Matching from Database
        List<Doctor> matchingDoctors = Collections.emptyList();
        if (suggestedSpecialization != null) {
            matchingDoctors = db.findVerifiedDoctors().stream()
                    .filter(d -> isSpecializationMatch(d, suggestedSpecialization))
                    .limit(3)
                    .collect(Collectors.toList());
        }

        // Set matching doctors STRICTLY - NEVER substitute unrelated doctors
        response.setRecommendedDoctors(matchingDoctors);
        response.setSpecialistAvailable(!matchingDoctors.isEmpty());

        // 4. Generate intelligent healthcare response
        String replyText = null;
        if (apiKey != null && !apiKey.trim().isEmpty() && suggestedSpecialization != null) {
            replyText = callGeminiApi(msg, lang, specInfo, matchingDoctors);
        }

        if (replyText == null || replyText.trim().isEmpty()) {
            replyText = generateTriagingResponse(msg, lang, specInfo, matchingDoctors);
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

    private SpecializationInfo detectSpecializationInfo(String text) {
        String lower = text.toLowerCase();

        // 1. Cardiology
        if (lower.contains("cardio") || lower.contains("heart") || lower.contains("chest pain") ||
                lower.contains("cardiac") || lower.contains("coronary") || lower.contains("palpitation") ||
                lower.contains("blood pressure") || lower.contains("bp") || lower.contains("hypertension") ||
                lower.contains("angina") || lower.contains("ecg") || lower.contains("दिल") ||
                lower.contains("हृदय") || lower.contains("छाती")) {
            return new SpecializationInfo("Cardiology", "Cardiologist", "हृदय रोग विशेषज्ञ (Cardiologist)", "हृदयरोग तज्ज्ञ (Cardiologist)");
        }

        // 2. Neurology
        if (lower.contains("neuro") || lower.contains("neurologist") || lower.contains("neurological") ||
                lower.contains("brain") || lower.contains("migraine") || lower.contains("headache") ||
                lower.contains("seizure") || lower.contains("epilepsy") || lower.contains("stroke") ||
                lower.contains("paralysis") || lower.contains("numbness") || lower.contains("nervous") ||
                lower.contains("parkinson") || lower.contains("dementia") || lower.contains("vertigo") ||
                lower.contains("dizzy") || lower.contains("मस्तिष्क") || lower.contains("दिमाग") ||
                lower.contains("मेंदू") || lower.contains("झटके")) {
            return new SpecializationInfo("Neurology", "Neurologist", "न्यूरोलॉजिस्ट (Neurologist)", "मेंदू व मज्जारोग तज्ज्ञ (Neurologist)");
        }

        // 3. Dermatology
        if (lower.contains("dermat") || lower.contains("skin") || lower.contains("rash") ||
                lower.contains("acne") || lower.contains("eczema") || lower.contains("psoriasis") ||
                lower.contains("itching") || lower.contains("hair loss") || lower.contains("dandruff") ||
                lower.contains("hives") || lower.contains("allergy") || lower.contains("त्वचा") ||
                lower.contains("खुजली") || lower.contains("खाज")) {
            return new SpecializationInfo("Dermatology", "Dermatologist", "त्वचा रोग विशेषज्ञ (Dermatologist)", "त्वचारोग तज्ज्ञ (Dermatologist)");
        }

        // 4. Pediatrics
        if (lower.contains("pediat") || lower.contains("paediat") || lower.contains("child") ||
                lower.contains("baby") || lower.contains("infant") || lower.contains("kid") ||
                lower.contains("toddler") || lower.contains("newborn") || lower.contains("vaccination") ||
                lower.contains("बच्चा") || lower.contains("शिशु") || lower.contains("बाळ") || lower.contains("लहान मूल")) {
            return new SpecializationInfo("Pediatrics", "Pediatrician", "बालरोग विशेषज्ञ (Pediatrician)", "बालरोग तज्ज्ञ (Pediatrician)");
        }

        // 5. Orthopedics
        if (lower.contains("ortho") || lower.contains("bone") || lower.contains("joint") ||
                lower.contains("fracture") || lower.contains("back pain") || lower.contains("knee") ||
                lower.contains("spine") || lower.contains("arthritis") || lower.contains("ligament") ||
                lower.contains("sprain") || lower.contains("spondylosis") || lower.contains("हड्डी") ||
                lower.contains("जोड़") || lower.contains("सांधेदुखी") || lower.contains("हाड")) {
            return new SpecializationInfo("Orthopedics", "Orthopedic Surgeon", "हड्डी व जोड़ विशेषज्ञ (Orthopedic Surgeon)", "अस्थिरोग व सांधे तज्ज्ञ (Orthopedic Surgeon)");
        }

        // 6. Oncology
        if (lower.contains("oncol") || lower.contains("cancer") || lower.contains("tumor") ||
                lower.contains("chemotherapy") || lower.contains("malignan") || lower.contains("biopsy") ||
                lower.contains("lymphoma") || lower.contains("leukemia") || lower.contains("कैंसर") ||
                lower.contains("ट्यूमर") || lower.contains("कर्करोग")) {
            return new SpecializationInfo("Oncology", "Oncologist", "कैंसर विशेषज्ञ (Oncologist)", "कर्करोग तज्ज्ञ (Oncologist)");
        }

        // 7. Gastroenterology
        if (lower.contains("gastro") || lower.contains("stomach") || lower.contains("liver") ||
                lower.contains("acid reflux") || lower.contains("gerd") || lower.contains("digestion") ||
                lower.contains("gastritis") || lower.contains("ulcer") || lower.contains("jaundice") ||
                lower.contains("constipation") || lower.contains("diarrhea") || lower.contains("पेट") ||
                lower.contains("लिवर") || lower.contains("पोटदुखी")) {
            return new SpecializationInfo("Gastroenterology", "Gastroenterologist", "पेट व लिवर विशेषज्ञ (Gastroenterologist)", "पोट व यकृत तज्ज्ञ (Gastroenterologist)");
        }

        // 8. Nephrology
        if (lower.contains("nephro") || lower.contains("kidney") || lower.contains("renal") ||
                lower.contains("dialysis") || lower.contains("kidney stones") || lower.contains("creatinine") ||
                lower.contains("गुर्दा") || lower.contains("किडनी") || lower.contains("मूत्रपिंड")) {
            return new SpecializationInfo("Nephrology", "Nephrologist", "गुर्दा रोग विशेषज्ञ (Nephrologist)", "मूत्रपिंड तज्ज्ञ (Nephrologist)");
        }

        // 9. Dentistry
        if (lower.contains("dent") || lower.contains("tooth") || lower.contains("teeth") ||
                lower.contains("gum") || lower.contains("root canal") || lower.contains("cavity") ||
                lower.contains("दांत") || lower.contains("मसूड़े") || lower.contains("दात")) {
            return new SpecializationInfo("Dentistry", "Dentist", "दंत चिकित्सक (Dentist)", "दंतवैद्य (Dentist)");
        }

        // 10. Ophthalmology
        if (lower.contains("ophthal") || lower.contains("eye") || lower.contains("vision") ||
                lower.contains("blur") || lower.contains("cataract") || lower.contains("glaucoma") ||
                lower.contains("glasses") || lower.contains("आंख") || lower.contains("दृष्टि") || lower.contains("डोळे")) {
            return new SpecializationInfo("Ophthalmology", "Ophthalmologist", "नेत्र रोग विशेषज्ञ (Ophthalmologist)", "नेत्ररोग तज्ज्ञ (Ophthalmologist)");
        }

        // 11. ENT Specialist
        if (lower.contains("ent") || lower.contains("otolaryng") || lower.contains("ear") ||
                lower.contains("nose") || lower.contains("throat") || lower.contains("sinus") ||
                lower.contains("tonsil") || lower.contains("hearing") || lower.contains("कान") ||
                lower.contains("नाक") || lower.contains("गला") || lower.contains("घसा")) {
            return new SpecializationInfo("ENT Specialist", "ENT Specialist", "ईएनटी विशेषज्ञ (ENT Specialist)", "कान-नाक-घसा तज्ज्ञ (ENT Specialist)");
        }

        // 12. Psychiatry
        if (lower.contains("psychiat") || lower.contains("mental") || lower.contains("depression") ||
                lower.contains("anxiety") || lower.contains("panic") || lower.contains("stress") ||
                lower.contains("insomnia") || lower.contains("चिंता") || lower.contains("तनाव") || lower.contains("नैराश्य")) {
            return new SpecializationInfo("Psychiatry", "Psychiatrist", "मनोचिकित्सक (Psychiatrist)", "मानसोपचार तज्ज्ञ (Psychiatrist)");
        }

        // 13. Pulmonology
        if (lower.contains("pulmon") || lower.contains("lung") || lower.contains("asthma") ||
                lower.contains("copd") || lower.contains("pneumonia") || lower.contains("respiratory") ||
                lower.contains("wheezing") || lower.contains("फेफड़े") || lower.contains("फुफ्फुस")) {
            return new SpecializationInfo("Pulmonology", "Pulmonologist", "श्वसन रोग विशेषज्ञ (Pulmonologist)", "श्वसनरोग तज्ज्ञ (Pulmonologist)");
        }

        // 14. General Physician (explicitly for common fever/cold/checkup)
        if (lower.contains("fever") || lower.contains("cold") || lower.contains("flu") ||
                lower.contains("cough") || lower.contains("weakness") || lower.contains("general physician") ||
                lower.contains("general checkup") || lower.contains("बुखार") || lower.contains("ताप") || lower.contains("सर्दी")) {
            return new SpecializationInfo("General Physician", "General Physician", "सामान्य चिकित्सक (General Physician)", "सामान्य चिकित्सक (General Physician)");
        }

        return null;
    }

    private boolean isSpecializationMatch(Doctor d, String requiredSpec) {
        if (d == null || d.getSpecialization() == null) return false;
        if (!"VERIFIED".equalsIgnoreCase(d.getVerificationStatus())) return false;

        String docSpec = d.getSpecialization().trim().toLowerCase();
        String req = requiredSpec.trim().toLowerCase();

        if (docSpec.equals(req)) return true;
        if (docSpec.contains(req) || req.contains(docSpec)) return true;

        if (req.startsWith("cardio") && docSpec.startsWith("cardio")) return true;
        if (req.startsWith("dermat") && docSpec.startsWith("dermat")) return true;
        if (req.startsWith("pediat") && docSpec.startsWith("pediat")) return true;
        if (req.startsWith("ortho") && docSpec.startsWith("ortho")) return true;
        if (req.startsWith("neuro") && docSpec.startsWith("neuro")) return true;
        if (req.startsWith("oncol") && docSpec.startsWith("oncol")) return true;
        if (req.startsWith("gastro") && docSpec.startsWith("gastro")) return true;
        if (req.startsWith("nephro") && docSpec.startsWith("nephro")) return true;
        if (req.startsWith("dent") && docSpec.startsWith("dent")) return true;
        if (req.startsWith("ophthal") && docSpec.startsWith("ophthal")) return true;
        if (req.startsWith("psych") && docSpec.startsWith("psych")) return true;
        if (req.startsWith("pulmon") && docSpec.startsWith("pulmon")) return true;
        if (req.contains("general") && docSpec.contains("general")) return true;

        return false;
    }

    private String generateTriagingResponse(String msg, String lang, SpecializationInfo specInfo, List<Doctor> doctors) {
        // CASE A: User has not described a specific medical specialty/condition
        if (specInfo == null) {
            if ("hi".equalsIgnoreCase(lang)) {
                return "नमस्ते! मैं क्विककेयर एआई स्वास्थ्य सहायक हूं।\n\n" +
                        "कृपया अपने लक्षण या चिकित्सीय समस्या का विवरण दें (जैसे कि छाती में दर्द, त्वचा पर चकत्ते, जोड़ों में दर्द या बाल स्वास्थ्य), और मैं आपको उपयुक्त सत्यापित विशेषज्ञ से जोड़ने में सहायता करूंगा।";
            } else if ("mr".equalsIgnoreCase(lang)) {
                return "नमस्कार! मी क्विककेअर एआई आरोग्य सहाय्यक आहे.\n\n" +
                        "कृपया आपल्या लक्षणांचे किंवा आजाराचे वर्णन करा (उदा. छातीत दुखणे, त्वचेवर पुरळ, सांधेदुखी किंवा बालसंगोपन), जेणेकरून मी तुम्हाला योग्य तज्ज्ञ डॉक्टरांशी जोडू शकेन.";
            } else {
                return "Hello! I am QuickCare AI Assistant.\n\n" +
                        "Please describe your symptoms or medical concern (for example: heart palpitations, skin rash, joint discomfort, or child healthcare), and I will guide you to a verified specialist at Quick Care Hospital if available.";
            }
        }

        String specName = specInfo.getSpecialization();
        String title = specInfo.getSpecialistTitle();

        // CASE B: Specialist NOT available at Quick Care Hospital
        if (doctors.isEmpty()) {
            String article = getArticle(title);
            if ("hi".equalsIgnoreCase(lang)) {
                return "क्षमा करें, वर्तमान में हमारे क्विककेयर अस्पताल में " + specInfo.getHindiTitle() + " उपलब्ध नहीं हैं। कृपया किसी अन्य स्वास्थ्य सुविधा में उपयुक्त विशेषज्ञ से परामर्श लें।\n\n" +
                        "*सूचना: सुरक्षा कारणों से क्विककेयर असंबद्ध विभागों के डॉक्टरों की सिफारिश नहीं करता है।*";
            } else if ("mr".equalsIgnoreCase(lang)) {
                return "क्षमस्व, सध्या आमच्या क्विककेअर हॉस्पिटलमध्ये " + specInfo.getMarathiTitle() + " उपलब्ध नाहीत. कृपया इतर आरोग्य केंद्रात योग्य तज्ज्ञ डॉक्टरांचा सल्ला घ्या.\n\n" +
                        "*टीप: सुरक्षिततेच्या कारणास्तव क्विककेअर असंबंधित विभागाच्या डॉक्टरांची शिफारस करत नाही.*";
            } else {
                return "Sorry, currently we do not have " + article + " " + title.toLowerCase() + " available at Quick Care Hospital. Please consult " + article + " " + title.toLowerCase() + " at another healthcare facility.";
            }
        }

        // CASE C: Matching Specialist IS available
        String docBulletList = doctors.stream()
                .map(d -> {
                    String prefix = (d.getFullName() != null && d.getFullName().startsWith("Dr.")) ? "" : "Dr. ";
                    return "• **" + prefix + d.getFullName() + "** — " + d.getSpecialization() + " (Fee: ₹" + Math.round(d.getConsultationFee()) + ")";
                })
                .collect(Collectors.joining("\n"));

        if ("hi".equalsIgnoreCase(lang)) {
            return "नमस्ते! आपके बताए लक्षणों के आधार पर **" + specInfo.getHindiTitle() + "** से परामर्श लेने की सलाह दी जाती है।\n\n" +
                    "**क्विककेयर अस्पताल में उपलब्ध सत्यापित विशेषज्ञ:**\n" +
                    docBulletList + "\n\n" +
                    "आप नीचे दिए गए डॉक्टर कार्ड से तुरंत 15-मिनट का कन्फर्म वीडियो या क्लिनिक अपॉइंटमेंट बुक कर सकते हैं।\n\n" +
                    "*सूचना: यह सामान्य स्वास्थ्य मार्गदर्शन है और चिकित्सीय निदान का विकल्प नहीं है। गंभीर स्थिति में तुरंत आपातकालीन सेवा 108 पर संपर्क करें।*";
        } else if ("mr".equalsIgnoreCase(lang)) {
            return "नमस्कार! तुमच्या लक्षणांनुसार **" + specInfo.getMarathiTitle() + "** यांचा सल्ला घेण्याची शिफारस केली जाते.\n\n" +
                    "**क्विककेअर हॉस्पिटलमधील उपलब्ध तज्ज्ञ डॉक्टर:**\n" +
                    docBulletList + "\n\n" +
                    "तुम्ही खालील कार्डवरून थेट १५-मिनिटांचे ऑनलाइन व्हिडिओ किंवा क्लिनिक अपॉइंटमेंट बुक करू शकता.\n\n" +
                    "*टीप: हे केवळ आरोग्य विषयक मार्गदर्शन असून अंतिम वैद्यकीय निदान नाही. तातडीच्या वेळी लगेच 108 वर संपर्क साधा.*";
        } else {
            return "Hello! Based on the symptoms described, we recommend consulting a verified specialist in **" + specName + "**.\n\n" +
                    "**Available " + title + "(s) at Quick Care Hospital:**\n" +
                    docBulletList + "\n\n" +
                    "You can review their profile, available 15-minute consultation slots, and book a confirmed consultation using the doctor card(s) below.\n\n" +
                    "*Medical Guidance Disclaimer: QuickCare AI provides healthcare navigation and triaging only and is not a clinical diagnosis. In case of acute or worsening emergency symptoms, please call 108 immediately.*";
        }
    }

    private String callGeminiApi(String message, String lang, SpecializationInfo specInfo, List<Doctor> matchingDoctors) {
        try {
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            String systemPrompt;
            if (matchingDoctors.isEmpty()) {
                String article = getArticle(specInfo.getSpecialistTitle());
                systemPrompt = "You are QuickCare AI Assistant. The user needs a " + specInfo.getSpecialistTitle() + ". " +
                        "CRITICAL RULE: Quick Care Hospital DOES NOT have a " + specInfo.getSpecialistTitle() + ". " +
                        "You MUST respond with: 'Sorry, currently we do not have " + article + " " + specInfo.getSpecialistTitle().toLowerCase() + " available at Quick Care Hospital. Please consult " + article + " " + specInfo.getSpecialistTitle().toLowerCase() + " at another healthcare facility.' " +
                        "DO NOT recommend any other doctor. DO NOT provide medical diagnosis.";
            } else {
                String docNames = matchingDoctors.stream().map(Doctor::getFullName).collect(Collectors.joining(", "));
                systemPrompt = "You are QuickCare AI Assistant. The user needs a " + specInfo.getSpecialistTitle() + ". " +
                        "Quick Care Hospital has the following verified specialist(s): " + docNames + ". " +
                        "Direct them to these specialists only. DO NOT prescribe medicines or provide a definitive medical diagnosis.";
            }

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
                            String resText = (String) p.get("text");
                            // If doctors list is empty, ensure the strict unavailable notice is respected
                            if (matchingDoctors.isEmpty() && !resText.toLowerCase().contains("do not have")) {
                                return "Sorry, currently we do not have a " + specInfo.getSpecialistTitle().toLowerCase() + " available at Quick Care Hospital. Please consult a " + specInfo.getSpecialistTitle().toLowerCase() + " at another healthcare facility.";
                            }
                            return resText;
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("External AI call failed or key absent: {}. Falling back to clinical rules triaging.", e.getMessage());
        }
        return null;
    }

    private String getArticle(String word) {
        if (word == null || word.isEmpty()) return "a";
        char c = Character.toLowerCase(word.charAt(0));
        return (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') ? "an" : "a";
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
            return "Please seek immediate emergency medical care. Do not wait for an online appointment. Call an ambulance (108) or proceed to the nearest emergency casualty ward immediately.";
        }
    }
}
