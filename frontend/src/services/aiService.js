import api from './api';

// Verified hospital doctors database definition for fallback
const VERIFIED_HOSPITAL_DOCTORS = [
  {
    doctorId: 'doc_001',
    fullName: 'Dr. Priya Deshmukh',
    specialization: 'Cardiology',
    qualifications: 'MBBS, MD (Medicine), DM (Cardiology)',
    experienceYears: 14,
    consultationFee: 800,
    rating: 4.9,
    hospitalAffiliation: 'Apex Heart Institute, Mumbai',
    profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    verificationStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
  },
  {
    doctorId: 'doc_002',
    fullName: 'Dr. Rajesh Kulkarni',
    specialization: 'Dermatology',
    qualifications: 'MBBS, DVD, MD (Dermatology)',
    experienceYears: 10,
    consultationFee: 600,
    rating: 4.8,
    hospitalAffiliation: 'Skin & Glow Clinic, Pune',
    profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    verificationStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
  },
  {
    doctorId: 'doc_003',
    fullName: 'Dr. Ananya Roy',
    specialization: 'Pediatrics',
    qualifications: 'MBBS, DCH, DNB (Pediatrics)',
    experienceYears: 8,
    consultationFee: 500,
    rating: 4.95,
    hospitalAffiliation: 'Little Sprouts Children Hospital, Delhi',
    profileImage: 'https://images.unsplash.com/photo-1594824813583-43efb8e23528?auto=format&fit=crop&q=80&w=400',
    verificationStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
  },
  {
    doctorId: 'doc_004',
    fullName: 'Dr. Vikram Joshi',
    specialization: 'Orthopedics',
    qualifications: 'MBBS, MS (Orthopedics), MCh (Ortho)',
    experienceYears: 16,
    consultationFee: 900,
    rating: 4.75,
    hospitalAffiliation: 'Metro Joint & Spine Hospital, Bengaluru',
    profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    verificationStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
  },
];

export const aiService = {
  async chat(message, language = 'en', conversationId = null) {
    try {
      const res = await api.post('/ai/chat', { message, language, conversationId });
      if (res && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend AI service unreachable. Executing strict client-side clinical matching:', err.message);
      return {
        success: true,
        data: executeStrictFallbackMatching(message, language, conversationId),
      };
    }
  },
};

function executeStrictFallbackMatching(text, lang = 'en', conversationId = null) {
  const lower = (text || '').toLowerCase();

  // Emergency check
  const isEmergency = [
    'chest pain', 'heart attack', 'cannot breathe', "can't breathe", 'shortness of breath',
    'severe bleeding', 'unconscious', 'stroke', 'paralysis', 'coughing blood'
  ].some((kw) => lower.includes(kw));

  if (isEmergency) {
    return {
      conversationId: conversationId || 'conv_fallback',
      emergency: true,
      emergencyDisclaimer: '⚠️ MEDICAL EMERGENCY: The symptoms described indicate a critical emergency. Please call emergency services (108 / 112) or proceed to the nearest emergency room immediately!',
      reply: 'Please seek immediate emergency medical care. Call 108 immediately and do not wait for an appointment.',
      suggestedSpecialization: null,
      specialistAvailable: false,
      recommendedDoctors: [],
    };
  }

  // Detect specialization and specialist title
  let detectedSpec = null;
  let specialistTitle = null;

  if (lower.includes('cardio') || lower.includes('heart') || lower.includes('coronary') || lower.includes('palpitation') || lower.includes('bp') || lower.includes('blood pressure')) {
    detectedSpec = 'Cardiology';
    specialistTitle = 'Cardiologist';
  } else if (lower.includes('neuro') || lower.includes('neurologist') || lower.includes('neurological') || lower.includes('brain') || lower.includes('migraine') || lower.includes('seizure') || lower.includes('epilepsy')) {
    detectedSpec = 'Neurology';
    specialistTitle = 'Neurologist';
  } else if (lower.includes('dermat') || lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('eczema') || lower.includes('itching')) {
    detectedSpec = 'Dermatology';
    specialistTitle = 'Dermatologist';
  } else if (lower.includes('pediat') || lower.includes('child') || lower.includes('baby') || lower.includes('infant') || lower.includes('kid')) {
    detectedSpec = 'Pediatrics';
    specialistTitle = 'Pediatrician';
  } else if (lower.includes('ortho') || lower.includes('bone') || lower.includes('joint') || lower.includes('fracture') || lower.includes('knee') || lower.includes('back pain')) {
    detectedSpec = 'Orthopedics';
    specialistTitle = 'Orthopedic Surgeon';
  } else if (lower.includes('oncol') || lower.includes('cancer') || lower.includes('tumor') || lower.includes('chemotherapy')) {
    detectedSpec = 'Oncology';
    specialistTitle = 'Oncologist';
  } else if (lower.includes('gastro') || lower.includes('stomach') || lower.includes('liver') || lower.includes('acid reflux') || lower.includes('digestion')) {
    detectedSpec = 'Gastroenterology';
    specialistTitle = 'Gastroenterologist';
  } else if (lower.includes('nephro') || lower.includes('kidney') || lower.includes('renal') || lower.includes('dialysis')) {
    detectedSpec = 'Nephrology';
    specialistTitle = 'Nephrologist';
  } else if (lower.includes('dent') || lower.includes('tooth') || lower.includes('teeth') || lower.includes('gum')) {
    detectedSpec = 'Dentistry';
    specialistTitle = 'Dentist';
  } else if (lower.includes('ent') || lower.includes('ear') || lower.includes('nose') || lower.includes('throat') || lower.includes('sinus')) {
    detectedSpec = 'ENT Specialist';
    specialistTitle = 'ENT Specialist';
  }

  // Strict database matching
  const matchingDoctors = detectedSpec
    ? VERIFIED_HOSPITAL_DOCTORS.filter(
        (d) => d.specialization.toLowerCase() === detectedSpec.toLowerCase()
      )
    : [];

  const specialistAvailable = matchingDoctors.length > 0;

  let reply;
  if (!detectedSpec) {
    reply =
      'Hello! I am QuickCare AI Assistant. Please describe your symptoms or medical concern (e.g. chest discomfort, skin rash, or joint pain), and I will guide you to a verified specialist at Quick Care Hospital if available.';
  } else if (!specialistAvailable) {
    reply = 'Currently, we do not have a doctor specializing in this condition. Please check again later or consult an appropriate healthcare provider.';
  } else {
    const docList = matchingDoctors.map((d) => `• Dr. ${d.fullName} (${d.specialization})`).join('\n');
    reply = `Hello! Based on the symptoms described, we recommend consulting our verified specialist in **${detectedSpec}**.\n\n**Available Specialist(s) at Quick Care:**\n${docList}\n\nYou can review their profile and book a consultation using the doctor card below.`;
  }

  return {
    conversationId: conversationId || 'conv_fallback',
    emergency: false,
    suggestedSpecialization: detectedSpec,
    specialistAvailable,
    recommendedDoctors: matchingDoctors,
    reply,
  };
}
