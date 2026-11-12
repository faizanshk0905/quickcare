import api from './api.js';
import { DEFAULT_DOCTORS } from './doctorService.js';

export const MANDATORY_MEDICAL_DISCLAIMER =
  '⚕️ **Important Medical Advice:** The information provided by Quick Care AI is for educational and informational purposes only. It is not a substitute for professional medical diagnosis, advice, or treatment. If you are experiencing persistent symptoms, worsening health problems, or have any concerns about your health, please consult a qualified doctor. Do not ignore serious symptoms or delay seeking medical attention.';

export const UNAVAILABLE_SPECIALTY_NOTICE =
  "Sorry, currently we don't have a doctor available for this medical specialty. Please consult a qualified healthcare provider outside Quick Care.";

// Critical Emergency Symptoms Detection Keywords
const EMERGENCY_PATTERNS = [
  'chest pain', 'crushing chest', 'pressure in chest', 'tightness in chest', 'heart attack',
  'difficulty breathing', 'cannot breathe', "can't breathe", 'shortness of breath', 'gasping for air',
  'stroke', 'facial drooping', 'face drooping', 'arm weakness', 'slurred speech', 'sudden paralysis',
  'unconscious', 'unconsciousness', 'fainted', 'fainting', 'passed out', 'unresponsive', 'collapsed',
  'severe bleeding', 'heavy bleeding', 'coughing blood', 'vomiting blood', 'hemorrhage',
  'seizure', 'seizures', 'convulsion', 'convulsions', 'fits', 'epileptic fit',
  'anaphylaxis', 'severe allergic reaction', 'swelling of throat', 'swollen tongue', 'closing throat',
  'poisoning', 'swallowed poison', 'suicide', 'overdose',
  // Hindi & Marathi
  'छाती में दर्द', 'सांस लेने में तकलीफ', 'सांस नहीं आ रही', 'बेहोश', 'दौरा', 'लकवा', 'खून की उल्टी',
  'छातीत दुखणे', 'श्वास घेण्यास त्रास', 'मेंदूचा झटका', 'रक्तस्त्राव'
];

export const aiService = {
  async chat(message, language = 'en', conversationId = null) {
    try {
      const res = await api.post('/ai/chat', { message, language, conversationId });
      if (res && res.data && res.data.data) {
        // Ensure mandatory disclaimer is present in reply
        const data = res.data.data;
        if (!data.emergency && data.reply && !data.reply.includes('Important Medical Advice')) {
          data.reply = `${data.reply.trim()}\n\n---\n\n${MANDATORY_MEDICAL_DISCLAIMER}`;
        }
        return res.data;
      }
    } catch (err) {
      console.warn('Backend AI service unreachable. Executing comprehensive client-side healthcare engine:', err.message);
    }

    // Client-side fallback engine
    return {
      success: true,
      data: executeComprehensiveMedicalTriaging(message, language, conversationId),
    };
  },
};

/**
 * Checks if query describes potentially life-threatening emergency symptoms
 */
