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
import java.util.concurrent.ConcurrentHashMap;
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

    // Multi-turn session conversation history: conversationId -> List of {role, content}
    private final Map<String, List<Map<String, String>>> conversationHistories = new ConcurrentHashMap<>();

    // Critical Emergency Keywords
    private static final List<String> EMERGENCY_KEYWORDS = Arrays.asList(
            "chest pain", "heart attack", "can't breathe", "cannot breathe", "shortness of breath",
            "severe bleeding", "unconscious", "stroke", "paralysis", "coughing blood",
            "choking", "suicide", "poisoning", "severe head injury", "छाती में दर्द", "सांस लेने में तकलीफ",
            "छातीत दुखणे", "श्वास घेण्यास त्रास", "बेहोश", "रक्तस्त्राव"
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
        String convId = req.getConversationId() != null && !req.getConversationId().trim().isEmpty()
                ? req.getConversationId().trim()
                : UUID.randomUUID().toString();

        AiChatResponse response = new AiChatResponse();
        response.setConversationId(convId);

        // Record user message in session history
        recordHistory(convId, "user", msg);

        // 1. Critical Emergency Check
        boolean isEmergency = checkEmergency(msg);
        response.setEmergency(isEmergency);

        if (isEmergency) {
            response.setEmergencyDisclaimer(getEmergencyWarning(lang));
            String emergencyReply = getEmergencyReply(lang);
            response.setReply(emergencyReply);
            response.setRecommendedDoctors(Collections.emptyList());
            response.setSpecialistAvailable(false);
            recordHistory(convId, "assistant", emergencyReply);
            return response;
        }

        // 2. Identify medical specialization from query or symptoms
        SpecializationInfo specInfo = detectSpecializationInfo(msg);
        String suggestedSpecialization = specInfo != null ? specInfo.getSpecialization() : null;
        response.setSuggestedSpecialization(suggestedSpecialization);

        // 3. Strict Doctor Specialization Matching from Firestore Database
        List<Doctor> matchingDoctors = Collections.emptyList();
        if (suggestedSpecialization != null) {
            matchingDoctors = db.findVerifiedDoctors().stream()
                    .filter(d -> isSpecializationMatch(d, suggestedSpecialization))
                    .limit(3)
                    .collect(Collectors.toList());
        }

        // Strictly recommend verified specialists only - NEVER recommend unrelated doctors
        response.setRecommendedDoctors(matchingDoctors);
        response.setSpecialistAvailable(specInfo == null || !matchingDoctors.isEmpty());

        // 4. Generate conversational healthcare response
        String replyText = null;

        // Try LLM API (Gemini) if configured
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            replyText = callGeminiApi(msg, lang, specInfo, matchingDoctors, convId);
        }

        // If API key is absent, offline, or returns null, use clinical conversational engine
        if (replyText == null || replyText.trim().isEmpty()) {
            replyText = generateConversationalResponse(msg, lang, specInfo, matchingDoctors);
        }

        response.setReply(replyText);
        recordHistory(convId, "assistant", replyText);
        return response;
    }

    private void recordHistory(String convId, String role, String content) {
        conversationHistories.computeIfAbsent(convId, k -> new ArrayList<>())
                .add(Map.of("role", role, "content", content));
        // Keep last 10 messages to maintain clean context window
        List<Map<String, String>> history = conversationHistories.get(convId);
        if (history.size() > 10) {
            conversationHistories.put(convId, new ArrayList<>(history.subList(history.size() - 10, history.size())));
        }
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

    public SpecializationInfo detectSpecializationInfo(String text) {
        String lower = text.toLowerCase();

        // 1. Cardiology (Heart & Vascular)
        if (lower.contains("cardio") || lower.contains("heart") || lower.contains("chest pain") ||
                lower.contains("cardiac") || lower.contains("coronary") || lower.contains("palpitation") ||
                lower.contains("blood pressure") || lower.contains("bp") || lower.contains("hypertension") ||
                lower.contains("angina") || lower.contains("ecg") || lower.contains("cholesterol") ||
                lower.contains("दिल") || lower.contains("हृदय") || lower.contains("छाती") || lower.contains("रक्तदाब")) {
            return new SpecializationInfo("Cardiology", "Cardiologist", "हृदय रोग विशेषज्ञ (Cardiologist)", "हृदयरोग तज्ज्ञ (Cardiologist)");
        }

        // 2. Dermatology (Skin, Hair, Nails)
        if (lower.contains("dermat") || lower.contains("skin") || lower.contains("rash") ||
                lower.contains("acne") || lower.contains("eczema") || lower.contains("psoriasis") ||
                lower.contains("itching") || lower.contains("hair loss") || lower.contains("dandruff") ||
                lower.contains("hives") || lower.contains("allergy") || lower.contains("skin allergy") ||
                lower.contains("त्वचा") || lower.contains("खुजली") || lower.contains("खाज") || lower.contains("पिंपल")) {
            return new SpecializationInfo("Dermatology", "Dermatologist", "त्वचा रोग विशेषज्ञ (Dermatologist)", "त्वचारोग तज्ज्ञ (Dermatologist)");
        }

        // 3. Pediatrics (Children & Infants)
        if (lower.contains("pediat") || lower.contains("paediat") || lower.contains("child") ||
                lower.contains("baby") || lower.contains("infant") || lower.contains("kid") ||
                lower.contains("toddler") || lower.contains("newborn") || lower.contains("vaccination") ||
                lower.contains("बच्चा") || lower.contains("शिशु") || lower.contains("बाळ") || lower.contains("लहान मूल")) {
            return new SpecializationInfo("Pediatrics", "Pediatrician", "बालरोग विशेषज्ञ (Pediatrician)", "बालरोग तज्ज्ञ (Pediatrician)");
        }

        // 4. Orthopedics (Bones, Joints, Spine)
        if (lower.contains("ortho") || lower.contains("bone") || lower.contains("joint") ||
                lower.contains("fracture") || lower.contains("back pain") || lower.contains("knee") ||
                lower.contains("spine") || lower.contains("arthritis") || lower.contains("ligament") ||
                lower.contains("sprain") || lower.contains("spondylosis") || lower.contains("osteoporosis") ||
                lower.contains("हड्डी") || lower.contains("जोड़") || lower.contains("सांधेदुखी") || lower.contains("हाड")) {
            return new SpecializationInfo("Orthopedics", "Orthopedic Surgeon", "हड्डी व जोड़ विशेषज्ञ (Orthopedic Surgeon)", "अस्थिरोग व सांधे तज्ज्ञ (Orthopedic Surgeon)");
        }

        // 5. Neurology (Brain, Nerves, Spine, Migraine)
        if (lower.contains("neuro") || lower.contains("brain") || lower.contains("migraine") ||
                lower.contains("headache") || lower.contains("seizure") || lower.contains("epilepsy") ||
                lower.contains("stroke") || lower.contains("paralysis") || lower.contains("numbness") ||
                lower.contains("parkinson") || lower.contains("dementia") || lower.contains("vertigo") ||
                lower.contains("मस्तिष्क") || lower.contains("दिमाग") || lower.contains("मेंदू") || lower.contains("झटके")) {
            return new SpecializationInfo("Neurology", "Neurologist", "न्यूरोलॉजिस्ट (Neurologist)", "मेंदू व मज्जारोग तज्ज्ञ (Neurologist)");
        }

        // 6. Oncology (Cancer & Tumors)
        if (lower.contains("oncol") || lower.contains("cancer") || lower.contains("tumor") ||
                lower.contains("chemotherapy") || lower.contains("malignan") || lower.contains("biopsy") ||
                lower.contains("lymphoma") || lower.contains("leukemia") || lower.contains("कैंसर") ||
                lower.contains("ट्यूमर") || lower.contains("कर्करोग")) {
            return new SpecializationInfo("Oncology", "Oncologist", "कैंसर विशेषज्ञ (Oncologist)", "कर्करोग तज्ज्ञ (Oncologist)");
        }

        // 7. Gastroenterology (Stomach, Liver, Digestion)
        if (lower.contains("gastro") || lower.contains("stomach") || lower.contains("liver") ||
                lower.contains("acid reflux") || lower.contains("gerd") || lower.contains("digestion") ||
                lower.contains("gastritis") || lower.contains("ulcer") || lower.contains("jaundice") ||
                lower.contains("constipation") || lower.contains("diarrhea") || lower.contains("acidity") ||
                lower.contains("पेट") || lower.contains("लिवर") || lower.contains("पोटदुखी") || lower.contains("बद्धकोष्ठता")) {
            return new SpecializationInfo("Gastroenterology", "Gastroenterologist", "पेट व लिवर विशेषज्ञ (Gastroenterologist)", "पोट व यकृत तज्ज्ञ (Gastroenterologist)");
        }

        // 8. Pulmonology (Lungs & Respiratory)
        if (lower.contains("pulmon") || lower.contains("lung") || lower.contains("asthma") ||
                lower.contains("copd") || lower.contains("pneumonia") || lower.contains("respiratory") ||
                lower.contains("wheezing") || lower.contains("bronchitis") || lower.contains("फेफड़े") || lower.contains("फुफ्फुस") || lower.contains("दमा")) {
            return new SpecializationInfo("Pulmonology", "Pulmonologist", "श्वसन रोग विशेषज्ञ (Pulmonologist)", "श्वसनरोग तज्ज्ञ (Pulmonologist)");
        }

        // 9. Nephrology (Kidneys)
        if (lower.contains("nephro") || lower.contains("kidney") || lower.contains("renal") ||
                lower.contains("dialysis") || lower.contains("creatinine") || lower.contains("गुर्दा") || lower.contains("किडनी") || lower.contains("मूत्रपिंड")) {
            return new SpecializationInfo("Nephrology", "Nephrologist", "गुर्दा रोग विशेषज्ञ (Nephrologist)", "मूत्रपिंड तज्ज्ञ (Nephrologist)");
        }

        // 10. Dentistry (Teeth & Oral)
        if (lower.contains("dent") || lower.contains("tooth") || lower.contains("teeth") ||
                lower.contains("gum") || lower.contains("root canal") || lower.contains("cavity") ||
                lower.contains("दांत") || lower.contains("मसूड़े") || lower.contains("दात")) {
            return new SpecializationInfo("Dentistry", "Dentist", "दंत चिकित्सक (Dentist)", "दंतवैद्य (Dentist)");
        }

        // 11. Ophthalmology (Eyes)
        if (lower.contains("ophthal") || lower.contains("eye") || lower.contains("vision") ||
                lower.contains("cataract") || lower.contains("glaucoma") || lower.contains("आंख") || lower.contains("दृष्टि") || lower.contains("डोळे")) {
            return new SpecializationInfo("Ophthalmology", "Ophthalmologist", "नेत्र रोग विशेषज्ञ (Ophthalmologist)", "नेत्ररोग तज्ज्ञ (Ophthalmologist)");
        }

        // 12. Psychiatry & Mental Health
        if (lower.contains("psychiat") || lower.contains("mental") || lower.contains("depression") ||
                lower.contains("anxiety") || lower.contains("panic") || lower.contains("insomnia") ||
                lower.contains("चिंता") || lower.contains("तनाव") || lower.contains("नैराश्य")) {
            return new SpecializationInfo("Psychiatry", "Psychiatrist", "मनोचिकित्सक (Psychiatrist)", "मानसोपचार तज्ज्ञ (Psychiatrist)");
        }

        // 13. General Physician (Fever, Cold, Diabetes checkup, General health)
        if (lower.contains("fever") || lower.contains("cold") || lower.contains("flu") ||
                lower.contains("cough") || lower.contains("weakness") || lower.contains("diabetes") ||
                lower.contains("general physician") || lower.contains("checkup") ||
                lower.contains("बुखार") || lower.contains("ताप") || lower.contains("सर्दी") || lower.contains("मधुमेह")) {
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

    private String generateConversationalResponse(String msg, String lang, SpecializationInfo specInfo, List<Doctor> doctors) {
        String lower = msg.toLowerCase().trim();

        // Check if query is about a specific health topic/disease
        String topicAnswer = getComprehensiveTopicGuidance(lower, lang);

        // CASE 1: Query matched a specialization that is NOT AVAILABLE at Quick Care Hospital
        if (specInfo != null && doctors.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            if (topicAnswer != null) {
                sb.append(topicAnswer).append("\n\n---\n\n");
            }
            if ("hi".equalsIgnoreCase(lang)) {
                sb.append("Currently, we do not have a doctor specializing in this condition. Please check again later or consult an appropriate healthcare provider.\n\n")
                  .append("*सूचना: सुरक्षा कारणों से क्विककेयर अस्पताल असंबद्ध विभागों के डॉक्टरों की सिफारिश नहीं करता है।*");
            } else if ("mr".equalsIgnoreCase(lang)) {
                sb.append("Currently, we do not have a doctor specializing in this condition. Please check again later or consult an appropriate healthcare provider.\n\n")
                  .append("*टीप: सुरक्षिततेच्या कारणास्तव क्विककेअर असंबंधित विभागाच्या डॉक्टरांची शिफारस करत नाही.*");
            } else {
                sb.append("Currently, we do not have a doctor specializing in this condition. Please check again later or consult an appropriate healthcare provider.\n\n")
                  .append("*Notice: To protect clinical safety, QuickCare never recommends doctors from unrelated medical specialties.*");
            }
            return sb.toString();
        }

        // CASE 2: Query matched a specialization that IS AVAILABLE at Quick Care Hospital
        if (specInfo != null && !doctors.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            if (topicAnswer != null) {
                sb.append(topicAnswer).append("\n\n---\n\n");
            }

            String docList = doctors.stream()
                    .map(d -> "• **" + (d.getFullName().startsWith("Dr.") ? "" : "Dr. ") + d.getFullName() + "** — " + d.getSpecialization() + " (" + d.getQualification() + ", Fee: ₹" + Math.round(d.getConsultationFee()) + ")")
                    .collect(Collectors.joining("\n"));

            if ("hi".equalsIgnoreCase(lang)) {
                sb.append("नमस्ते! आपके बताए लक्षणों के आधार पर **").append(specInfo.getHindiTitle()).append("** से परामर्श लेने की सलाह दी जाती है।\n\n")
                  .append("**क्विककेयर अस्पताल में उपलब्ध सत्यापित विशेषज्ञ:**\n")
                  .append(docList).append("\n\n")
                  .append("आप नीचे दिए गए कार्ड से तुरंत 15-मिनट का कन्फर्म वीडियो या क्लिनिक अपॉइंटमेंट बुक कर सकते हैं।\n\n")
                  .append("*सूचना: यह सामान्य स्वास्थ्य मार्गदर्शन है और चिकित्सीय निदान का विकल्प नहीं है। गंभीर स्थिति में 108 पर संपर्क करें।*");
            } else if ("mr".equalsIgnoreCase(lang)) {
                sb.append("नमस्कार! आपल्या लक्षणांनुसार **").append(specInfo.getMarathiTitle()).append("** यांचा सल्ला घेण्याची शिफारस केली जाते.\n\n")
                  .append("**क्विककेअर हॉस्पिटलमधील उपलब्ध तज्ज्ञ डॉक्टर:**\n")
                  .append(docList).append("\n\n")
                  .append("आपण खालील डॉक्टर कार्डवरून त्वरित 15-मिनिटांची ऑनलाइन व्हिडिओ किंवा क्लिनिक अपॉइंटमेंट बुक करू शकता.\n\n")
                  .append("*टीप: हे केवळ आरोग्य विषयक मार्गदर्शन असून अंतिम वैद्यकीय निदान नाही. आपत्कालीन वेळी 108 वर संपर्क साधा.*");
            } else {
                sb.append("Hello! Based on the symptoms described, we recommend consulting a verified specialist in **").append(specInfo.getSpecialization()).append("**.\n\n")
                  .append("**Available ").append(specInfo.getSpecialistTitle()).append("(s) at Quick Care Hospital:**\n")
                  .append(docList).append("\n\n")
                  .append("You can review their profile, available 15-minute consultation slots, and book a confirmed consultation using the doctor card(s) below.\n\n")
                  .append("*Medical Guidance Disclaimer: QuickCare AI provides healthcare navigation and triaging only and is not a clinical diagnosis. In case of acute or worsening emergency symptoms, please call 108 immediately.*");
            }
            return sb.toString();
        }

        // CASE 3: General healthcare question or conversational query
        if (topicAnswer != null) {
            return topicAnswer;
        }

        // Default welcoming triaging prompt
        if ("hi".equalsIgnoreCase(lang)) {
            return "नमस्ते! मैं क्विककेयर एआई स्वास्थ्य सहायक हूं।\n\n" +
                    "मैं विभिन्न बीमारियों (जैसे मधुमेह, रक्तचाप, हृदय स्वास्थ्य, त्वचा रोग, अस्थमा), उनके लक्षण, दवाइयां, जांच एवं रोकथाम के बारे में आपके प्रश्नों का उत्तर दे सकता हूं।\n\n" +
                    "कृपया अपने लक्षण या चिकित्सीय प्रश्न का विवरण दें, और मैं आपको विस्तृत जानकारी एवं अस्पताल में उपलब्ध सत्यापित विशेषज्ञ से जोड़ने में सहायता करूंगा।";
        } else if ("mr".equalsIgnoreCase(lang)) {
            return "नमस्कार! मी क्विककेअर एआई आरोग्य सहाय्यक आहे.\n\n" +
                    "मी विविध आजार (उदा. मधुमेह, रक्तदाब, हृदयरोग, त्वचारोग, दमा), त्यांची लक्षणे, प्राथमिक उपचार, तपासण्या आणि प्रतिबंध याविषयी आपल्या प्रश्नांची उत्तरे देऊ शकतो.\n\n" +
                    "कृपया आपल्या लक्षणांचे किंवा आजाराचे वर्णन करा, जेणेकरून मी आपल्याला योग्य माहिती व उपलब्ध तज्ज्ञ डॉक्टरांशी जोडू शकेन.";
        } else {
            return "Hello! I am QuickCare AI Clinical Assistant.\n\n" +
                    "I can help answer questions on a wide range of healthcare topics, including:\n" +
                    "• Common & chronic diseases (Diabetes, Hypertension, Heart disease, Asthma, Arthritis)\n" +
                    "• Symptoms and early warning signs\n" +
                    "• General uses of medications, lifestyle & preventive measures\n" +
                    "• Diagnostic tests (ECG, Lipid Profile, Blood sugar, CBC, MRI)\n" +
                    "• First aid and when to consult a specialist\n\n" +
                    "Please describe your medical question or symptoms, and I will provide structured guidance and connect you with matching verified specialists if available at Quick Care Hospital.";
        }
    }

    private String getComprehensiveTopicGuidance(String lower, String lang) {
        boolean isHi = "hi".equalsIgnoreCase(lang);
        boolean isMr = "mr".equalsIgnoreCase(lang);

        // 1. Diabetes & Blood Sugar
        if (lower.contains("diabetes") || lower.contains("sugar") || lower.contains("glucose") ||
            lower.contains("insulin") || lower.contains("hba1c") || lower.contains("मधुमेह")) {
            if (isHi) {
                return "### 🩺 मधुमेह (Diabetes) की संपूर्ण जानकारी:\n\n" +
                        "**प्रकार:**\n" +
                        "• **टाइप 1 मधुमेह:** शरीर में इंसुलिन का उत्पादन नहीं होता (अक्सर बच्चों या युवाओं में)।\n" +
                        "• **टाइप 2 मधुमेह:** शरीर इंसुलिन का सही उपयोग नहीं कर पाता (जीवनशैली व आनुवंशिक कारणों से)।\n\n" +
                        "**मुख्य लक्षण:** अत्यधिक प्यास लगना, बार-बार पेशाब आना, बिना कारण वजन कम होना, थकान, और घावों का देरी से भरना।\n\n" +
                        "**जांच:** फास्टिंग ब्लड शुगर (सामान्य: <100 mg/dL), पीपी ब्लड शुगर (<140 mg/dL), और HbA1c (सामान्य: <5.7%)।\n\n" +
                        "**प्रबंधन:** कम कार्बोहाइड्रेट युक्त आहार, नियमित व्यायाम (30 मिनट प्रतिदिन), वजन नियंत्रण, और चिकित्सक की सलाह अनुसार दवाइयां।";
            } else if (isMr) {
                return "### 🩺 मधुमेहाविषयी (Diabetes) सविस्तर माहिती:\n\n" +
                        "**प्रकार:**\n" +
                        "• **टाइप 1:** शरीरात इन्सुलिन तयार होत नाही.\n" +
                        "• **टाइप 2:** शरीरातील इन्सुलिनचा योग्य वापर होत नाही (जीवनशैली व आहाराशी संबंधित).\n\n" +
                        "**लक्षणे:** वारंवार तहान व लघवी लागणे, वजन कमी होणे, थकवा, आणि जखमा लवकर न भरणे.\n\n" +
                        "**तपासण्या:** उपाशीपोटी साखर (Fasting <100 mg/dL), जेवणानंतर (<140 mg/dL), आणि HbA1c (<5.7%).\n\n" +
                        "**उपाय:** समतोल आहार, साखर व गोड पदार्थ टाळणे, दररोज ३० मिनिटे चालणे व नियमित वैद्यकीय तपासणी.";
            } else {
                return "### 🩺 Overview of Diabetes & Blood Sugar Management:\n\n" +
                        "**Types of Diabetes:**\n" +
                        "• **Type 1 Diabetes:** Autoimmune condition where the pancreas produces little or no insulin.\n" +
                        "• **Type 2 Diabetes:** Metabolic condition characterized by insulin resistance and relative insulin deficiency (most common).\n" +
                        "• **Gestational Diabetes:** Develops during pregnancy and usually resolves after delivery.\n\n" +
                        "**Common Symptoms:**\n" +
                        "• Increased thirst (polydipsia) and frequent urination (polyuria)\n" +
                        "• Unexplained weight loss, constant fatigue, and blurred vision\n" +
                        "• Slow-healing sores or recurrent skin and urinary infections\n\n" +
                        "**Key Diagnostic Tests:**\n" +
                        "• **Fasting Blood Glucose:** Normal <100 mg/dL; Prediabetes 100–125; Diabetes ≥126 mg/dL\n" +
                        "• **HbA1c (3-Month Average):** Normal <5.7%; Prediabetes 5.7–6.4%; Diabetes ≥6.5%\n\n" +
                        "**Lifestyle & Management Recommendations:**\n" +
                        "1. **Diet:** Prioritize complex carbohydrates, fiber-rich vegetables, lean proteins, and avoid refined sugars.\n" +
                        "2. **Physical Activity:** Minimum 150 minutes of moderate aerobic exercise weekly.\n" +
                        "3. **Regular Monitoring:** Track fasting and post-prandial glucose levels as directed by your physician.";
            }
        }

        // 2. Hypertension / High Blood Pressure
        if (lower.contains("blood pressure") || lower.contains("hypertension") || lower.contains("high bp") ||
            lower.contains("low bp") || lower.contains("रक्तचाप") || lower.contains("रक्तदाब")) {
            if (isHi) {
                return "### 🩺 उच्च रक्तचाप (Hypertension) की जानकारी:\n\n" +
                        "**सामान्य श्रेणियां:**\n" +
                        "• सामान्य बीपी: 120/80 mmHg से कम\n" +
                        "• उच्च रक्तचाप (Stage 1): 130–139 / 80–89 mmHg\n" +
                        "• उच्च रक्तचाप (Stage 2): 140/90 mmHg या अधिक\n\n" +
                        "**लक्षण:** इसे 'साइलेंट किलर' कहा जाता है क्योंकि अक्सर लक्षण नहीं होते। गंभीर स्थिति में सिरदर्द, चक्कर आना, और सीने में भारीपन हो सकता है।\n\n" +
                        "**नियंत्रण के उपाय:** नमक (Sodium) का सेवन 5 ग्राम प्रतिदिन से कम करें, DASH डाइट अपनाएं, तनाव कम करें, और नियमित जांच करवाएं।";
            } else if (isMr) {
                return "### 🩺 उच्च रक्तदाबाविषयी (Hypertension) माहिती:\n\n" +
                        "**रक्तदाब श्रेणी:**\n" +
                        "• सामान्य: 120/80 mmHg\n" +
                        "• हायपरटेंशन: 140/90 mmHg किंवा त्याहून अधिक\n\n" +
                        "**लक्षणे:** अनेकदा कोणतीही लक्षणे दिसत नाहीत, म्हणून याला 'सायलेंट किलर' म्हणतात. तीव्र स्थितीत डोकेदुखी व चक्कर येऊ शकते.\n\n" +
                        "**काळजी:** जेवणात मिठाचे प्रमाण कमी करा, पालेभाज्या व फळांचे सेवन वाढवा, नियमित व्यायाम करा व तणाव टाळा.";
            } else {
                return "### 🩺 Clinical Overview of Blood Pressure & Hypertension:\n\n" +
                        "**Blood Pressure Categories (AHA Guidelines):**\n" +
                        "• **Normal:** Less than 120/80 mmHg\n" +
                        "• **Elevated:** Systolic 120–129 and Diastolic <80 mmHg\n" +
                        "• **Stage 1 Hypertension:** Systolic 130–139 or Diastolic 80–89 mmHg\n" +
                        "• **Stage 2 Hypertension:** Systolic ≥140 or Diastolic ≥90 mmHg\n\n" +
                        "**Why It Matters:** Uncontrolled high blood pressure is a leading cause of heart disease, stroke, and kidney impairment.\n\n" +
                        "**Evidence-Based Management:**\n" +
                        "• **DASH Diet:** Focus on fruits, vegetables, whole grains, and low-fat dairy.\n" +
                        "• **Sodium Restriction:** Limit dietary sodium to less than 2,000 mg per day.\n" +
                        "• **Weight & Stress Management:** Maintain a healthy BMI (18.5–24.9) and practice mindfulness or aerobic exercise.";
            }
        }

        // 3. Heart Health & Coronary Conditions
        if (lower.contains("heart disease") || lower.contains("cardiovascular") || lower.contains("cholesterol") ||
            lower.contains("angina") || lower.contains("ecg") || lower.contains("हार्ट")) {
            return "### ❤️ Heart Health & Preventive Cardiology:\n\n" +
                    "**Early Warning Signs of Heart Issues:**\n" +
                    "• Chest tightness, fullness, or squeezing pressure (angina)\n" +
                    "• Shortness of breath during mild exertion\n" +
                    "• Palpitations (irregular or pounding heartbeats)\n" +
                    "• Pain radiating to left arm, neck, jaw, or upper back\n\n" +
                    "**Key Preventive Measures:**\n" +
                    "• Keep LDL cholesterol below 100 mg/dL (or <70 mg/dL for high-risk patients)\n" +
                    "• Control blood pressure and blood glucose levels\n" +
                    "• Avoid all tobacco products and limit saturated fats\n\n" +
                    "*Note: For severe central chest pain radiating to arm or jaw with cold sweats, call emergency 108 immediately.*";
        }

        // 4. Diagnostic Tests (MRI, CT, CBC, Ultrasound, ECG)
        if (lower.contains("mri") || lower.contains("ct scan") || lower.contains("ultrasound") ||
            lower.contains("cbc") || lower.contains("test") || lower.contains("lipid profile") || lower.contains("जांच")) {
            return "### 🔬 Medical Diagnostic Tests & Clinical Indications:\n\n" +
                    "• **CBC (Complete Blood Count):** Evaluates red blood cells, white blood cells, and platelets. Used to detect anemia, infections, and clotting disorders.\n" +
                    "• **Lipid Profile:** Measures Total Cholesterol, HDL ('good'), LDL ('bad'), and Triglycerides to evaluate cardiovascular risk.\n" +
                    "• **ECG / EKG (Electrocardiogram):** Records the electrical signals of the heart to diagnose arrhythmias, ischemia, and previous infarctions.\n" +
                    "• **MRI (Magnetic Resonance Imaging):** Uses magnetic fields and radio waves to generate detailed imaging of soft tissues, brain, spine, and joints without radiation.\n" +
                    "• **CT Scan (Computed Tomography):** Detailed cross-sectional X-ray imaging for bone fractures, internal bleeding, and chest/abdominal diagnostics.\n" +
                    "• **Ultrasound (Sonography):** High-frequency sound waves safe for imaging abdominal organs, kidneys, gallbladder, and obstetric care.";
        }

        // 5. Medicines & General Pharmacology Guidance
        if (lower.contains("medicine") || lower.contains("paracetamol") || lower.contains("antibiotic") ||
            lower.contains("painkiller") || lower.contains("ibuprofen") || lower.contains("antacid") || lower.contains("दवा")) {
            return "### 💊 General Healthcare Guidance on Common Medications:\n\n" +
                    "• **Paracetamol / Acetaminophen:** Commonly used for mild-to-moderate fever and pain. Safe when used within recommended dosage (max 3,000 mg/day in adults). Avoid excessive use to protect liver function.\n" +
                    "• **NSAIDs (e.g. Ibuprofen, Naproxen):** Reduce inflammation and pain; should be taken after meals to avoid gastric irritation. Avoid in severe kidney disease or active peptic ulcers.\n" +
                    "• **Antacids & PPIs (e.g. Omeprazole, Pantoprazole):** Reduce stomach acid for heartburn and GERD; PPIs are best taken 30 minutes before breakfast.\n" +
                    "• **Antibiotic Safety:** Antibiotics treat bacterial infections only, NOT viral colds or flu. Always complete the prescribed duration to prevent antimicrobial resistance.\n\n" +
                    "*Clinical Rule: QuickCare AI does not prescribe specific prescription dosages. Consult a licensed physician for tailored pharmacological regimens.*";
        }

        // 6. First Aid Basics
        if (lower.contains("first aid") || lower.contains("burn") || lower.contains("sprain") ||
            lower.contains("choking") || lower.contains("nosebleed") || lower.contains("प्राथमिक उपचार")) {
            return "### 🩹 Essential First Aid Guidance:\n\n" +
                    "• **Minor Burns:** Immediately run cool (not ice cold) tap water over the burn for 10–15 minutes. Do not apply ice, butter, or oil. Cover with a sterile non-stick bandage.\n" +
                    "• **Sprains & Strains (R.I.C.E. Protocol):**\n" +
                    "  - **R**est the injured limb\n" +
                    "  - **I**ce application for 15-20 minutes wrapped in cloth\n" +
                    "  - **C**ompression with an elastic bandage\n" +
                    "  - **E**levation above heart level\n" +
                    "• **Nosebleeds:** Sit upright and lean slightly forward. Pinch the soft part of your nose firmly for 10 minutes. Breathe through your mouth. Do not tilt your head back.\n" +
                    "• **Choking:** If the person cannot speak or cough, perform the Heimlich maneuver (abdominal thrusts) or seek urgent help immediately.";
        }

        // 7. Mental Health, Anxiety & Sleep
        if (lower.contains("anxiety") || lower.contains("depression") || lower.contains("stress") ||
            lower.contains("insomnia") || lower.contains("sleep") || lower.contains("तनाव")) {
            return "### 🧠 Mental Wellness, Stress & Sleep Support:\n\n" +
                    "**Managing Daily Anxiety & Stress:**\n" +
                    "• Practice **Box Breathing:** Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds.\n" +
                    "• Engage in regular physical activity to stimulate endorphin release.\n" +
                    "• Connect with supportive family, friends, or a counselor.\n\n" +
                    "**Sleep Hygiene Protocol:**\n" +
                    "• Maintain a consistent sleep-wake schedule, including weekends.\n" +
                    "• Avoid blue-light screens (smartphones, laptops) 60 minutes before bedtime.\n" +
                    "• Keep the bedroom dark, quiet, and cool.\n" +
                    "• Limit caffeine after 2:00 PM.";
        }

        return null;
    }

    private String callGeminiApi(String message, String lang, SpecializationInfo specInfo, List<Doctor> matchingDoctors, String convId) {
        try {
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            String systemPrompt;
            if (specInfo != null && matchingDoctors.isEmpty()) {
                systemPrompt = "You are QuickCare AI Medical Assistant. " +
                        "The user asked about a condition related to " + specInfo.getSpecialistTitle() + ". " +
                        "CRITICAL REQUIREMENT: Quick Care Hospital DOES NOT have a " + specInfo.getSpecialistTitle() + " on staff. " +
                        "Explain the medical condition in an informative, empathetic way, BUT YOU MUST CONCLUDE WITH THIS EXACT MANDATORY STATEMENT: " +
                        "'Currently, we do not have a doctor specializing in this condition. Please check again later or consult an appropriate healthcare provider.' " +
                        "NEVER recommend an unrelated doctor or general physician. DO NOT provide a definitive diagnosis or prescribe medications.";
            } else if (specInfo != null && !matchingDoctors.isEmpty()) {
                String docNames = matchingDoctors.stream().map(Doctor::getFullName).collect(Collectors.joining(", "));
                systemPrompt = "You are QuickCare AI Medical Assistant. " +
                        "Provide a helpful, structured conversational answer. " +
                        "Quick Care Hospital has the following verified specialist(s) in this exact field: " + docNames + ". " +
                        "Recommend ONLY these verified specialists. DO NOT prescribe prescription dosages or make definitive diagnoses.";
            } else {
                systemPrompt = "You are QuickCare AI Medical Assistant, a friendly, professional clinical chatbot for a healthcare appointment platform. " +
                        "Answer patient queries about diseases, symptoms, diagnostic tests, medications, diet, and lifestyle with clear, structured markdown. " +
                        "Always include appropriate disclaimers and advise emergency services (108) for critical symptoms.";
            }

            Map<String, Object> body = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();

            // Add previous context if available
            List<Map<String, String>> history = conversationHistories.get(convId);
            if (history != null && history.size() > 1) {
                for (int i = Math.max(0, history.size() - 4); i < history.size() - 1; i++) {
                    Map<String, String> h = history.get(i);
                    contents.add(Map.of(
                            "role", "user".equals(h.get("role")) ? "user" : "model",
                            "parts", List.of(Map.of("text", h.get("content")))
                    ));
                }
            }

            // Current prompt
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", systemPrompt + "\n\nUser Question (" + lang + "): " + message))
            ));
            body.put("contents", contents);

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
                            if (specInfo != null && matchingDoctors.isEmpty() && !resText.contains("do not have a doctor specializing")) {
                                resText += "\n\nCurrently, we do not have a doctor specializing in this condition. Please check again later or consult an appropriate healthcare provider.";
                            }
                            return resText;
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("External AI call failed: {}. Falling back to clinical rules triaging.", e.getMessage());
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
            return "⚠️ MEDICAL EMERGENCY WARNING: The symptoms described may indicate an urgent or life-threatening medical emergency. Please immediately call emergency services (108 / 911 / 112) or proceed to the nearest emergency casualty hospital!";
        }
    }

    private String getEmergencyReply(String lang) {
        if ("hi".equalsIgnoreCase(lang)) {
            return "कृपया तुरंत आपातकालीन सहायता प्राप्त करें। किसी भी ऑनलाइन चैट पर निर्भर न रहें और तुरंत नजदीकी अस्पताल के आपातकालीन कक्ष (Casualty) में जाएं या 108 पर कॉल करें।";
        } else if ("mr".equalsIgnoreCase(lang)) {
            return "कृपया त्वरित वैद्यकीय मदत घ्या. ऑनलाइन चॅटवर अवलंबून न राहता ताबडतोब नजीकच्या हॉस्पिटलच्या इमर्जन्सी वॉर्डमध्ये जा किंवा 108 वर कॉल करा.";
        } else {
            return "Please seek immediate emergency medical care. Do not wait for an online appointment. Call an ambulance (108 / 112) or proceed to the nearest emergency casualty ward immediately.";
        }
    }
}
