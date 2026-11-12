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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);

    public static final String MANDATORY_MEDICAL_DISCLAIMER =
            "⚕️ **Important Medical Advice:** The information provided by Quick Care AI is for educational and informational purposes only. It is not a substitute for professional medical diagnosis, advice, or treatment. If you are experiencing persistent symptoms, worsening health problems, or have any concerns about your health, please consult a qualified doctor. Do not ignore serious symptoms or delay seeking medical attention.";

    public static final String UNAVAILABLE_SPECIALTY_NOTICE =
            "Sorry, currently we don't have a doctor available for this medical specialty. Please consult a qualified healthcare provider outside Quick Care.";

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
            "chest pain", "crushing chest", "pressure in chest", "tightness in chest", "heart attack",
            "can't breathe", "cannot breathe", "difficulty breathing", "shortness of breath", "gasping for air",
            "stroke", "facial drooping", "face drooping", "arm weakness", "slurred speech", "paralysis", "sudden numbness",
            "unconscious", "unconsciousness", "passed out", "fainted", "fainting", "unresponsive", "collapsed",
            "severe bleeding", "heavy bleeding", "coughing blood", "vomiting blood", "hemorrhage",
            "seizure", "seizures", "convulsion", "convulsions", "fits", "epileptic fit",
            "anaphylaxis", "severe allergic reaction", "swollen tongue", "swelling of throat", "closing throat",
            "poisoning", "swallowed poison", "suicide", "overdose", "severe head injury",
            "छाती में दर्द", "सांस लेने में तकलीफ", "सांस नहीं आ रही", "बेहोश", "दौरा", "लकवा", "खून की उल्टी",
            "छातीत दुखणे", "श्वास घेण्यास त्रास", "मेंदूचा झटका", "रक्तस्त्राव"
    );

    public static class SpecializationInfo {
        private final String specialization;
        private final String specialistTitle;
        private final boolean availableAtQuickCare;

        public SpecializationInfo(String specialization, String specialistTitle, boolean availableAtQuickCare) {
            this.specialization = specialization;
            this.specialistTitle = specialistTitle;
            this.availableAtQuickCare = availableAtQuickCare;
        }

        public String getSpecialization() { return specialization; }
        public String getSpecialistTitle() { return specialistTitle; }
        public boolean isAvailableAtQuickCare() { return availableAtQuickCare; }
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

        // 1. Critical Emergency Check (Requirement 5)
        boolean isEmergency = checkEmergency(msg);
        response.setEmergency(isEmergency);

        if (isEmergency) {
            String emergencyWarning = "🚨 **CRITICAL MEDICAL EMERGENCY WARNING:** The symptoms described (such as severe chest pain, breathing difficulty, stroke signs, severe bleeding, or unconsciousness) indicate a potentially life-threatening emergency. In India, please immediately call **112** or **108** for emergency ambulance services or proceed to the nearest emergency department / casualty ward immediately. Do not delay seeking urgent in-person medical care.";
            String emergencyReply = "🚨 **CRITICAL MEDICAL EMERGENCY DETECTED**\n\nThe symptoms you have described indicate a potentially life-threatening medical emergency.\n\n• **Immediate Action Required:** Call **112** or **108** in India immediately for an emergency ambulance.\n• **Go to Casualty:** Proceed to the nearest hospital Emergency Room / Casualty Department right away.\n• **Do Not Wait:** Do not wait for an online appointment or rely on self-care remedies.\n• Have someone stay with you until emergency medical professionals arrive.";

            response.setEmergencyDisclaimer(emergencyWarning);
            response.setReply(emergencyReply);
            response.setRecommendedDoctors(Collections.emptyList());
            response.setSpecialistAvailable(false);
            recordHistory(convId, "assistant", emergencyReply);
            return response;
        }

        // 2. Check if user is inquiring about available doctors on our website
        boolean isDoctorInquiry = isGeneralDoctorInquiry(msg);

        // 3. Identify medical specialization from query or symptoms (Requirement 6)
        SpecializationInfo specInfo = detectSpecializationInfo(msg);
        String suggestedSpecialization = specInfo != null ? specInfo.getSpecialization() : null;

        // 4. Strict Doctor Specialization Matching from Database (Requirement 6)
        List<Doctor> matchingDoctors = new ArrayList<>();
        boolean specialistAvailable = false;
        List<String> unavailableReasons = null;

        if (specInfo != null && specInfo.isAvailableAtQuickCare()) {
            List<Doctor> verified = db.findVerifiedDoctors();
            if (verified != null) {
                for (Doctor d : verified) {
                    if (d != null && isSpecializationMatch(d, suggestedSpecialization)) {
                        matchingDoctors.add(d);
                        if (matchingDoctors.size() >= 3) {
                            break;
                        }
                    }
                }
            }
            specialistAvailable = !matchingDoctors.isEmpty();
        } else if (specInfo != null && !specInfo.isAvailableAtQuickCare()) {
            specialistAvailable = false;
            unavailableReasons = generateUnavailableReasons(specInfo.getSpecialization(), specInfo.getSpecialistTitle());
        } else if (isDoctorInquiry) {
            List<Doctor> verified = db.findVerifiedDoctors();
            if (verified != null) {
                for (Doctor d : verified) {
                    if (d != null) {
                        matchingDoctors.add(d);
                    }
                }
            }
            specialistAvailable = !matchingDoctors.isEmpty();
            suggestedSpecialization = "All Departments";
        }

        response.setSuggestedSpecialization(suggestedSpecialization);
        response.setRecommendedDoctors(matchingDoctors);
        response.setSpecialistAvailable(specialistAvailable);
        response.setUnavailableReasons(unavailableReasons);

        // 5. Generate comprehensive intelligent medical response
        String replyText = null;

        if (isDoctorInquiry && specInfo == null) {
            replyText = generateWebsiteDoctorsResponse(matchingDoctors);
        } else if (apiKey != null && !apiKey.trim().isEmpty()) {
            replyText = callGeminiApi(msg, lang, specInfo, matchingDoctors, convId);
        }

        // If API key is absent, offline, or returns null, use clinical knowledge engine
        if (replyText == null || replyText.trim().isEmpty()) {
            replyText = generateComprehensiveMedicalResponse(msg, lang, specInfo, matchingDoctors);
        }

        // 6. Ensure Mandatory Medical Disclaimer is attached to EVERY medical response (Requirement 4)
        if (!replyText.contains("Important Medical Advice")) {
            replyText = replyText.trim() + "\n\n---\n\n" + MANDATORY_MEDICAL_DISCLAIMER;
        }

        response.setReply(replyText);
        recordHistory(convId, "assistant", replyText);
        return response;
    }

    private void recordHistory(String convId, String role, String content) {
        conversationHistories.computeIfAbsent(convId, k -> new ArrayList<>())
                .add(Map.of("role", role, "content", content));
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

    private boolean isGeneralDoctorInquiry(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return lower.contains("available in our website") ||
               lower.contains("available on our website") ||
               lower.contains("available on website") ||
               lower.contains("doctors on website") ||
               lower.contains("doctors on your website") ||
               lower.contains("doctors available") ||
               lower.contains("doctor available") ||
               lower.contains("available doctor") ||
               lower.contains("which doctor") ||
               lower.contains("suggest doctor") ||
               lower.contains("suggest a doctor") ||
               lower.contains("recommend doctor") ||
               lower.contains("recommend a doctor") ||
               lower.contains("show doctor") ||
               lower.contains("list of doctor") ||
               lower.contains("list doctor") ||
               lower.contains("who are the doctor") ||
               lower.contains("who is the doctor") ||
               lower.contains("all doctor");
    }

    public List<String> generateUnavailableReasons(String specialization, String specialistTitle) {
        List<String> reasons = new ArrayList<>();
        reasons.add("Panel Onboarding in Progress: Quick Care currently features verified specialists in Cardiology, Dermatology, Pediatrics, and Orthopedics. Board-certified specialists in " + specialization + " are currently undergoing clinical credentialing, MCI/NMC verification, and digital onboarding before joining our website.");
        reasons.add("In-Person Diagnostic Safety Requirements: Medical conditions in " + specialization + " typically require hands-on physical clinical examinations, diagnostic imaging (such as MRI, CT scans, ultrasound, or endoscopy), or comprehensive blood laboratory tests that cannot be performed safely via telemedicine alone.");
        reasons.add("NMC Telemedicine Prescription Guidelines: Under National Medical Commission (NMC) regulations, specific controlled, high-potency, or acute medications for " + specialization + " cannot be initiated through an online consultation without prior in-person physical clinical evaluation.");
        reasons.add("Specialist Shifts & Daily Capacity: Any affiliated visiting hospital consultants may currently be off-duty, attending emergency surgical procedures, or all daily 15-minute consultation slots may be fully booked.");
        return reasons;
    }

    private String generateWebsiteDoctorsResponse(List<Doctor> doctors) {
        StringBuilder sb = new StringBuilder();
        sb.append("### 🏥 Verified Doctors Available on Quick Care Website:\n\n");
        sb.append("Welcome to Quick Care! We have verified, board-certified specialists ready to assist you through **24/7 Live Video Consultations** and **In-Clinic Visits** with real-time 15-minute slot scheduling:\n\n");

        if (doctors != null && !doctors.isEmpty()) {
            for (Doctor d : doctors) {
                if (d != null) {
                    String name = d.getFullName() != null ? d.getFullName() : "Doctor";
                    if (!name.startsWith("Dr.")) name = "Dr. " + name;
                    sb.append("• **").append(name).append("** — **").append(d.getSpecialization()).append("**\n")
                      .append("   - Qualifications: ").append(d.getQualification() != null ? d.getQualification() : "Specialist")
                      .append(" (").append(d.getExperience()).append("+ years experience)\n")
                      .append("   - Consultation Fee: ₹").append(Math.round(d.getConsultationFee())).append("\n")
                      .append("   - Availability: 24/7 Video Consultation & In-Clinic Appointments\n\n");
                }
            }
        } else {
            sb.append("• **Dr. Priya Deshmukh** — Cardiology (Heart & BP Specialist, Fee: ₹800)\n");
            sb.append("• **Dr. Rajesh Kulkarni** — Dermatology (Skin & Hair Specialist, Fee: ₹600)\n");
            sb.append("• **Dr. Ananya Roy** — Pediatrics (Child & Infant Health, Fee: ₹500)\n");
            sb.append("• **Dr. Vikram Joshi** — Orthopedics (Joint & Spine Specialist, Fee: ₹900)\n\n");
        }

        sb.append("You can review any doctor's profile below and click **Book** to reserve an immediate 24/7 video consultation or select an available future 15-minute time slot.\n");
        return sb.toString();
    }

    public SpecializationInfo detectSpecializationInfo(String text) {
        String lower = text.toLowerCase();

        // 1. Cardiology (Heart & Vascular) - Available in Quick Care
        if (lower.contains("cardio") || lower.contains("heart") || lower.contains("chest") ||
                lower.contains("coronary") || lower.contains("angina") || lower.contains("palpitation") ||
                lower.contains("blood pressure") || lower.contains("bp") || lower.contains("hypertension") ||
                lower.contains("cholesterol") || lower.contains("ecg") || lower.contains("arrhythmia") ||
                lower.contains("हृदय") || lower.contains("रक्तदाब") || lower.contains("दिल")) {
            return new SpecializationInfo("Cardiology", "Cardiologist", true);
        }

        // 2. Dermatology (Skin, Hair, Nails) - Available in Quick Care
        if (lower.contains("dermat") || lower.contains("skin") || lower.contains("rash") ||
                lower.contains("acne") || lower.contains("pimple") || lower.contains("eczema") ||
                lower.contains("psoriasis") || lower.contains("itching") || lower.contains("hives") ||
                lower.contains("urticaria") || lower.contains("ringworm") || lower.contains("fungal") ||
                lower.contains("hair loss") || lower.contains("alopecia") || lower.contains("scabies") ||
                lower.contains("त्वचा") || lower.contains("खुजली") || lower.contains("खाज")) {
            return new SpecializationInfo("Dermatology", "Dermatologist", true);
        }

        // 3. Pediatrics (Children & Infants) - Available in Quick Care
        if (lower.contains("pediat") || lower.contains("paediat") || lower.contains("child") ||
                lower.contains("children") || lower.contains("baby") || lower.contains("infant") ||
                lower.contains("kid") || lower.contains("colic") || lower.contains("teething") ||
                lower.contains("बच्चा") || lower.contains("बाळ")) {
            return new SpecializationInfo("Pediatrics", "Pediatrician", true);
        }

        // 4. Orthopedics (Bones, Joints, Spine) - Available in Quick Care
        if (lower.contains("ortho") || lower.contains("bone") || lower.contains("joint") ||
                lower.contains("fracture") || lower.contains("back pain") || lower.contains("knee") ||
                lower.contains("spine") || lower.contains("arthritis") || lower.contains("spondylosis") ||
                lower.contains("sciatica") || lower.contains("sprain") || lower.contains("ligament") ||
                lower.contains("हड्डी") || lower.contains("जोड़") || lower.contains("सांधेदुखी")) {
            return new SpecializationInfo("Orthopedics", "Orthopedic Surgeon", true);
        }

        // 5. Neurology - NOT available in Quick Care
        if (lower.contains("neuro") || lower.contains("brain") || lower.contains("migraine") ||
                lower.contains("epilepsy") || lower.contains("seizure") || lower.contains("vertigo") ||
                lower.contains("parkinson") || lower.contains("alzheimer") || lower.contains("neuropathy") ||
                lower.contains("मेंदू") || lower.contains("दिमाग")) {
            return new SpecializationInfo("Neurology", "Neurologist", false);
        }

        // 6. Gastroenterology - NOT available in Quick Care
        if (lower.contains("gastro") || lower.contains("stomach") || lower.contains("liver") ||
                lower.contains("acid reflux") || lower.contains("gerd") || lower.contains("gastritis") ||
                lower.contains("ulcer") || lower.contains("ibs") || lower.contains("gallstone") ||
                lower.contains("constipation") || lower.contains("diarrhea") || lower.contains("piles") ||
                lower.contains("पेट") || lower.contains("लिवर") || lower.contains("पोट")) {
            return new SpecializationInfo("Gastroenterology", "Gastroenterologist", false);
        }

        // 7. Pulmonology - NOT available in Quick Care
        if (lower.contains("pulmon") || lower.contains("lung") || lower.contains("asthma") ||
                lower.contains("copd") || lower.contains("bronchitis") || lower.contains("pneumonia") ||
                lower.contains("wheezing") || lower.contains("tuberculosis") || lower.contains("tb") ||
                lower.contains("फेफड़े") || lower.contains("दमा")) {
            return new SpecializationInfo("Pulmonology", "Pulmonologist", false);
        }

        // 8. Endocrinology - NOT available in Quick Care
        if (lower.contains("endocrin") || lower.contains("diabetes") || lower.contains("thyroid") ||
                lower.contains("sugar") || lower.contains("glucose") || lower.contains("मधुमेह")) {
            return new SpecializationInfo("Endocrinology", "Endocrinologist", false);
        }

        // 9. Psychiatry - NOT available in Quick Care
        if (lower.contains("psychiat") || lower.contains("mental health") || lower.contains("depression") ||
                lower.contains("anxiety") || lower.contains("panic") || lower.contains("insomnia") ||
                lower.contains("तनाव") || lower.contains("चिंता")) {
            return new SpecializationInfo("Psychiatry", "Psychiatrist", false);
        }

        // 10. Gynecology - NOT available in Quick Care
        if (lower.contains("gynec") || lower.contains("gynaec") || lower.contains("pcos") ||
                lower.contains("pcod") || lower.contains("period") || lower.contains("menstrual") ||
                lower.contains("pregnancy") || lower.contains("menopause")) {
            return new SpecializationInfo("Gynecology & Obstetrics", "Gynecologist", false);
        }

        // 11. Nephrology & Urology - NOT available in Quick Care
        if (lower.contains("nephro") || lower.contains("kidney") || lower.contains("renal") ||
                lower.contains("urolog") || lower.contains("prostate") || lower.contains("uti") ||
                lower.contains("गुर्दा") || lower.contains("किडनी")) {
            return new SpecializationInfo("Nephrology & Urology", "Nephrologist / Urologist", false);
        }

        // 12. General Medicine (Dengue, Malaria, Typhoid, Viral Fever, Cold) - NOT available in Quick Care
        if (lower.contains("dengue") || lower.contains("malaria") || lower.contains("typhoid") ||
                lower.contains("fever") || lower.contains("cold") || lower.contains("flu") ||
                lower.contains("cough") || lower.contains("infection") || lower.contains("बुखार") || lower.contains("ताप")) {
            return new SpecializationInfo("General Medicine", "General Physician / Infectious Disease Specialist", false);
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

        return false;
    }

    private String generateComprehensiveMedicalResponse(String msg, String lang, SpecializationInfo specInfo, List<Doctor> doctors) {
        String lower = msg.toLowerCase().trim();

        // Retrieve structured 8-point medical clinical profile
        MedicalProfile profile = getMedicalProfile(lower);

        StringBuilder sb = new StringBuilder();
        sb.append("### 🩺 Clinical Overview: ").append(profile.condition).append("\n\n");
        sb.append("**1. Understanding the Condition:**\n").append(profile.explanation).append("\n\n");
        sb.append("**2. Common Symptoms:**\n").append(profile.symptoms).append("\n\n");
        sb.append("**3. Possible Causes & Risk Factors:**\n").append(profile.causes).append("\n\n");
        sb.append("**4. How It Affects the Body:**\n").append(profile.bodyEffects).append("\n\n");
        sb.append("**5. General Prevention Methods:**\n").append(profile.prevention).append("\n\n");
        sb.append("**6. Common Treatment Approaches:**\n").append(profile.treatment).append("\n\n");
        sb.append("**7. Lifestyle & Dietary Precautions:**\n").append(profile.precautions).append("\n\n");
        sb.append("**8. When Medical Attention is Necessary:**\n").append(profile.whenToSeekCare).append("\n\n");

        sb.append("---\n### 👨‍⚕️ Specialist Consultation Recommendation:\n");
        if (specInfo != null) {
            if (specInfo.isAvailableAtQuickCare() && !doctors.isEmpty()) {
                List<String> docLines = new ArrayList<>();
                for (Doctor d : doctors) {
                    if (d != null) {
                        String name = d.getFullName() != null ? d.getFullName() : "Specialist";
                        String prefix = name.startsWith("Dr.") ? "" : "Dr. ";
                        String spec = d.getSpecialization() != null ? d.getSpecialization() : "";
                        String qual = d.getQualification() != null ? d.getQualification() : "Specialist";
                        docLines.add("• **" + prefix + name + "** — " + spec + " (" + qual + ", Fee: ₹" + Math.round(d.getConsultationFee()) + ")");
                    }
                }
                String docList = String.join("\n", docLines);

                sb.append("For this condition, we recommend consulting our verified specialist in **").append(specInfo.getSpecialization()).append("**.\n\n")
                  .append("**Available Specialist(s) on Quick Care Website:**\n")
                  .append(docList).append("\n\n")
                  .append("You can review their profile, check their 24/7 video availability or dynamic 15-minute slots, and book a confirmed appointment using the doctor card below.\n");
            } else {
                sb.append("Relevant Medical Specialty: **").append(specInfo.getSpecialization()).append("** (").append(specInfo.getSpecialistTitle()).append(")\n\n")
                  .append("❌ **Specialist Not Currently Available on Quick Care Website:**\n")
                  .append("Sorry, currently we do not have an active doctor available for this medical specialty on our platform.\n\n")
                  .append("**Why is a specialist not currently available on our website?**\n")
                  .append("1. **Panel Verification in Progress:** Quick Care currently specializes in **Cardiology**, **Dermatology**, **Pediatrics**, and **Orthopedics**. Board-certified specialists in **").append(specInfo.getSpecialization()).append("** are currently undergoing credentialing, MCI/NMC verification, and digital onboarding before joining our platform.\n")
                  .append("2. **In-Person Diagnostic Safety Requirements:** Medical conditions in ").append(specInfo.getSpecialization()).append(" typically require hands-on physical clinical examinations, diagnostic imaging (such as MRI, CT scans, ultrasound, or endoscopy), or comprehensive blood work that cannot be performed safely via telemedicine alone.\n")
                  .append("3. **NMC Telemedicine Prescription Guidelines:** Indian Telemedicine Practice Guidelines restrict online prescribing of specific controlled, high-potency, or acute medications for this condition without prior in-person physical clinical evaluation.\n")
                  .append("4. **Specialist Shifts & Daily Capacity:** Any affiliated visiting consultants may currently be off-duty, attending emergency hospital procedures, or all daily appointment slots may be fully booked.\n\n")
                  .append("**Recommended Next Steps:**\n")
                  .append("• We strongly advise consulting a qualified in-person **").append(specInfo.getSpecialistTitle()).append("** at a local hospital or specialty clinic near you.\n")
                  .append("• In the meantime, if you have any questions or symptoms related to our active specialties (**Cardiology**, **Dermatology**, **Pediatrics**, or **Orthopedics**), our verified doctors are available on our website for 24/7 video or in-clinic booking.\n");
            }
        } else {
            sb.append("If your symptoms are persistent or concerning, please consult a qualified healthcare provider for an in-person medical evaluation.\n");
        }

        return sb.toString();
    }

    private static class MedicalProfile {
        String condition;
        String explanation;
        String symptoms;
        String causes;
        String bodyEffects;
        String prevention;
        String treatment;
        String precautions;
        String whenToSeekCare;
    }

    private MedicalProfile getMedicalProfile(String lower) {
        MedicalProfile p = new MedicalProfile();

        // 1. DENGUE
        if (lower.contains("dengue") || lower.contains("platelet")) {
            p.condition = "Dengue Fever";
            p.explanation = "Dengue is a mosquito-borne viral infection caused by the dengue virus and transmitted to humans through the bites of infected female Aedes aegypti mosquitoes. It is common in tropical and subtropical regions.";
            p.symptoms = "Sudden high fever (up to 104°F / 40°C), retro-orbital eye pain (pain behind the eyes), intense joint and muscle pain ('breakbone fever'), fatigue, nausea, vomiting, and a flat red skin rash.";
            p.causes = "Infection by the dengue virus transmitted by day-biting Aedes mosquitoes. Mosquitoes breed in stagnant clean water stored in open tanks, flower pots, tires, and coolers.";
            p.bodyEffects = "The virus infects white blood cells and temporarily suppresses bone marrow function, causing a rapid decrease in blood platelet count (thrombocytopenia) and increased capillary permeability.";
            p.prevention = "Eliminate standing water in and around homes. Apply DEET/picaridin mosquito repellents, wear long sleeves, install window screens, and use bed nets.";
            p.treatment = "Supportive care: complete bed rest, adequate hydration with oral rehydration salts (ORS), and paracetamol for fever. Avoid Aspirin, Ibuprofen, and other NSAIDs as they increase bleeding risks.";
            p.precautions = "Monitor platelet counts and hematocrit via regular CBC tests every 24–48 hours. Drink coconut water, clear soups, and fresh juices. Avoid dark-colored foods that might mimic internal bleeding.";
            p.whenToSeekCare = "Seek emergency hospital admission immediately if warning signs develop: severe continuous abdominal pain, persistent vomiting, bleeding gums or nose, blood in stool, or extreme fatigue.";
            return p;
        }

        // 2. MALARIA
        if (lower.contains("malaria") || lower.contains("plasmodium")) {
            p.condition = "Malaria";
            p.explanation = "Malaria is a serious, life-threatening infection caused by microscopic Plasmodium parasites transmitted to humans through the bites of infected female Anopheles mosquitoes.";
            p.symptoms = "Recurrent cycles of severe shivering chills (rigors) followed by high fever, intense sweating, headache, body aches, nausea, vomiting, and mild jaundice.";
            p.causes = "Infection by Plasmodium parasites (P. falciparum, P. vivax, P. malariae, P. ovale) transmitted by night-biting Anopheles mosquitoes.";
            p.bodyEffects = "Parasites invade liver cells, multiply, and subsequently enter and rupture red blood cells, causing acute anemia, spleen enlargement, and microvascular blockages.";
            p.prevention = "Sleep under insecticide-treated bed nets (ITNs), use indoor mosquito sprays, clear open puddles and drainage channels, and take preventive antimalarial medications if traveling to endemic areas.";
            p.treatment = "Prescription antimalarial therapies such as Artemisinin-based Combination Therapy (ACT) or chloroquine, prescribed by a doctor after blood smear or rapid diagnostic test (RDT) confirmation.";
            p.precautions = "Do not take antimalarial medications without confirmed laboratory testing. Ensure complete hydration and rest during recovery.";
            p.whenToSeekCare = "Consult a physician promptly upon experiencing shivering chills and fever. Seek emergency medical care for disorientation, difficulty breathing, yellow skin/eyes, or dark urine.";
            return p;
        }

        // 3. TYPHOID
        if (lower.contains("typhoid") || lower.contains("enteric fever") || lower.contains("salmonella")) {
            p.condition = "Typhoid Fever";
            p.explanation = "Typhoid fever is an acute systemic bacterial infection caused by Salmonella enterica serotype Typhi. It is primarily contracted through contaminated drinking water and unhygienic food.";
            p.symptoms = "Prolonged high fever rising in a 'step-ladder' pattern, persistent dull headache, generalized weakness, stomach pain, loss of appetite, constipation or diarrhea, and faint rose-colored chest spots.";
            p.causes = "Ingestion of water or food contaminated with feces or urine from an infected individual or carrier, typically due to poor sanitation and hand hygiene.";
            p.bodyEffects = "Bacteria penetrate the small intestine lining, multiply in the bloodstream, and spread to the liver, spleen, and gallbladder, carrying risks of intestinal bleeding or perforation if untreated.";
            p.prevention = "Drink clean, boiled or purified water. Avoid raw street food and unpeeled fruits. Wash hands thoroughly before eating. Consider typhoid vaccination.";
            p.treatment = "Prescription antibiotics (such as azithromycin, cefixime, or ceftriaxone) targeted by a doctor after Widal test or blood culture confirmation.";
            p.precautions = "Complete the entire antibiotic course even if fever abates. Consume soft, easily digestible foods (khichdi, porridge, boiled vegetables) and avoid oily, spicy, high-fiber meals.";
            p.whenToSeekCare = "Consult a physician if fever lasts beyond 3 days. Seek emergency medical attention immediately for severe sharp abdominal pain, blood in stool, or delirium.";
            return p;
        }

        // 4. DIABETES
        if (lower.contains("diabet") || lower.contains("blood sugar") || lower.contains("glucose") || lower.contains("insulin") || lower.contains("hba1c") || lower.contains("मधुमेह")) {
            p.condition = "Diabetes Mellitus";
            p.explanation = "Diabetes is a chronic metabolic condition where the body either cannot produce sufficient insulin (Type 1) or cannot effectively utilize the insulin it produces (Type 2), leading to elevated blood glucose levels.";
            p.symptoms = "Excessive thirst (polydipsia), frequent urination (polyuria), constant hunger, unexplained weight loss, chronic fatigue, blurred vision, slow wound healing, and recurrent infections.";
            p.causes = "Type 1 is an autoimmune destruction of pancreatic beta cells. Type 2 is driven by insulin resistance linked to genetic factors, obesity, physical inactivity, and poor diet.";
            p.bodyEffects = "Chronic high blood sugar damages blood vessels and nerves throughout the body, leading to diabetic retinopathy (eyes), nephropathy (kidneys), neuropathy (nerves), and cardiovascular disease.";
            p.prevention = "For Type 2: maintain a healthy weight, perform 150 minutes of weekly moderate aerobic exercise, consume fiber-rich whole foods, and avoid refined sugars and processed foods.";
            p.treatment = "Type 1 requires lifelong daily insulin injections. Type 2 is managed with lifestyle modifications, oral antidiabetic drugs (e.g. metformin), GLP-1 receptor agonists, or supplemental insulin under medical guidance.";
            p.precautions = "Regularly test fasting glucose, post-prandial glucose, and HbA1c (target <7% for most adults). Inspect feet daily for cuts or blisters. Keep glucose tablets accessible for hypoglycemia (<70 mg/dL).";
            p.whenToSeekCare = "Consult an endocrinologist or physician for routine management. Seek immediate emergency care for symptoms of diabetic ketoacidosis: fruity breath, rapid deep breathing, persistent vomiting, or confusion.";
            return p;
        }

        // 5. HYPERTENSION / BLOOD PRESSURE
        if (lower.contains("hypertension") || lower.contains("high bp") || lower.contains("blood pressure") || lower.contains("bp") || lower.contains("रक्तदाब") || lower.contains("रक्तचाप")) {
            p.condition = "Hypertension (High Blood Pressure)";
            p.explanation = "Hypertension is a chronic cardiovascular condition in which the long-term force of blood flowing against artery walls is consistently elevated (systolic ≥130 mmHg or diastolic ≥80 mmHg).";
            p.symptoms = "Often asymptomatic for years ('silent killer'). Severe elevation can cause morning headaches, dizziness, nosebleeds, blurred vision, shortness of breath, and chest palpitations.";
            p.causes = "Primary hypertension is linked to genetic predisposition, high dietary salt, sedentary lifestyle, obesity, chronic stress, and age. Secondary hypertension arises from kidney disorders or endocrine conditions.";
            p.bodyEffects = "Stiffens and damages arterial walls, forcing the heart to work harder. Over time, it increases risks of heart attack, stroke, kidney failure, and vision loss.";
            p.prevention = "Adopt the DASH diet, limit sodium intake to under 2,000 mg/day (less than one teaspoon of salt), exercise regularly, stop smoking, manage stress, and limit alcohol.";
            p.treatment = "Antihypertensive medications (ACE inhibitors, ARBs, Calcium Channel Blockers, diuretics) prescribed and adjusted by a doctor in combination with lifestyle changes.";
            p.precautions = "Monitor blood pressure regularly at home with a validated digital monitor. Never stop or reduce prescribed blood pressure medications abruptly without consulting your doctor.";
            p.whenToSeekCare = "Seek emergency medical care immediately if blood pressure exceeds 180/120 mmHg, or if high blood pressure is accompanied by chest pain, shortness of breath, back pain, or vision/speech changes.";
            return p;
        }

        // 6. ASTHMA
        if (lower.contains("asthma") || lower.contains("wheez") || lower.contains("bronchitis") || lower.contains("दमा")) {
            p.condition = "Bronchial Asthma";
            p.explanation = "Asthma is a chronic inflammatory disorder of the airways (bronchial tubes) that causes them to swell, narrow, and produce excess mucus in response to various triggers.";
            p.symptoms = "Recurrent episodes of wheezing (whistling sound when breathing out), dry or chesty cough (worse at night and early morning), shortness of breath, and chest tightness.";
            p.causes = "Genetic predisposition combined with environmental triggers: dust mites, pet dander, pollen, smoke, air pollution, cold air, exercise, or viral respiratory infections.";
            p.bodyEffects = "Chronic airway inflammation leads to bronchial hyper-responsiveness, bronchospasm, mucus plugging, and restricted airflow into and out of the lungs.";
            p.prevention = "Identify and avoid known environmental triggers, maintain low indoor humidity, use allergen-proof mattress covers, avoid smoking and secondhand smoke, and get an annual flu vaccine.";
            p.treatment = "Inhaled corticosteroids (daily controller inhalers) to reduce chronic airway inflammation, and short-acting beta-agonists (rescue inhalers like albuterol) for acute symptom relief.";
            p.precautions = "Always carry your prescribed rescue inhaler. Practice using an inhaler spacer device correctly. Follow your physician's written Asthma Action Plan.";
            p.whenToSeekCare = "Seek immediate emergency hospital care if rescue inhalers do not relieve symptoms, lips or fingernails turn bluish, breathing is labored, or speaking in full sentences is difficult.";
            return p;
        }

        // 7. THYROID
        if (lower.contains("thyroid") || lower.contains("hypothyroid") || lower.contains("hyperthyroid") || lower.contains("tsh")) {
            p.condition = "Thyroid Disorder (Hypothyroidism & Hyperthyroidism)";
            p.explanation = "Thyroid disorders occur when the butterfly-shaped thyroid gland produces either insufficient thyroid hormones (Hypothyroidism) or excessive thyroid hormones (Hyperthyroidism), disrupting metabolism.";
            p.symptoms = "Hypothyroidism: unexplained weight gain, chronic fatigue, cold intolerance, dry skin, hair loss, constipation, and memory fog. Hyperthyroidism: rapid weight loss, heat intolerance, heart palpitations, tremors, anxiety, and insomnia.";
            p.causes = "Autoimmune diseases (Hashimoto thyroiditis for hypothyroidism; Graves disease for hyperthyroidism), iodine deficiency, thyroiditis, or thyroid nodules.";
            p.bodyEffects = "Thyroid hormones regulate heart rate, body temperature, digestive motility, cholesterol metabolism, and energy consumption throughout the body.";
            p.prevention = "Ensure adequate dietary iodine intake using iodized table salt. Undergo regular screening if there is a family history of thyroid or autoimmune conditions.";
            p.treatment = "Hypothyroidism: daily oral synthetic thyroid hormone replacement (Levothyroxine). Hyperthyroidism: antithyroid medications (methimazole), radioactive iodine, or beta-blockers under endocrinologist guidance.";
            p.precautions = "Take levothyroxine first thing in the morning on an empty stomach with plain water, 30–60 minutes before breakfast. Get TSH and thyroid levels tested every 6–12 months.";
            p.whenToSeekCare = "Consult an endocrinologist for dosage titration. Seek urgent medical attention for high fever, rapid irregular heartbeat, or extreme agitation (thyroid storm).";
            return p;
        }

        // 8. MIGRAINE
        if (lower.contains("migraine") || (lower.contains("headache") && (lower.contains("one side") || lower.contains("nausea") || lower.contains("light")))) {
            p.condition = "Migraine Headache";
            p.explanation = "Migraine is a complex neurological disorder characterized by recurrent attacks of moderate-to-severe throbbing or pulsating head pain, commonly affecting one side of the head.";
            p.symptoms = "Intense throbbing head pain, sensitivity to light (photophobia) and sound (phonophobia), nausea, vomiting, and occasional visual aura (flashes of light or blind spots).";
            p.causes = "Neurochemical imbalances involving the trigeminal nerve and fluctuating serotonin levels. Triggers include emotional stress, irregular sleep, skipped meals, hormonal shifts, and weather changes.";
            p.bodyEffects = "Neurogenic inflammation and abnormal vascular dilation in brain coverings lead to central nervous system pain sensitization.";
            p.prevention = "Maintain consistent sleep and meal schedules, stay well-hydrated, practice stress management, limit caffeine, and identify individual dietary triggers (e.g. aged cheese, processed meats).";
            p.treatment = "Acute abortive medications (triptans, NSAIDs) taken at the earliest onset of attack, and preventive daily medications (beta-blockers, topiramate, CGRP antagonists) for frequent attacks.";
            p.precautions = "Rest in a quiet, dark, cool room during an attack with a cold pack on your forehead. Keep a headache diary to identify recurring triggers.";
            p.whenToSeekCare = "Consult a neurologist for frequent headaches. Seek emergency care immediately for sudden explosive 'thunderclap' headaches, or headache with fever, stiff neck, or weakness.";
            return p;
        }

        // 9. SKIN INFECTIONS & ALLERGIES
        if (lower.contains("eczema") || lower.contains("psoriasis") || lower.contains("skin infection") || lower.contains("acne") || lower.contains("rash") || lower.contains("fungal")) {
            p.condition = "Dermatological Condition / Skin Infection";
            p.explanation = "Skin disorders encompass inflammatory conditions (eczema, psoriasis, acne) and infectious conditions (fungal ringworm, bacterial impetigo) that compromise the skin barrier.";
            p.symptoms = "Skin redness, intense itching, flaking, peeling, scaling plaques, fluid-filled blisters, pustules/pimples, or circular ring-shaped lesions.";
            p.causes = "Immune dysregulation, compromised skin moisture barrier, bacterial overgrowth (C. acnes), dermatophyte fungal infections, or contact with allergens and irritants.";
            p.bodyEffects = "Breaks down epidermal protective barrier, promoting local inflammation, discomfort, and risks of secondary bacterial superinfections from repeated scratching.";
            p.prevention = "Moisturize skin with fragrance-free emollients, bathe in lukewarm water, avoid harsh chemical soaps, wear breathable cotton fabrics, and maintain personal hygiene.";
            p.treatment = "Targeted therapy: topical corticosteroids or calcineurin inhibitors for eczema; salicylic acid/retinoids for acne; topical/oral antifungals (clotrimazole, terbinafine) for fungal infections.";
            p.precautions = "Do not apply over-the-counter steroid creams to undiagnosed skin rashes without a dermatologist's confirmation. Avoid scratching to prevent scarring.";
            p.whenToSeekCare = "Consult a verified dermatologist for proper diagnosis. Seek urgent medical attention if a skin rash spreads rapidly, blisters extensively, or is accompanied by high fever or skin pain.";
            return p;
        }

        // 10. ACID REFLUX / GERD
        if (lower.contains("acid reflux") || lower.contains("gerd") || lower.contains("acidity") || lower.contains("gastritis") || lower.contains("heartburn")) {
            p.condition = "GERD (Acid Reflux) & Gastritis";
            p.explanation = "GERD is a chronic digestive condition where stomach acid repeatedly flows backward into the esophagus because the lower esophageal sphincter relaxes abnormally or weakens.";
            p.symptoms = "Burning pain in the chest (heartburn) usually after meals and worse when lying down, acid regurgitation (sour taste in mouth), chest discomfort, chronic dry cough, and difficulty swallowing.";
            p.causes = "Weakened lower esophageal sphincter, hiatal hernia, obesity, smoking, pregnancy, late-night eating, and trigger foods (fatty/fried foods, caffeine, chocolate, spicy items).";
            p.bodyEffects = "Acid repeatedly irritates and inflames the delicate esophageal lining (esophagitis), which over time can lead to strictures, ulcers, or cellular changes (Barrett esophagus).";
            p.prevention = "Eat smaller, frequent meals. Avoid lying down for at least 3 hours after eating. Elevate the head of your bed by 6 inches. Maintain a healthy weight and avoid tight clothing.";
            p.treatment = "Antacids for quick symptom relief, H2-receptor blockers (famotidine), or Proton Pump Inhibitors (PPIs like omeprazole, pantoprazole) prescribed by a doctor.";
            p.precautions = "Limit caffeine, alcohol, and carbonated beverages. Do not use over-the-counter PPIs indefinitely without clinical supervision.";
            p.whenToSeekCare = "Consult a gastroenterologist if symptoms occur multiple times weekly. Seek emergency care for difficulty swallowing, vomiting blood, black tarry stools, or chest pain radiating to arm or jaw.";
            return p;
        }

        // 11. ARTHRITIS
        if (lower.contains("arthritis") || lower.contains("osteoarthritis") || lower.contains("rheumatoid") || lower.contains("joint pain") || lower.contains("gout")) {
            p.condition = "Arthritis & Joint Disorder";
            p.explanation = "Arthritis refers to inflammation, swelling, and degenerative wear in one or more joints. The two main forms are Osteoarthritis (cartilage wear-and-tear) and Rheumatoid Arthritis (an autoimmune joint disease).";
            p.symptoms = "Joint pain, stiffness (especially in the morning), swelling, tenderness, reduced range of motion, and cracking sounds (crepitus) during movement.";
            p.causes = "Osteoarthritis is caused by mechanical cartilage wear, prior joint injuries, aging, and obesity. Rheumatoid arthritis occurs when the immune system attacks joint linings.";
            p.bodyEffects = "Degradation of smooth protective cartilage leads to bone-on-bone friction, bone spurs, joint deformity, chronic pain, and mobility restrictions.";
            p.prevention = "Maintain a healthy body weight to minimize mechanical stress on knees and hips. Perform regular low-impact exercises (swimming, walking) to strengthen joint-supporting muscles.";
            p.treatment = "Analgesics, topical anti-inflammatory gels, structured physical therapy, assistive walking aids, DMARDs for rheumatoid arthritis, and joint replacement surgery for severe cases.";
            p.precautions = "Avoid repetitive high-impact jumping during acute flare-ups. Use warm compresses for stiffness and cold packs for acute swelling. Wear cushioned supportive shoes.";
            p.whenToSeekCare = "Consult an orthopedic surgeon or rheumatologist for evaluation. Seek prompt medical care if a joint becomes red, hot to touch, severely swollen, or accompanied by fever.";
            return p;
        }

        // 12. PEDIATRIC FEVER
        if (lower.contains("child has fever") || lower.contains("baby has fever") || lower.contains("pediatric") || lower.contains("colic") || lower.contains("teething")) {
            p.condition = "Pediatric Illness & Childhood Fever";
            p.explanation = "Fever in infants and children is an immune defense mechanism indicating the body is combating a viral or bacterial infection. Young children require careful evaluation due to developing physiology.";
            p.symptoms = "Body temperature above 100.4°F (38°C), irritability, fussiness, decreased appetite, crying, runny nose, cough, or unusual drowsiness.";
            p.causes = "Common viral respiratory infections, childhood viral exanthems (chickenpox, measles, roseola), teething, or post-vaccination immune responses.";
            p.bodyEffects = "The body raises its internal temperature to stimulate white blood cells and hinder viral and bacterial replication.";
            p.prevention = "Ensure all scheduled pediatric vaccinations are up to date, encourage hand hygiene, avoid exposure to sick contacts, and provide balanced nutrition.";
            p.treatment = "Child-appropriate, weight-based paracetamol or ibuprofen syrups prescribed by a pediatrician. Never give Aspirin to children due to the risk of Reye syndrome.";
            p.precautions = "Dress the child in light, comfortable clothing. Offer frequent fluids (breast milk, formula, ORS, water) to avoid dehydration. Sponge with lukewarm water if fever is high.";
            p.whenToSeekCare = "Consult a pediatrician immediately for any infant under 3 months with fever ≥100.4°F (38°C), fever lasting over 3 days, extreme lethargy, stiff neck, continuous crying, or seizures.";
            return p;
        }

        // 13. COMMON COLD, COUGH & INFECTIONS
        if (lower.contains("cold") || lower.contains("cough") || lower.contains("flu") || lower.contains("fever") || lower.contains("sore throat") || lower.contains("infection")) {
            p.condition = "Acute Respiratory Infection (Cold & Flu)";
            p.explanation = "The common cold and seasonal flu are acute viral infections of the upper respiratory tract involving the nasal passages, throat, sinuses, and bronchial tubes.";
            p.symptoms = "Runny or blocked nose, sneezing, sore throat, cough, mild to moderate fever, muscle aches, mild headache, and general fatigue.";
            p.causes = "Infection by respiratory viruses (primarily Rhinoviruses for colds; Influenza viruses A and B for flu) transmitted through airborne droplets or hand-to-surface contact.";
            p.bodyEffects = "Viruses inflame respiratory epithelial linings, triggering mucosal swelling, increased mucus production, and immune cytokine release.";
            p.prevention = "Wash hands frequently with soap and water, avoid touching the face, disinfect common surfaces, practice cough etiquette, and get an annual influenza vaccination.";
            p.treatment = "Supportive therapy: warm saline gargles for sore throat, steam inhalation for nasal congestion, adequate hydration, honey for cough (in individuals >1 year), and paracetamol for fever and aches.";
            p.precautions = "Antibiotics do not treat viral colds or flu and should never be used without a doctor diagnosing a secondary bacterial infection. Rest adequately and stay home while feverish.";
            p.whenToSeekCare = "Consult a physician if fever lasts more than 3 days, cough persists beyond 2 weeks, phlegm is rust-colored or bloody, or you develop chest pain or breathing difficulty.";
            return p;
        }

        // 14. DYNAMIC PARSER FOR ANY OTHER DISEASE / SYMPTOM
        String conditionName = extractConditionName(lower);
        p.condition = conditionName;
        p.explanation = conditionName + " is a clinical health condition. In medical practice, it involves specific physiological alterations that warrant professional diagnostic evaluation by a licensed healthcare provider.";
        p.symptoms = "Symptoms vary based on the stage and individual health factors, but commonly include localized discomfort, fatigue, functional impairment, and constitutional symptoms.";
        p.causes = "Potential causes include genetic predisposition, immune dysregulation, environmental exposures, lifestyle factors, or underlying microbial pathogens.";
        p.bodyEffects = "It disrupts normal physiological cellular homeostasis, triggering inflammatory and biochemical cascades that require clinical management to avoid complications.";
        p.prevention = "Maintain a nutrient-dense diet, engage in regular physical activity, manage stress, avoid smoking and alcohol, and attend scheduled health screenings.";
        p.treatment = "Treatment is customized to the specific clinical diagnosis and may include targeted medications, physical therapy, lifestyle changes, or procedures supervised by a doctor.";
        p.precautions = "Avoid unverified home remedies or self-medicating with prescription drugs. Maintain a symptom diary and follow professional clinical guidance.";
        p.whenToSeekCare = "Consult a qualified physician for clinical and diagnostic evaluation. Seek emergency care immediately for sudden severe pain, high fever, breathing difficulties, or neurological symptoms.";
        return p;
    }

    private String extractConditionName(String lower) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("lupus", "Systemic Lupus Erythematosus (Lupus)");
        map.put("celiac", "Celiac Disease");
        map.put("crohn", "Crohn's Disease");
        map.put("fibromyalgia", "Fibromyalgia");
        map.put("vitiligo", "Vitiligo");
        map.put("anemia", "Anemia");
        map.put("jaundice", "Jaundice / Liver Impairment");
        map.put("gout", "Gout (Uric Acid Arthritis)");
        map.put("parkinson", "Parkinson's Disease");
        map.put("alzheimer", "Alzheimer's Disease");
        map.put("sciatica", "Sciatica");
        map.put("pcos", "Polycystic Ovary Syndrome (PCOS)");
        map.put("uti", "Urinary Tract Infection (UTI)");
        map.put("kidney stone", "Kidney Stones (Renal Calculi)");
        map.put("sinus", "Sinusitis");
        map.put("pneumonia", "Pneumonia");
        map.put("rabies", "Rabies Infection");

        for (Map.Entry<String, String> e : map.entrySet()) {
            if (lower.contains(e.getKey())) {
                return e.getValue();
            }
        }

        Pattern pattern = Pattern.compile("(?:what is|what are|symptoms of|cause of|treatment for|about)\\s+([a-zA-Z\\s]{3,30})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(lower);
        if (matcher.find()) {
            String match = matcher.group(1).trim().replaceAll("\\b(the|a|an|my|our)\\b", "").trim();
            if (match.length() > 2) {
                return Character.toUpperCase(match.charAt(0)) + match.substring(1);
            }
        }

        return "Health Condition / Symptom Pattern";
    }

    private String callGeminiApi(String message, String lang, SpecializationInfo specInfo, List<Doctor> matchingDoctors, String convId) {
        try {
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            String doctorSectionPrompt;
            if (specInfo != null && !specInfo.isAvailableAtQuickCare()) {
                doctorSectionPrompt = "CRITICAL DOCTOR AVAILABILITY STATUS: Quick Care website currently DOES NOT have a specialist available in " + specInfo.getSpecialization() + ". " +
                        "YOU MUST STATE CLEARLY THAT A DOCTOR IN THIS SPECIALTY IS CURRENTLY NOT AVAILABLE ON OUR WEBSITE AND PROVIDE REASONS WHY: " +
                        "1) Panel Verification in Progress (Quick Care currently features verified specialists in Cardiology, Dermatology, Pediatrics, and Orthopedics; other departments are undergoing credential verification), " +
                        "2) Need for In-Person Diagnostic Facilities (conditions requiring physical exams, endoscopy, MRI/CT, or lab blood tests cannot be safely diagnosed via telemedicine alone), " +
                        "3) NMC Telemedicine Regulations (controlled drugs or acute treatments require prior physical exam). " +
                        "Never recommend an unrelated doctor. Recommend consulting an in-person " + specInfo.getSpecialistTitle() + " at a local hospital.";
            } else if (specInfo != null && !matchingDoctors.isEmpty()) {
                List<String> docNamesList = new ArrayList<>();
                for (Doctor doc : matchingDoctors) {
                    if (doc != null && doc.getFullName() != null) {
                        docNamesList.add(doc.getFullName());
                    }
                }
                String docNames = String.join(", ", docNamesList);
                doctorSectionPrompt = "Quick Care Hospital has the following verified specialist(s) available on our website in " + specInfo.getSpecialization() + ": " + docNames + ". Recommend ONLY these verified specialists and mention they are available for 24/7 video and in-clinic booking on our website.";
            } else {
                doctorSectionPrompt = "If the user asks which doctor to consult for a specialty not available at Quick Care (Quick Care only has Cardiology, Dermatology, Pediatrics, Orthopedics), explain that specialists in other fields are undergoing panel credentialing and advise them to consult a qualified in-person doctor.";
            }

            String systemPrompt = "You are QuickCare AI Healthcare Assistant, an intelligent, empathetic medical assistant. " +
                    "Answer questions about any disease, illness, symptom, or health condition using simple, clear language. " +
                    "Structure your answer with: 1. Understanding the condition, 2. Common symptoms, 3. Causes & risk factors, 4. How it affects the body, 5. General prevention methods, 6. Common treatment approaches, 7. Lifestyle & dietary precautions, and 8. When medical attention is necessary. " +
                    doctorSectionPrompt + " " +
                    "YOU MUST CONCLUDE WITH THIS EXACT MANDATORY DISCLAIMER AT THE VERY END:\n" + MANDATORY_MEDICAL_DISCLAIMER;

            Map<String, Object> body = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();

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
                            if (specInfo != null && !specInfo.isAvailableAtQuickCare() && !resText.contains("don't have a doctor available")) {
                                resText += "\n\n" + UNAVAILABLE_SPECIALTY_NOTICE;
                            }
                            return resText;
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Gemini API call failed: {}. Utilizing comprehensive clinical knowledge engine.", e.getMessage());
        }
        return null;
    }
}
