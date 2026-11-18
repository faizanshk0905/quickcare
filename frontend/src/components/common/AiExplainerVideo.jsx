import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Bot,
  Calendar,
  Video,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Send,
  Download,
  Stethoscope,
  Users,
  UserPlus,
  ArrowRight,
  ChevronRight,
  Lock,
  Mail,
  Award,
} from 'lucide-react';

export const AiExplainerVideo = () => {
  // Active Walkthrough Track: 'PATIENT' or 'DOCTOR'
  const [activeTrack, setActiveTrack] = useState('PATIENT');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100 within current step
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  // Complete End-to-End Patient Journey (From First to Last)
  const patientSteps = [
    {
      id: 0,
      stepNumber: 1,
      title: 'Registration & Account Setup',
      subtitle: 'Sign Up & Patient Dashboard',
      duration: '0:30',
      tag: 'Step 1 of 5 • Onboarding',
      caption:
        'Patient creates their account with email & password, sets up their personal medical profile, and accesses a clean personal dashboard with 0 appointments initially.',
      badgeColor: 'blue',
      icon: UserPlus,
    },
    {
      id: 1,
      stepNumber: 2,
      title: 'AI Clinical Triaging',
      subtitle: 'Multilingual Symptom Analysis',
      duration: '0:35',
      tag: 'Step 2 of 5 • AI Triaging',
      caption:
        'Patient tells QuickCare AI their symptoms in English, Hindi, or Marathi. The AI evaluates urgency and matches verified medical specialists.',
      badgeColor: 'teal',
      icon: Bot,
    },
    {
      id: 2,
      stepNumber: 3,
      title: 'Doctor Selection & Live Slot Booking',
      subtitle: '15-Min Slots & Atomic Lock',
      duration: '0:35',
      tag: 'Step 3 of 5 • Slot Booking',
      caption:
        'Patient selects date and time slot from the doctor’s live schedule. Concurrency protection locks the slot atomically to prevent double booking.',
      badgeColor: 'indigo',
      icon: Calendar,
    },
    {
      id: 3,
      stepNumber: 4,
      title: 'Doctor Review & Google Meet Link',
      subtitle: 'Invitation Sent to Email',
      duration: '0:35',
      tag: 'Step 4 of 5 • Consultation Setup',
      caption:
        'Doctor approves consultation, generates a secure Google Meet link, and dispatches the meeting details directly to the patient’s registered email.',
      badgeColor: 'purple',
      icon: Video,
    },
    {
      id: 4,
      stepNumber: 5,
      title: '1-Click Join & Digital Prescription',
      subtitle: 'Consultation & PDF Rx Download',
      duration: '0:35',
      tag: 'Step 5 of 5 • Digital Rx & Records',
      caption:
        'Patient joins the Google Meet consultation with one click. Upon completion, doctor issues an authorized digital prescription with instant PDF download.',
      badgeColor: 'emerald',
      icon: FileText,
    },
  ];

  // Complete End-to-End Doctor Journey (From First to Last)
  const doctorSteps = [
    {
      id: 0,
      stepNumber: 1,
      title: 'Doctor Registration & Verification',
      subtitle: 'License & Certificate Verification',
      duration: '0:30',
      tag: 'Step 1 of 5 • Credential Verification',
      caption:
        'Doctor signs up with clinical credentials, medical license number, and certificates to receive official Verified Doctor status from hospital administration.',
      badgeColor: 'teal',
      icon: ShieldCheck,
    },
    {
      id: 1,
      stepNumber: 2,
      title: 'Set Availability & Working End Time',
      subtitle: 'Custom Hours & Dynamic Slots',
      duration: '0:35',
      tag: 'Step 2 of 5 • Schedule Configuration',
      caption:
        'Doctor configures working days, start time, extended end time (e.g. 07:00 PM or 09:00 PM), and breaks. Appointment slots update dynamically for patients.',
      badgeColor: 'blue',
      icon: Clock,
    },
    {
      id: 2,
      stepNumber: 3,
      title: 'Clinical Portal & Appointment Management',
      subtitle: 'Isolated Doctor Dashboard',
      duration: '0:35',
      tag: 'Step 3 of 5 • Appointment Queue',
      caption:
        'Doctor accesses their Clinical Portal with private patient roster, today’s schedule, pending appointments, and complete clinical consultation history.',
      badgeColor: 'indigo',
      icon: Users,
    },
    {
      id: 3,
      stepNumber: 4,
      title: 'Google Meet Only Video Consultation',
      subtitle: 'Doctor Controls Meet Link',
      duration: '0:35',
      tag: 'Step 4 of 5 • Google Meet Dispatch',
      caption:
        'Doctor reviews patient details, approves video consultation, generates or inputs a valid Google Meet link, and sends the invitation email to the patient.',
      badgeColor: 'purple',
      icon: Video,
    },
    {
      id: 4,
      stepNumber: 5,
      title: 'Issue Authorized Digital Prescription',
      subtitle: 'Prescription & Clinical Records',
      duration: '0:35',
      tag: 'Step 5 of 5 • Digital Rx Issuance',
      caption:
        'Doctor enters diagnosis, prescribes medications with dosage and instructions, digitally signs the prescription, and archives it directly to patient records.',
      badgeColor: 'emerald',
      icon: FileText,
    },
  ];

  const currentSteps = activeTrack === 'PATIENT' ? patientSteps : doctorSteps;
  const currentStep = currentSteps[currentStepIndex] || currentSteps[0];

  // Auto-progress simulation
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 100 / (playbackSpeed * 10);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Loop to next step or restart track
          setCurrentStepIndex((prevIndex) => (prevIndex + 1) % currentSteps.length);
          return 0;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, currentSteps.length]);

  // Switch Track (Patient vs Doctor)
  const handleSwitchTrack = (track) => {
    setActiveTrack(track);
    setCurrentStepIndex(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSelectStep = (index) => {
    setCurrentStepIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setProgress(0);
    setIsPlaying(true);
  };

  // Format simulated time (5 steps * 35s = ~2m 55s)
  const currentTotalSeconds = Math.floor(
    currentStepIndex * 35 + (progress / 100) * 35
  );
  const minutes = Math.floor(currentTotalSeconds / 60);
  const seconds = currentTotalSeconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <section id="ai-video" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Interactive AI Video Walkthrough</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How <span className="text-blue-600">QuickCare Works</span> from Start to Finish
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Explore the complete step-by-step workflow for both patients and healthcare providers—from first sign up to Google Meet consultation and digital prescriptions.
        </p>

        {/* Dual Track Selector: Patient vs Doctor */}
        <div className="flex items-center justify-center pt-2">
          <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex items-center gap-2 border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => handleSwitchTrack('PATIENT')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
                activeTrack === 'PATIENT'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Patient Walkthrough (5 Steps)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTrack('DOCTOR')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
                activeTrack === 'DOCTOR'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Walkthrough (5 Steps)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Showcase Container */}
      <div
        ref={containerRef}
        className={`bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col justify-between' : ''
        }`}
      >
        {/* Video Screen Area */}
        <div className="relative aspect-video max-h-[560px] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full p-4 sm:p-8 flex flex-col justify-between relative select-none">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar inside Video Screen */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                    activeTrack === 'PATIENT' ? 'bg-blue-600' : 'bg-teal-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {activeTrack === 'PATIENT' ? 'QuickCare Patient Journey' : 'QuickCare Doctor Portal'}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-300 hidden sm:inline">
                  {currentStep.tag}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] font-mono">
                  {timeFormatted} / 2:55
                </span>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Dynamic Stage: Scenes for PATIENT or DOCTOR */}
            <div className="my-auto py-3 z-10">
              {/* ===================== PATIENT TRACK SCENES ===================== */}
              {activeTrack === 'PATIENT' && (
                <>
                  {/* Step 1: Patient Registration & Profile */}
                  {currentStepIndex === 0 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 shadow-xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <UserPlus className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold">Patient Registration & Private Dashboard</span>
                          </div>
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded">
                            Step 1
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-700/60">
                            <p className="text-[10px] text-slate-400">Registered Patient</p>
                            <p className="text-xs font-bold text-white">John Doe</p>
                            <p className="text-[10px] text-slate-500">patient@quickcare.com</p>
                          </div>
                          <div className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-700/60">
                            <p className="text-[10px] text-slate-400">Total Appointments</p>
                            <p className="text-lg font-black text-blue-400">0</p>
                            <p className="text-[10px] text-slate-500">Clean New Dashboard</p>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs">
                          <span className="text-slate-300">"No appointments yet. Book your first appointment to get started."</span>
                          <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px]">
                            Book Now
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: AI Clinical Triaging */}
                  {currentStepIndex === 1 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="flex items-start gap-3 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                          P
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400">Patient Symptom Query (English / Hindi / Marathi)</p>
                          <p className="text-xs font-semibold text-white">
                            "I have knee swelling and joint pain after jogging for 2 days. Who should I visit?"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-blue-950/70 backdrop-blur-md p-4 rounded-2xl border border-blue-600/50 shadow-xl">
                        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-teal-400">QuickCare AI Clinical Triager</p>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                              Matched: Orthopedics
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            Based on your joint swelling, you should see an <strong className="text-teal-300">Orthopedic Specialist</strong>.
                          </p>
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-teal-400" />
                              <span className="text-xs font-bold text-white">Dr. Vivek (Orthopedics)</span>
                            </div>
                            <span className="text-[10px] text-blue-400 font-bold">15-Min Slots Available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Doctor Selection & Live Slot Booking */}
                  {currentStepIndex === 2 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <Calendar className="w-4 h-4 text-teal-400" />
                            <span className="text-xs font-bold">Choose Consultation Date & 15-Min Slot</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Atomic Slot Lock
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-xs">
                          {['10:00 AM', '10:15 AM', '10:30 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM', '07:00 PM'].map((s) => {
                            const isSelected = s === '10:15 AM';
                            const isBooked = s === '10:00 AM';
                            return (
                              <div
                                key={s}
                                className={`p-2 rounded-xl text-center font-bold text-[11px] ${
                                  isSelected
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md scale-105'
                                    : isBooked
                                    ? 'bg-slate-800 text-slate-500 opacity-60 line-through'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {s}
                                {isSelected && <span className="block text-[8px] text-blue-200">Selected</span>}
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-3 bg-emerald-950/60 border border-emerald-600/40 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>10:15 AM Slot Confirmed (Zero Double-Booking Guarantee)</span>
                          </div>
                          <span className="text-[10px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded">
                            Locked
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Doctor Review & Google Meet Link */}
                  {currentStepIndex === 3 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <Mail className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold">Doctor Approval & Email Notification</span>
                          </div>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">
                            Email Dispatched
                          </span>
                        </div>

                        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-indigo-300 font-bold">To: john.doe@email.com</span>
                            <span className="text-[10px] text-slate-400">Just Now</span>
                          </div>
                          <p className="text-white font-bold text-xs">
                            Subject: Your QuickCare Video Consultation – Google Meet Invitation
                          </p>
                          <div className="p-2.5 bg-slate-950 rounded-lg border border-indigo-500/30 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                            <span>https://meet.google.com/qck-8419-care</span>
                            <span className="px-2 py-0.5 bg-emerald-600/40 text-emerald-300 text-[9px] rounded font-sans font-bold">
                              Verified Link
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: 1-Click Join & Digital Prescription */}
                  {currentStepIndex === 4 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold">Consultation Finished • Digital Prescription</span>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Doctor Signed
                          </span>
                        </div>

                        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-2">
                          <div className="flex justify-between text-slate-300 text-[11px]">
                            <span>Diagnosis: <strong>Patellar Tendinitis</strong></span>
                            <span>Doctor: <strong>Dr. Vivek</strong></span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg space-y-1 text-[10px] text-slate-300">
                            <p className="font-bold text-white">Prescribed Medications:</p>
                            <p>1. Aceclofenac + Paracetamol 100mg/325mg (1 tab twice daily - 5 days)</p>
                            <p>2. Ice pack application & physical therapy exercises</p>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">Available in Patient Medical Records</span>
                            <button
                              type="button"
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ===================== DOCTOR TRACK SCENES ===================== */}
              {activeTrack === 'DOCTOR' && (
                <>
                  {/* Step 1: Doctor Registration & Verification */}
                  {currentStepIndex === 0 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <ShieldCheck className="w-4 h-4 text-teal-400" />
                            <span className="text-xs font-bold">Doctor Registration & Medical Credential Verification</span>
                          </div>
                          <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded">
                            Verified
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-700/60">
                            <p className="text-[10px] text-slate-400">Medical Registration No.</p>
                            <p className="text-xs font-bold text-white">MCI-2018-94819</p>
                            <p className="text-[10px] text-teal-400">Orthopedics & Joint Surgery</p>
                          </div>
                          <div className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-700/60">
                            <p className="text-[10px] text-slate-400">Certificate Status</p>
                            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" /> Medical License Verified
                            </p>
                            <p className="text-[10px] text-slate-400">Approved by Admin</p>
                          </div>
                        </div>
                        <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl flex items-center justify-between text-xs text-slate-300">
                          <span>Doctor profile activated on QuickCare Clinical Directory with Verified Badge.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Set Availability & Working End Time */}
                  {currentStepIndex === 1 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold">Doctor Availability & Working End Time</span>
                          </div>
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded">
                            Slots Live
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/60 space-y-1">
                            <span className="text-[10px] text-slate-400">Working Start Time</span>
                            <p className="text-sm font-bold text-white">09:00 AM</p>
                          </div>
                          <div className="p-3 bg-blue-950/50 rounded-xl border border-blue-500/40 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-blue-300">Working End Time</span>
                              <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1 rounded">Extended</span>
                            </div>
                            <p className="text-sm font-bold text-emerald-300">07:00 PM</p>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-800/80 rounded-xl text-xs flex items-center justify-between text-slate-300 border border-slate-700">
                          <span>15-Minute patient booking slots dynamically generated until 07:00 PM!</span>
                          <span className="px-2.5 py-1 bg-teal-600 text-white font-bold rounded-lg text-[10px]">
                            Saved
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Clinical Dashboard & Appointment Management */}
                  {currentStepIndex === 2 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold">Doctor Clinical Portal – Isolated Data</span>
                          </div>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">
                            Doctor Only
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-center">
                          <div className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-700/60">
                            <p className="text-lg font-black text-white">12</p>
                            <p className="text-[10px] text-slate-400">Total Visits</p>
                          </div>
                          <div className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-700/60">
                            <p className="text-lg font-black text-amber-400">3</p>
                            <p className="text-[10px] text-slate-400">Pending Review</p>
                          </div>
                          <div className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-700/60">
                            <p className="text-lg font-black text-teal-400">9</p>
                            <p className="text-[10px] text-slate-400">Completed</p>
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-800/80 rounded-xl text-xs text-slate-300 flex items-center justify-between border border-slate-700">
                          <div>
                            <p className="font-bold text-white text-xs">Patient: John Doe (10:15 AM)</p>
                            <p className="text-[10px] text-slate-400">Symptom: Acute Knee Pain</p>
                          </div>
                          <span className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px]">
                            Review Request
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Google Meet Only Consultation Workflow */}
                  {currentStepIndex === 3 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <Video className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-bold">Doctor Google Meet Control & Invitation Dispatch</span>
                          </div>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded">
                            Google Meet Only
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-purple-200">Doctor Enters or Generates Link:</span>
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                                Validated
                              </span>
                            </div>
                            <div className="p-2 bg-slate-950 rounded-lg border border-purple-500/40 font-mono text-emerald-300 text-[11px]">
                              https://meet.google.com/qck-8419-care
                            </div>
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send Invitation to Patient Email</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Issue Authorized Digital Prescription */}
                  {currentStepIndex === 4 && (
                    <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                      <div className="bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 text-white">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold">Issue Digital Prescription & Complete Visit</span>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Digitally Signed
                          </span>
                        </div>
                        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400">Diagnosis</span>
                            <p className="text-xs font-bold text-white">Patellar Tendinitis & Quadriceps Strain</p>
                          </div>
                          <div className="p-2 bg-slate-900 rounded-lg text-[10px] text-slate-300 space-y-0.5">
                            <p className="font-bold text-white">Rx Items:</p>
                            <p>• Aceclofenac 100mg + Paracetamol 325mg (Twice daily after meals - 5 days)</p>
                            <p>• Physiotherapy & ice pack compression</p>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">Archived to Patient & Doctor Records</span>
                            <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg">
                              Prescription Issued
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Captions Bar */}
            <div className="z-10 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 text-center text-xs text-slate-200 shadow-md">
              <span className={`font-bold mr-2 ${activeTrack === 'PATIENT' ? 'text-blue-400' : 'text-teal-400'}`}>
                {activeTrack === 'PATIENT' ? 'Patient Workflow:' : 'Doctor Workflow:'}
              </span>
              <span>{currentStep.caption}</span>
            </div>
          </div>
        </div>

        {/* Video Player Controls Bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
          {/* Progress Timeline Scrubber */}
          <div className="space-y-1">
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const targetStep = Math.min(
                  currentSteps.length - 1,
                  Math.floor(ratio * currentSteps.length)
                );
                const stepProgress = (ratio * currentSteps.length - targetStep) * 100;
                setCurrentStepIndex(targetStep);
                setProgress(stepProgress);
              }}
              className="w-full h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative group"
            >
              <div
                className={`h-full transition-all duration-150 ${
                  activeTrack === 'PATIENT'
                    ? 'bg-gradient-to-r from-blue-500 via-indigo-400 to-teal-400'
                    : 'bg-gradient-to-r from-teal-500 via-emerald-400 to-blue-400'
                }`}
                style={{
                  width: `${((currentStepIndex * 20) + (progress / 5))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{timeFormatted}</span>
              <span>Full Walkthrough Duration: 2:55</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Play / Pause & Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`p-2.5 rounded-xl text-white font-bold transition shadow-md cursor-pointer flex items-center justify-center ${
                  activeTrack === 'PATIENT'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
                title={isPlaying ? 'Pause Demo' : 'Play Demo'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Speed Controller */}
              <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
                {[1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      playbackSpeed === spd
                        ? activeTrack === 'PATIENT'
                          ? 'bg-blue-600 text-white'
                          : 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Step Selection Pills */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto">
              {currentSteps.map((st, idx) => {
                const isActive = idx === currentStepIndex;
                const Icon = st.icon;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStep(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? activeTrack === 'PATIENT'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>
                      {st.stepNumber}. {st.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Tools (Fullscreen) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Cinema / Fullscreen Mode'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Interactive Step Cards Below Video */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-6">
        {currentSteps.map((st, idx) => {
          const isActive = idx === currentStepIndex;
          const Icon = st.icon;
          return (
            <div
              key={st.id}
              onClick={() => handleSelectStep(idx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? activeTrack === 'PATIENT'
                    ? 'bg-blue-50/90 border-blue-500 shadow-md translate-y-[-2px]'
                    : 'bg-teal-50/90 border-teal-500 shadow-md translate-y-[-2px]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isActive
                      ? activeTrack === 'PATIENT'
                        ? 'bg-blue-600 text-white'
                        : 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? activeTrack === 'PATIENT'
                        ? 'bg-blue-200/80 text-blue-900'
                        : 'bg-teal-200/80 text-teal-900'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Step {st.stepNumber}
                </span>
              </div>
              <h3 className="text-xs font-extrabold text-slate-900 mb-1 leading-snug">{st.title}</h3>
              <p className="text-[11px] text-slate-500 leading-tight">{st.subtitle}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