export function checkEmergencySymptoms(text) {
  const lower = (text || '').toLowerCase();
  return EMERGENCY_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Maps query / symptoms to an exact medical specialty and provides title
 */
export function detectMedicalSpecialty(text) {
  const lower = (text || '').toLowerCase();

  // 1. Cardiology (Heart, Cardiovascular, BP, Cholesterol)
  if (
    lower.includes('cardio') || lower.includes('heart') || lower.includes('chest') ||
    lower.includes('angina') || lower.includes('coronary') || lower.includes('palpitation') ||
    lower.includes('blood pressure') || lower.includes('hypertension') || lower.includes('high bp') ||
    lower.includes('low bp') || lower.includes('cholesterol') || lower.includes('ecg') ||
    lower.includes('arrhythmia') || lower.includes('atherosclerosis') || lower.includes('हृदय') || lower.includes('रक्तदाब')
  ) {
    return {
      specialty: 'Cardiology',
      doctorTitle: 'Cardiologist',
      availableAtQuickCare: true,
    };
  }

  // 2. Dermatology (Skin, Hair, Nails, Allergies)
  if (
    lower.includes('dermat') || lower.includes('skin') || lower.includes('rash') ||
    lower.includes('acne') || lower.includes('pimple') || lower.includes('eczema') ||
    lower.includes('psoriasis') || lower.includes('itching') || lower.includes('itchy') ||
    lower.includes('hives') || lower.includes('urticaria') || lower.includes('ringworm') ||
    lower.includes('fungal') || lower.includes('hair loss') || lower.includes('alopecia') ||
    lower.includes('dandruff') || lower.includes('scabies') || lower.includes('vitiligo') ||
    lower.includes('त्वचा') || lower.includes('खुजली') || lower.includes('खाज')
  ) {
    return {
      specialty: 'Dermatology',
      doctorTitle: 'Dermatologist',
      availableAtQuickCare: true,
    };
  }

  // 3. Pediatrics (Children, Infants, Babies)
  if (
    lower.includes('pediat') || lower.includes('paediat') || lower.includes('child') ||
    lower.includes('children') || lower.includes('baby') || lower.includes('infant') ||
    lower.includes('toddler') || lower.includes('kid') || lower.includes('newborn') ||
    lower.includes('colic') || lower.includes('teething') || lower.includes('hand foot mouth') ||
    lower.includes('बच्चा') || lower.includes('बाळ')
  ) {
    return {
      specialty: 'Pediatrics',
      doctorTitle: 'Pediatrician',
      availableAtQuickCare: true,
    };
  }

  // 4. Orthopedics (Bones, Joints, Spine, Fractures, Arthritis)
  if (
    lower.includes('ortho') || lower.includes('bone') || lower.includes('joint') ||
    lower.includes('fracture') || lower.includes('back pain') || lower.includes('knee') ||
    lower.includes('spine') || lower.includes('arthritis') || lower.includes('osteoarthritis') ||
    lower.includes('spondylosis') || lower.includes('sciatica') || lower.includes('slip disc') ||
    lower.includes('sprain') || lower.includes('ligament') || lower.includes('osteoporosis') ||
    lower.includes('हड्डी') || lower.includes('जोड़') || lower.includes('सांधेदुखी')
  ) {
    return {
      specialty: 'Orthopedics',
      doctorTitle: 'Orthopedic Surgeon',
      availableAtQuickCare: true,
    };
  }

  // 5. Neurology (Brain, Nerves, Migraine, Epilepsy) - NOT available in Quick Care
  if (
    lower.includes('neuro') || lower.includes('brain') || lower.includes('migraine') ||
    lower.includes('epilepsy') || lower.includes('seizure') || lower.includes('vertigo') ||
    lower.includes('parkinson') || lower.includes('alzheimer') || lower.includes('dementia') ||
    lower.includes('neuropathy') || lower.includes('nerve pain') || lower.includes('stroke')
  ) {
    return {
      specialty: 'Neurology',
      doctorTitle: 'Neurologist',
      availableAtQuickCare: false,
    };
  }

  // 6. Gastroenterology (Stomach, Liver, Digestive, GERD) - NOT available in Quick Care
  if (
    lower.includes('gastro') || lower.includes('stomach') || lower.includes('liver') ||
    lower.includes('acid reflux') || lower.includes('gerd') || lower.includes('gastritis') ||
    lower.includes('ulcer') || lower.includes('ibs') || lower.includes('gallstone') ||
    lower.includes('fatty liver') || lower.includes('constipation') || lower.includes('diarrhea') ||
    lower.includes('piles') || lower.includes('hemorrhoid') || lower.includes('jaundice')
  ) {
    return {
      specialty: 'Gastroenterology',
      doctorTitle: 'Gastroenterologist',
      availableAtQuickCare: false,
    };
  }

  // 7. Pulmonology (Lungs, Asthma in adults, COPD, Bronchitis) - NOT available in Quick Care
  if (
    lower.includes('pulmon') || lower.includes('lung') || lower.includes('asthma') ||
    lower.includes('copd') || lower.includes('bronchitis') || lower.includes('pneumonia') ||
    lower.includes('wheezing') || lower.includes('tuberculosis') || lower.includes('tb')
  ) {
    return {
      specialty: 'Pulmonology',
      doctorTitle: 'Pulmonologist',
      availableAtQuickCare: false,
    };
  }

  // 8. Endocrinology (Diabetes, Thyroid, Hormones) - NOT available in Quick Care
  if (
    lower.includes('endocrin') || lower.includes('diabetes') || lower.includes('thyroid') ||
    lower.includes('hypothyroid') || lower.includes('hyperthyroid') || lower.includes('hormon') ||
    lower.includes('sugar') || lower.includes('glucose')
  ) {
    return {
      specialty: 'Endocrinology',
      doctorTitle: 'Endocrinologist',
      availableAtQuickCare: false,
    };
  }

  // 9. Psychiatry & Mental Health - NOT available in Quick Care
  if (
    lower.includes('psychiat') || lower.includes('psycholog') || lower.includes('mental health') ||
    lower.includes('depression') || lower.includes('anxiety') || lower.includes('panic attack') ||
    lower.includes('insomnia') || lower.includes('sleep disorder') || lower.includes('ocd') ||
    lower.includes('stress') || lower.includes('bipolar')
  ) {
    return {
      specialty: 'Psychiatry',
      doctorTitle: 'Psychiatrist',
      availableAtQuickCare: false,
    };
  }

  // 10. Gynecology & Women's Health - NOT available in Quick Care
  if (
    lower.includes('gynec') || lower.includes('gynaec') || lower.includes('pcos') ||
    lower.includes('pcod') || lower.includes('endometriosis') || lower.includes('period') ||
    lower.includes('menstrual') || lower.includes('pregnancy') || lower.includes('menopause') ||
    lower.includes('ovary') || lower.includes('uterus')
  ) {
    return {
      specialty: 'Gynecology & Obstetrics',
      doctorTitle: 'Gynecologist',
      availableAtQuickCare: false,
    };
  }

  // 11. Nephrology & Urology (Kidneys, Bladder, Prostate) - NOT available in Quick Care
  if (
    lower.includes('nephro') || lower.includes('kidney') || lower.includes('renal') ||
    lower.includes('urolog') || lower.includes('prostate') || lower.includes('kidney stone') ||
    lower.includes('dialysis') || lower.includes('creatinine') || lower.includes('uti')
  ) {
    return {
      specialty: 'Nephrology & Urology',
      doctorTitle: 'Nephrologist / Urologist',
      availableAtQuickCare: false,
    };
  }

  // 12. ENT (Ear, Nose, Throat) - NOT available in Quick Care
  if (
    lower.includes('ent') || lower.includes('ear') || lower.includes('nose') ||
    lower.includes('throat') || lower.includes('sinus') || lower.includes('tonsil')
  ) {
    return {
      specialty: 'ENT (Otolaryngology)',
      doctorTitle: 'ENT Specialist',
      availableAtQuickCare: false,
    };
  }

  // 13. Ophthalmology (Eyes) - NOT available in Quick Care
  if (
    lower.includes('ophthal') || lower.includes('eye') || lower.includes('vision') ||
    lower.includes('cataract') || lower.includes('glaucoma') || lower.includes('retina')
  ) {
    return {
      specialty: 'Ophthalmology',
      doctorTitle: 'Ophthalmologist',
      availableAtQuickCare: false,
    };
  }

  // 14. Oncology (Cancer, Tumors) - NOT available in Quick Care
  if (
    lower.includes('oncol') || lower.includes('cancer') || lower.includes('tumor') ||
    lower.includes('chemo') || lower.includes('biopsy') || lower.includes('leukemia')
  ) {
    return {
      specialty: 'Oncology',
      doctorTitle: 'Oncologist',
      availableAtQuickCare: false,
    };
  }

  // 15. General Medicine (Infections, Dengue, Malaria, Typhoid, Fever, Cold) - NOT available as a verified specialist in Quick Care
  if (
    lower.includes('fever') || lower.includes('dengue') || lower.includes('malaria') ||
    lower.includes('typhoid') || lower.includes('cold') || lower.includes('flu') ||
    lower.includes('cough') || lower.includes('infection') || lower.includes('headache')
  ) {
    return {
      specialty: 'General Medicine / Internal Medicine',
      doctorTitle: 'General Physician / Infectious Disease Specialist',
      availableAtQuickCare: false,
    };
  }

  return null;
}

/**
 * Comprehensive Medical Knowledge Base for All Diseases & Conditions
 */
function getMedicalGuidance(lower) {
  // 1. DENGUE FEVER
  if (lower.includes('dengue') || lower.includes('platelet')) {
    return {
      condition: 'Dengue Fever',
      explanation: 'Dengue is a mosquito-borne viral infection caused by the dengue virus and transmitted to humans through the bites of infected female *Aedes aegypti* mosquitoes. It is common in tropical and subtropical climates.',
      symptoms: 'High fever (often 104°F / 40°C), severe headache, retro-orbital eye pain (pain behind the eyes), intense joint and muscle aches ("breakbone fever"), fatigue, nausea, vomiting, and a characteristic flat red skin rash.',
      causes: 'Infection transmitted by the bite of an infected Aedes mosquito. Peak mosquito activity occurs during early morning and just before sunset. Stagnant fresh water provides breeding sites.',
      bodyEffects: 'The virus infects immune cells and can temporarily suppress bone marrow activity, leading to a rapid drop in blood platelets (thrombocytopenia) and increased capillary permeability.',
      prevention: 'Eliminate standing water in containers, flower pots, and gutters. Use DEET or picaridin mosquito repellents, wear long-sleeved clothing, install window mesh screens, and use mosquito bed nets.',
      treatment: 'There is no specific antiviral medication for dengue. Supportive management includes complete bed rest, rigorous oral rehydration therapy (ORS, tender coconut water), and paracetamol for fever. **Avoid Aspirin, Ibuprofen, and other NSAIDs** as they significantly increase bleeding risks.',
      precautions: 'Stay well-hydrated. Monitor complete blood count (CBC) and platelet counts daily or every 24–48 hours as advised by a doctor. Consume easily digestible, nutrient-dense foods (papaya leaf extract can be taken under medical guidance).',
      whenToSeekCare: 'Seek immediate emergency hospital care if warning signs appear: persistent vomiting, severe abdominal pain, bleeding gums or nose, blood in stool/vomit, extreme lethargy, or sudden drop in platelet count below 50,000/µL.',
    };
  }

  // 2. MALARIA
  if (lower.includes('malaria') || lower.includes('plasmodium') || lower.includes('chills and rigor')) {
    return {
      condition: 'Malaria',
      explanation: 'Malaria is a life-threatening blood disease caused by microscopic *Plasmodium* parasites transmitted to people through the bites of infected female *Anopheles* mosquitoes.',
      symptoms: 'Cyclical episodes of severe shivering chills (rigors) followed by high fever and profuse sweating, accompanied by fatigue, headache, nausea, muscle aches, and mild jaundice.',
      causes: 'Infection by Plasmodium parasites (P. falciparum, P. vivax, P. malariae, P. ovale) transmitted by night-biting Anopheles mosquitoes. Contaminated blood transfusions or needle sharing can also transmit it.',
      bodyEffects: 'Parasites multiply inside liver cells before bursting out and invading red blood cells, causing red blood cell destruction (anemia), spleen enlargement, and potentially blocked capillaries in cerebral malaria.',
      prevention: 'Sleep under insecticide-treated mosquito bed nets (ITNs), use indoor insect repellents, take antimalarial prophylaxis if traveling to endemic areas, and clear open drains and puddles.',
      treatment: 'Prescription antimalarial drugs such as Artemisinin-based Combination Therapies (ACTs) or chloroquine, guided by blood smear or rapid diagnostic test (RDT) confirmation.',
      precautions: 'Do not start antimalarial drugs without microscopic or RDT blood test confirmation. Drink abundant fluids to replenish sweat losses and rest adequately.',
      whenToSeekCare: 'Consult a physician immediately upon developing cyclical chills and fever. Seek emergency care for confusion, difficulty breathing, yellow skin/eyes, or dark "blackwater" urine.',
    };
  }

  // 3. TYPHOID FEVER
  if (lower.includes('typhoid') || lower.includes('enteric fever') || lower.includes('salmonella')) {
    return {
      condition: 'Typhoid Fever (Enteric Fever)',
      explanation: 'Typhoid fever is a serious bacterial infection caused by *Salmonella enterica* serotype Typhi. It spreads primarily through contaminated drinking water and unhygienic food handling.',
      symptoms: 'Gradual "step-ladder" rise in high fever, persistent dull headache, stomach pain, extreme weakness, loss of appetite, constipation or diarrhea, dry cough, and occasional faint rose-colored spots on the chest/abdomen.',
      causes: 'Ingestion of food, ice, or water contaminated with feces or urine containing Salmonella Typhi bacteria, often due to poor hand hygiene by food handlers.',
      bodyEffects: 'The bacteria invade the lining of the small intestine, enter the bloodstream, and spread to the liver, spleen, and gallbladder, carrying a risk of intestinal ulceration or perforation if untreated.',
      prevention: 'Drink boiled or bottled water, avoid raw street food or peeled fruits exposed to flies, wash hands thoroughly with soap before eating, and consider typhoid vaccination (oral or conjugate vaccine).',
      treatment: 'Specific targeted antibiotic therapy (such as azithromycin, cefixime, or ceftriaxone) prescribed by a doctor following a blood culture or Widal test.',
      precautions: 'Complete the full course of prescribed antibiotics even if fever subsides. Eat bland, soft, semi-solid foods (khichdi, curd, boiled potatoes) and avoid spicy, oily, and high-fiber foods that strain the gut.',
      whenToSeekCare: 'Consult a doctor immediately if fever persists for more than 3 consecutive days. Seek urgent emergency attention for sharp severe abdominal pain, intestinal bleeding, or delirium.',
    };
  }

  // 4. DIABETES MELLITUS (TYPE 1 & TYPE 2)
  if (lower.includes('diabet') || lower.includes('blood sugar') || lower.includes('glucose') || lower.includes('insulin') || lower.includes('hba1c') || lower.includes('मधुमेह')) {
    return {
      condition: 'Diabetes Mellitus',
      explanation: 'Diabetes is a chronic metabolic condition where the body either cannot produce sufficient insulin (Type 1) or cannot effectively utilize the insulin it produces (Type 2), leading to elevated blood glucose levels (hyperglycemia).',
      symptoms: 'Excessive thirst (polydipsia), frequent urination (especially at night / polyuria), constant hunger, unexplained weight loss, persistent fatigue, blurred vision, slow wound healing, and recurrent skin or fungal infections.',
      causes: 'Type 1 is an autoimmune destruction of insulin-producing pancreatic beta cells. Type 2 is driven by insulin resistance linked to genetic predisposition, obesity, physical inactivity, and poor diet.',
      bodyEffects: 'Chronic high blood sugar damages blood vessels and nerves throughout the body, leading to microvascular complications (diabetic retinopathy in eyes, nephropathy in kidneys, neuropathy in nerves) and macrovascular risks (heart attacks, strokes).',
      prevention: 'For Type 2: maintain a healthy body weight, engage in at least 150 minutes of moderate aerobic exercise weekly, consume high-fiber whole foods, and avoid sugary beverages and refined carbs.',
      treatment: 'Type 1 requires lifelong daily insulin therapy. Type 2 is managed with lifestyle modifications, oral hypoglycemic agents (e.g. metformin), GLP-1 receptor agonists, or supplemental insulin under physician supervision.',
      precautions: 'Regularly monitor fasting blood sugar, post-meal glucose, and HbA1c (target <7% for most adults). Inspect feet daily for cuts or blisters. Keep hard candy or glucose tablets accessible to treat hypoglycemia (blood sugar <70 mg/dL).',
      whenToSeekCare: 'Consult an endocrinologist/physician for regular management. Seek immediate emergency care for symptoms of diabetic ketoacidosis or hyperosmolar state: fruity-smelling breath, extreme nausea/vomiting, deep rapid breathing, or confusion.',
    };
  }

  // 5. HYPERTENSION / HIGH BLOOD PRESSURE
  if (lower.includes('hypertension') || lower.includes('high bp') || lower.includes('blood pressure') || lower.includes('bp') || lower.includes('रक्तदाब') || lower.includes('रक्तचाप')) {
    return {
      condition: 'Hypertension (High Blood Pressure)',
      explanation: 'Hypertension is a chronic cardiovascular condition in which the long-term force of blood flowing against artery walls is consistently too high (typically 130/80 mmHg or greater according to AHA guidelines).',
      symptoms: 'Frequently called a "silent killer" because most people have zero symptoms for years. In severe stages, individuals may experience morning occipital headaches, dizziness, nosebleeds, blurred vision, or chest palpitations.',
      causes: 'Primary hypertension develops gradually due to genetics, high dietary sodium, lack of physical exercise, obesity, chronic stress, and aging. Secondary hypertension arises from kidney disease, sleep apnea, or hormonal conditions.',
      bodyEffects: 'Forces the heart to pump harder against stiffened arteries, leading to left ventricular hypertrophy, arterial hardening (atherosclerosis), kidney failure, stroke, and vision loss.',
      prevention: 'Adopt the DASH diet (rich in fruits, vegetables, and low-fat dairy), limit daily sodium intake to under 2,000 mg (less than 1 teaspoon of salt), exercise regularly, stop smoking, and limit alcohol.',
      treatment: 'Antihypertensive medications such as ACE inhibitors, ARBs, Calcium Channel Blockers, or thiazide diuretics, prescribed and titrated by a doctor alongside lifestyle modifications.',
      precautions: 'Check blood pressure at regular intervals using a calibrated home monitor. Avoid sudden discontinuation of prescribed BP medications, which can trigger rebound hypertensive crises.',
      whenToSeekCare: 'Seek emergency medical evaluation immediately if blood pressure exceeds 180/120 mmHg or is accompanied by chest pain, shortness of breath, back pain, numbness, weakness, or difficulty speaking.',
    };
  }

  // 6. ASTHMA & RESPIRATORY CONDITIONS
  if (lower.includes('asthma') || lower.includes('wheez') || lower.includes('bronchitis') || lower.includes('दमा')) {
    return {
      condition: 'Bronchial Asthma',
      explanation: 'Asthma is a chronic inflammatory condition of the airways (bronchial tubes) that causes them to swell, narrow, and produce excess mucus in response to various environmental triggers.',
      symptoms: 'Recurrent episodes of wheezing (a high-pitched whistling sound during exhalation), dry or chesty coughing (worse at night or early morning), chest tightness, and shortness of breath.',
      causes: 'A combination of genetic factors and environmental allergens (dust mites, pet dander, pollen, mold, cold air, smoke, air pollution, exercise, or viral respiratory infections).',
      bodyEffects: 'Chronic inflammation makes airway smooth muscles hyper-reactive, causing bronchospasm, mucus plugging, and restricted airflow into and out of the lungs.',
      prevention: 'Identify and avoid personal environmental triggers, use air purifiers, maintain indoor humidity below 50%, wash bedding weekly in hot water, and receive an annual influenza vaccine.',
      treatment: 'Inhaled corticosteroids (controller inhalers) for long-term daily anti-inflammatory protection, plus short-acting beta-agonists (rescue inhalers like albuterol) for acute symptom relief.',
      precautions: 'Always carry a prescribed rescue inhaler. Learn to use a peak flow meter and spacer device properly. Follow a written Asthma Action Plan prepared with your doctor.',
      whenToSeekCare: 'Seek immediate emergency hospital attention if rescue inhaler provides no relief, fingernails or lips turn bluish, breathing requires heavy use of chest muscles, or speaking in full sentences is impossible.',
    };
  }

  // 7. THYROID DISORDERS (HYPOTHYROIDISM & HYPERTHYROIDISM)
  if (lower.includes('thyroid') || lower.includes('hypothyroid') || lower.includes('hyperthyroid') || lower.includes('tsh') || lower.includes('goiter')) {
    return {
      condition: 'Thyroid Disorders (Hypo- & Hyperthyroidism)',
      explanation: 'Thyroid disorders occur when the butterfly-shaped thyroid gland in the lower neck produces either too little thyroid hormone (Hypothyroidism) or too much thyroid hormone (Hyperthyroidism), disrupting metabolic regulation.',
      symptoms: 'Hypothyroidism: unexplained weight gain, chronic fatigue, cold intolerance, dry skin, hair thinning, constipation, and memory fog. Hyperthyroidism: rapid weight loss, heat intolerance, heart palpitations, tremors, anxiety, and sleep disturbances.',
      causes: 'Autoimmune diseases (Hashimoto thyroiditis for hypothyroidism; Graves disease for hyperthyroidism), iodine deficiency or excess, thyroiditis, or thyroid nodules.',
      bodyEffects: 'Thyroid hormones (T3 & T4) govern cellular metabolism throughout the body. Abnormal levels impact heart rate, body temperature, digestive motility, cholesterol metabolism, and reproductive health.',
      prevention: 'Ensure balanced dietary iodine intake (using iodized salt). Undergo regular screening if there is a family history of autoimmune or thyroid conditions.',
      treatment: 'Hypothyroidism is treated with daily synthetic thyroid hormone replacement (Levothyroxine). Hyperthyroidism is managed with antithyroid medications (e.g. methimazole), radioactive iodine, or beta-blockers.',
      precautions: 'Take thyroid medications first thing in the morning on an empty stomach with plain water, 30–60 minutes before breakfast. Get serum TSH, Free T3, and Free T4 tested every 6–12 months.',
      whenToSeekCare: 'Consult an endocrinologist for dosage optimization. Seek urgent medical care for high fever, rapid irregular heartbeat, or extreme restlessness/confusion (thyroid storm).',
    };
  }

  // 8. MIGRAINE & CHRONIC HEADACHES
  if (lower.includes('migraine') || (lower.includes('headache') && (lower.includes('one side') || lower.includes('nausea') || lower.includes('light')))) {
    return {
      condition: 'Migraine Headache',
      explanation: 'Migraine is a complex neurological disorder characterized by recurrent attacks of moderate-to-severe throbbing or pulsating head pain, often concentrated on one side of the head.',
      symptoms: 'Intense throbbing pain, sensory hypersensitivity to light (photophobia), sound (phonophobia), and odors, accompanied by nausea, vomiting, and in 25% of cases, sensory disturbances known as visual aura (flashing lights, zigzag lines).',
      causes: 'Genetic factors causing neurochemical imbalances in the brain, especially involving the trigeminal nerve and fluctuating serotonin levels. Triggers include stress, missed meals, hormonal shifts, lack of sleep, and weather changes.',
      bodyEffects: 'Neurogenic inflammation and abnormal vascular dilation in brain coverings lead to central sensitization and intense episodic pain processing.',
      prevention: 'Maintain consistent sleep and meal schedules, practice stress-reduction techniques, stay hydrated, limit excessive caffeine and alcohol, and identify individual dietary triggers (e.g. aged cheeses, MSG).',
      treatment: 'Acute abortive medications (triptans, NSAIDs) taken at the very onset of the attack. Preventive medications (beta-blockers, CGRP inhibitors, topiramate) for frequent, disabling attacks.',
      precautions: 'Rest in a quiet, dark, cool room during an attack with a cold compress on your forehead. Keep a headache diary to track personal attack frequency and specific triggers.',
      whenToSeekCare: 'Consult a neurologist for recurrent attacks. Seek immediate emergency evaluation for "thunderclap" headaches (sudden severe worst headache of life), or headache accompanied by fever, stiff neck, confusion, or weakness.',
    };
  }

  // 9. SKIN INFECTIONS & ALLERGIES (ECZEMA, ACNE, PSORIASIS)
  if (lower.includes('eczema') || lower.includes('psoriasis') || lower.includes('skin infection') || lower.includes('acne') || lower.includes('rash') || lower.includes('fungal')) {
    return {
      condition: 'Dermatological Skin Condition / Infection',
      explanation: 'Skin disorders include inflammatory conditions (eczema, psoriasis, acne) and microbial infections (fungal tinea, bacterial impetigo) that compromise the skin barrier and cause localized or generalized cutaneous symptoms.',
      symptoms: 'Skin redness (erythema), intense itching (pruritus), scaling, flaking, dry cracked skin, fluid-filled blisters, pimples/cysts, or circular ring-like patches with raised borders.',
      causes: 'Immune system dysregulation, compromised skin moisture barrier, genetic factors, bacterial overgrowth (*C. acnes*, *Staphylococcus*), dermatophyte fungal infections, or allergic contact allergens.',
      bodyEffects: 'Disrupts the epidermal barrier, triggering local inflammatory cytokine release, secondary bacterial superinfections from persistent scratching, and significant cosmetic/psychological distress.',
      prevention: 'Keep skin moisturized with unscented emollients, bathe in lukewarm water, avoid harsh antibacterial soaps, wear breathable cotton clothing, and maintain personal hygiene.',
      treatment: 'Condition-specific: topical corticosteroids or calcineurin inhibitors for eczema; salicylic acid/retinoids for acne; topical/oral antifungals (clotrimazole, terbinafine) for fungal infections.',
      precautions: 'Never self-prescribe steroid creams for undiagnosed rashes (steroids worsen fungal infections). Avoid scratching to prevent secondary bacterial infection and scarring.',
      whenToSeekCare: 'Consult a verified dermatologist for diagnostic examination. Seek immediate medical attention if a rash spreads rapidly, blisters extensively, or is accompanied by high fever or skin pain.',
    };
  }

  // 10. ACID REFLUX / GERD & GASTRITIS
  if (lower.includes('acid reflux') || lower.includes('gerd') || lower.includes('acidity') || lower.includes('gastritis') || lower.includes('heartburn') || lower.includes('stomach ulcer')) {
    return {
      condition: 'GERD (Gastroesophageal Reflux Disease) & Gastritis',
      explanation: 'GERD is a digestive condition in which acidic stomach contents repeatedly flow back up into the esophagus because the lower esophageal sphincter (LES) relaxes abnormally or weakens.',
      symptoms: 'Burning sensation in the chest (heartburn) often after eating and worse when lying down, acid regurgitation (sour liquid in throat), chest discomfort, persistent dry cough, hoarseness, and feeling a lump in the throat.',
      causes: 'Weakened lower esophageal sphincter, hiatal hernia, obesity, pregnancy, smoking, large meals, and trigger foods (fatty/fried foods, caffeine, chocolate, citrus, spicy foods, tomatoes).',
      bodyEffects: 'Chronic acid exposure irritates and inflames the delicate esophageal lining (esophagitis), which over time can cause strictures (narrowing) or Barrett esophagus (cellular changes).',
      prevention: 'Eat smaller, frequent meals instead of 2-3 large meals. Avoid lying down for at least 3 hours after eating. Elevate the head of your bed by 6 inches. Maintain a healthy body weight.',
      treatment: 'Antacids for fast temporary relief, H2-receptor blockers (famotidine), or Proton Pump Inhibitors (PPIs like omeprazole, pantoprazole) prescribed by a doctor.',
      precautions: 'Avoid tight clothing around the abdomen. Limit alcohol, carbonated drinks, and tobacco. Do not take PPIs for prolonged periods without medical re-evaluation.',
      whenToSeekCare: 'Consult a gastroenterologist if symptoms occur more than twice weekly. Seek immediate emergency care for difficulty or pain while swallowing, vomiting blood, black tarry stools, or chest pain radiating to arm or jaw.',
    };
  }

  // 11. ARTHRITIS & JOINT DISORDERS
  if (lower.includes('arthritis') || lower.includes('osteoarthritis') || lower.includes('rheumatoid') || lower.includes('joint pain') || lower.includes('gout')) {
    return {
      condition: 'Arthritis & Joint Disorders',
      explanation: 'Arthritis refers to inflammation, swelling, and degenerative changes in one or more joints. The two most common types are Osteoarthritis (wear-and-tear cartilage breakdown) and Rheumatoid Arthritis (an autoimmune joint inflammation).',
      symptoms: 'Joint pain, tenderness, swelling, morning stiffness lasting over 30 minutes, decreased range of motion, and cracking/grating sounds (crepitus) with movement.',
      causes: 'Osteoarthritis results from mechanical cartilage wear, joint injuries, aging, and excess weight. Rheumatoid arthritis is caused by the immune system mistakenly attacking the synovial joint lining.',
      bodyEffects: 'Loss of smooth protective cartilage leads to bone-on-bone friction, osteophyte (bone spur) formation, joint deformities, chronic pain, and mobility limitations.',
      prevention: 'Maintain a healthy body weight to reduce mechanical stress on weight-bearing joints (knees, hips, spine). Engage in low-impact exercises (swimming, cycling, walking) to strengthen supporting muscles.',
      treatment: 'Pain relief with paracetamol and topical NSAID gels, physical therapy, assistive walking devices, disease-modifying antirheumatic drugs (DMARDs) for RA, and joint replacement surgery for advanced stages.',
      precautions: 'Avoid high-impact jumping or sports during acute flare-ups. Apply warm compresses for joint stiffness and cold packs for acute swelling. Wear supportive footwear.',
      whenToSeekCare: 'Consult an orthopedic specialist or rheumatologist for evaluation. Seek prompt medical care if a joint becomes red, hot to touch, severely swollen, or accompanied by fever (possible septic arthritis).',
    };
  }

  // 12. PEDIATRIC FEVER & CHILDHOOD ILLNESSES
  if (lower.includes('child has fever') || lower.includes('baby has fever') || lower.includes('pediatric') || lower.includes('infant fever') || lower.includes('colic') || lower.includes('teething')) {
    return {
      condition: 'Pediatric Illness / Childhood Fever',
      explanation: 'Fever in infants and children is a natural immune response to viral or bacterial infections. While common, fever in young children requires careful monitoring due to their developing immune systems.',
      symptoms: 'Body temperature over 100.4°F (38°C), irritability, fussiness, reduced appetite, crying, runny nose, cough, rash, or changes in sleeping patterns.',
      causes: 'Common viral infections (rhinovirus, RSV, influenza, adenovirus), childhood eruptive illnesses (chickenpox, measles, roseola), teething-related mild elevation, or post-vaccination immune responses.',
      bodyEffects: 'The brain hypothalamus resets the body thermostat higher to inhibit microbial replication and activate white blood cells and antibodies.',
      prevention: 'Keep child up to date on scheduled pediatric immunizations, encourage regular handwashing, avoid exposure to individuals with active respiratory illnesses, and ensure good nutrition.',
      treatment: 'Child-appropriate weight-based paracetamol or ibuprofen syrups prescribed by a pediatrician. **Never give Aspirin to children or teenagers** due to the risk of Reye syndrome.',
      precautions: 'Keep the child comfortably dressed in light clothing. Offer frequent fluids (breast milk, formula, ORS, water for older children) to prevent dehydration. Sponge with lukewarm water if fever is high.',
      whenToSeekCare: 'Consult a pediatrician immediately for any infant under 3 months with fever ≥100.4°F (38°C), fever lasting more than 3 days, extreme lethargy, continuous crying, stiff neck, breathing difficulties, or febrile seizures.',
    };
  }

  // 13. COMMON COLD, COUGH & INFECTIONS
  if (lower.includes('cold') || lower.includes('cough') || lower.includes('flu') || lower.includes('fever') || lower.includes('infection') || lower.includes('sore throat')) {
    return {
      condition: 'Acute Respiratory Infection / Cold & Flu',
      explanation: 'The common cold and seasonal flu are acute viral infections primarily affecting the upper respiratory tract (nose, sinuses, pharynx, and larynx).',
      symptoms: 'Runny or stuffy nose, sneezing, scratchy or sore throat, productive or dry cough, mild body aches, low-grade to moderate fever, mild headache, and general fatigue.',
      causes: 'Over 200 respiratory viruses can cause colds (predominantly Rhinoviruses), while influenza viruses (A and B) cause the flu. Transmission occurs via airborne droplets from coughs/sneezes or surface contact.',
      bodyEffects: 'Viruses enter and damage nasal and pharyngeal mucosal epithelial cells, causing mucosal edema, mucus hypersecretion, and inflammatory cytokine release.',
      prevention: 'Wash hands regularly with soap and water for 20 seconds, avoid touching face with unwashed hands, disinfect shared surfaces, practice respiratory etiquette, and get an annual flu shot.',
      treatment: 'Symptomatic supportive treatment: warm salt water gargles for sore throat, steam inhalation for nasal congestion, adequate hydration, honey for cough relief (in children >1 year), and paracetamol for aches.',
      precautions: 'Antibiotics do NOT cure viral colds or flu and should never be used without a physician diagnosing a secondary bacterial infection. Rest extensively and isolate while symptomatic.',
      whenToSeekCare: 'Consult a doctor if fever lasts over 3 days, cough persists beyond 2 weeks, you cough up blood or thick discolored phlegm, or experience chest tightness and shortness of breath.',
    };
  }

  // 14. DYNAMIC SYSTEMIC GENERATOR FOR ANY OTHER DISEASE / RARE ILLNESS
  // (e.g. Lupus, Celiac, Crohn's, Fibromyalgia, Vitiligo, Rabies, Jaundice, etc.)
  const conditionMatch = extractConditionName(lower);
  return {
    condition: conditionMatch.name,
    explanation: `${conditionMatch.name} is a medical condition affecting the ${conditionMatch.system}. In clinical terms, it involves physiological and pathological changes that require proper diagnostic evaluation by a licensed healthcare provider.`,
    symptoms: `Symptoms typically vary depending on the severity and individual factors, but commonly include localized discomfort, fatigue, functional impairment of the ${conditionMatch.system}, and constitutional symptoms.`,
    causes: `Potential causes and risk factors include genetic susceptibility, immune system dysregulation, environmental exposures, lifestyle factors, or underlying infectious agents.`,
    bodyEffects: `It alters normal cellular and tissue homeostasis in the ${conditionMatch.system}, triggering inflammatory responses and potential secondary complications if left unmanaged.`,
    prevention: `General preventive measures include maintaining a nutrient-dense diet, engaging in regular physical activity, avoiding known environmental toxins, and scheduling regular preventive clinical checkups.`,
    treatment: `Treatment protocols are tailored to the specific diagnosis and may involve targeted pharmacotherapy, lifestyle interventions, physical therapy, or procedural interventions under physician supervision.`,
    precautions: `Avoid unverified remedies or self-medicating with prescription drugs. Maintain a detailed symptom log and adhere strictly to professional clinical recommendations.`,
    whenToSeekCare: `Consult a qualified physician or specialist for diagnostic laboratory and imaging workup. Seek immediate emergency care for sudden severe pain, high fever, breathing difficulties, or neurological deficits.`,
  };
}

/**
 * Parses generic disease names from natural language
 */
function extractConditionName(lower) {
  const commonConditions = [
    { key: 'lupus', name: 'Systemic Lupus Erythematosus (Lupus)', system: 'immune and connective tissue system' },
    { key: 'celiac', name: 'Celiac Disease', system: 'digestive and small intestinal system' },
    { key: 'crohn', name: "Crohn's Disease", system: 'gastrointestinal tract and bowel' },
    { key: 'fibromyalgia', name: 'Fibromyalgia', system: 'musculoskeletal and nervous system' },
    { key: 'vitiligo', name: 'Vitiligo', system: 'cutaneous melanin and skin system' },
    { key: 'anemia', name: 'Anemia', system: 'blood and red blood cell oxygen-carrying capacity' },
    { key: 'jaundice', name: 'Jaundice / Liver Impairment', system: 'hepatobiliary (liver and gallbladder) system' },
    { key: 'gout', name: 'Gout (Uric Acid Arthritis)', system: 'metabolic and joint articulation system' },
    { key: 'parkinson', name: "Parkinson's Disease", system: 'central nervous and motor control system' },
    { key: 'alzheimer', name: "Alzheimer's Disease & Dementia", system: 'cerebral cognitive and memory pathways' },
    { key: 'sciatica', name: 'Sciatica / Lumbar Radiculopathy', system: 'lumbosacral spinal nerves and lower limbs' },
    { key: 'pcos', name: 'Polycystic Ovary Syndrome (PCOS)', system: 'endocrine and reproductive system' },
    { key: 'uti', name: 'Urinary Tract Infection (UTI)', system: 'urinary bladder and renal system' },
    { key: 'kidney stone', name: 'Kidney Stones (Renal Calculi)', system: 'urinary and nephrological filtration system' },
    { key: 'sinus', name: 'Sinusitis / Sinus Infection', system: 'paranasal air cavities and upper respiratory tract' },
    { key: 'pneumonia', name: 'Pneumonia', system: 'lower respiratory pulmonary alveolar system' },
    { key: 'rabies', name: 'Rabies Infection', system: 'central nervous system via viral transmission' },
  ];

  for (const c of commonConditions) {
    if (lower.includes(c.key)) {
      return c;
    }
  }

  // Extract condition from "What is X" or "Symptoms of X"
  const whatIsMatch = lower.match(/(?:what is|what are|symptoms of|cause of|treatment for|info on|about)\s+([a-zA-Z\s]{3,30})/i);
  if (whatIsMatch && whatIsMatch[1]) {
    const rawName = whatIsMatch[1].trim().replace(/\b(the|a|an|my|our)\b/gi, '').trim();
    if (rawName.length > 2) {
      const formatted = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      return { name: formatted, system: 'affected anatomical system' };
    }
  }

  return { name: 'Health Condition / Symptom Pattern', system: 'relevant biological systems' };
}

/**
 * Formulates structured, educational clinical response following the 8 user requirements
 */
export function executeComprehensiveMedicalTriaging(text, lang = 'en', conversationId = null) {
  const isEmergency = checkEmergencySymptoms(text);

  // 1. EMERGENCY HANDLING
  if (isEmergency) {
    return {
      conversationId: conversationId || 'conv_emergency',
      emergency: true,
      emergencyDisclaimer:
        '🚨 **CRITICAL MEDICAL EMERGENCY WARNING:** The symptoms described (such as severe chest pain, breathing difficulty, stroke signs, severe bleeding, or unconsciousness) may indicate a life-threatening medical emergency. Please call **112** or **108** in India immediately, or proceed to the nearest emergency department right away. Do not delay seeking in-person emergency care.',
      reply:
        '🚨 **CRITICAL MEDICAL EMERGENCY DETECTED**\n\nThe symptoms you have described indicate a potentially life-threatening emergency.\n\n• **Immediate Action:** Call **112** or **108** immediately for emergency ambulance services in India.\n• **Go to Casualty:** Proceed to the nearest hospital Emergency Room / Casualty Department without delay.\n• **Do Not Wait:** Do not wait for an online appointment or rely on self-care in an acute emergency.',
      suggestedSpecialization: null,
      specialistAvailable: false,
      recommendedDoctors: [],
    };
  }

  const lower = (text || '').toLowerCase().trim();
  const specialtyInfo = detectMedicalSpecialty(lower);
  const medicalInfo = getMedicalGuidance(lower);

  // 2. DOCTOR MATCHING FROM VERIFIED DATABASE
  let matchingDoctors = [];
  let specialistAvailable = false;

  if (specialtyInfo) {
    matchingDoctors = DEFAULT_DOCTORS.filter(
      (d) => d.specialization.toLowerCase() === specialtyInfo.specialty.toLowerCase()
    );
    specialistAvailable = matchingDoctors.length > 0;
  }

  // 3. CONSTRUCT 8-POINT INTELLIGENT MEDICAL RESPONSE
  const sections = [];

  sections.push(`### 🩺 Clinical Overview: ${medicalInfo.condition}`);
  sections.push(`**1. Understanding the Condition:**\n${medicalInfo.explanation}`);
  sections.push(`**2. Common Symptoms:**\n${medicalInfo.symptoms}`);
  sections.push(`**3. Possible Causes & Risk Factors:**\n${medicalInfo.causes}`);
  sections.push(`**4. How It Affects the Body:**\n${medicalInfo.bodyEffects}`);
  sections.push(`**5. General Prevention Methods:**\n${medicalInfo.prevention}`);
  sections.push(`**6. Common Treatment Approaches:**\n${medicalInfo.treatment}`);
  sections.push(`**7. Lifestyle & Dietary Precautions:**\n${medicalInfo.precautions}`);
  sections.push(`**8. When Medical Attention is Necessary:**\n${medicalInfo.whenToSeekCare}`);

  // 4. DOCTOR RECOMMENDATION SECTION
  sections.push(`---\n### 👨‍⚕️ Specialist Consultation Recommendation:`);
  if (specialtyInfo) {
    if (specialistAvailable && matchingDoctors.length > 0) {
      const docList = matchingDoctors
        .map((d) => `• **${d.fullName}** — ${d.specialization} (${d.qualification}, ${d.experience} yrs exp) • Consultation Fee: ₹${d.consultationFee}`)
        .join('\n');

      sections.push(
        `For this condition, we recommend consulting our verified specialist in **${specialtyInfo.specialty}**.\n\n**Available Specialist(s) at Quick Care:**\n${docList}\n\nYou can review their profile and book a verified 15-minute consultation slot using the doctor card below.`
      );
    } else {
      sections.push(
        `Relevant Medical Specialty: **${specialtyInfo.specialty}** (${specialtyInfo.doctorTitle})\n\n${UNAVAILABLE_SPECIALTY_NOTICE}`
      );
    }
  } else {
    sections.push(
      `If your symptoms are persistent or concerning, please consult a qualified healthcare provider for a thorough in-person medical evaluation.`
    );
  }

  // 5. MANDATORY DOCTOR CONSULTATION DISCLAIMER
  sections.push(`---\n${MANDATORY_MEDICAL_DISCLAIMER}`);

  return {
    conversationId: conversationId || `conv_${Date.now()}`,
    emergency: false,
    suggestedSpecialization: specialtyInfo ? specialtyInfo.specialty : null,
    specialistAvailable,
    recommendedDoctors: matchingDoctors,
    reply: sections.join('\n\n'),
  };
}
