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
  ExternalLink,
  Settings,
  X,
  ChevronRight,
  ShieldCheck,
  Clock,
  Send,
  Download,
  Stethoscope,
  Users,
} from 'lucide-react';

export const AiExplainerVideo = () => {
  // Video Mode: 'interactive' (built-in animated AI simulator) or 'embed' (YouTube / MP4)
  const [videoMode, setVideoMode] = useState('interactive');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Custom Video URL storage
  const [customVideoUrl, setCustomVideoUrl] = useState(() => {
    return (
      localStorage.getItem('quickcare_explainer_video_url') ||
      'https://www.youtube.com/embed/dQw4w9WgXcQ' // placeholder or custom embed
    );
  });
  const [urlInput, setUrlInput] = useState(customVideoUrl);

  const containerRef = useRef(null);

  // 4 Core AI Explainer Chapters
  const chapters = [
    {
      id: 0,
      title: '1. AI Symptom Triaging',
      tag: 'AI Triaging Engine',
      duration: '0:35',
      summary: 'Multilingual symptom triaging in English, Hindi & Marathi',
      caption:
        'Patient asks QuickCare AI about health symptoms. The AI assesses clinical urgency and routes directly to verified medical specialists.',
      color: 'blue',
      icon: Bot,
    },
    {
      id: 1,
      title: '2. Live 15-Min Slot Booking',
      tag: 'Atomic Booking',
      duration: '0:35',
      summary: 'Dynamic doctor schedule with atomic double-booking prevention',
      caption:
        'Patient selects date and real-time 15-minute slot. Concurrency-safe slot locking ensures no duplicate bookings occur across the platform.',
      color: 'teal',
      icon: Calendar,
    },
    {
      id: 2,
      title: '3. Google Meet Video Consultation',
      tag: 'Doctor Controlled',
      duration: '0:35',
      summary: 'Private Google Meet invitations sent directly by doctors',
      caption:
        'Doctor reviews patient details, approves consultation, generates Google Meet link, and dispatches an instant invitation email to the patient.',
      color: 'indigo',
      icon: Video,
    },
    {
      id: 3,
      title: '4. Digital Rx & Medical History',
      tag: 'Instant Digital Rx',
      duration: '0:35',
      summary: 'Authorized digital prescriptions with 1-click PDF download',
      caption:
        'Consultation concludes with doctor issuing an encrypted digital prescription. Patient downloads PDF instantly and views complete medical history.',
      color: 'emerald',
      icon: FileText,
    },
  ];

  // Auto-progress simulation in interactive mode
  useEffect(() => {
    if (!isPlaying || videoMode !== 'interactive') return;

    const intervalTime = 100 / (playbackSpeed * 10); // step rate
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next chapter or loop
          setCurrentChapterIndex((prevChapter) => (prevChapter + 1) % chapters.length);
          return 0;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, videoMode, playbackSpeed, chapters.length]);

  // Jump to specific chapter
  const handleSelectChapter = (index) => {
    setCurrentChapterIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentChapterIndex(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSaveCustomUrl = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      let clean = urlInput.trim();
      // Handle standard youtube watch urls -> embed urls
      if (clean.includes('watch?v=')) {
        clean = clean.replace('watch?v=', 'embed/');
      } else if (clean.includes('youtu.be/')) {
        clean = clean.replace('youtu.be/', 'youtube.com/embed/');
      }
      setCustomVideoUrl(clean);
      localStorage.setItem('quickcare_explainer_video_url', clean);
      setVideoMode('embed');
      setShowSettingsModal(false);
    }
  };

  const currentChapter = chapters[currentChapterIndex];

  // Calculate simulated time
  const totalSeconds = 140; // 2 mins 20 secs
  const currentTotalSeconds = Math.floor(
    (currentChapterIndex * 35) + (progress / 100) * 35
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
          <span>Interactive AI Explainer Video Tour</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Watch How <span className="text-blue-600">QuickCare Works</span> in 2 Minutes
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          See how our AI triages symptoms, automates 15-minute appointment scheduling, powers private Google Meet video consultations, and issues instant digital prescriptions.
        </p>

        {/* Video Mode Selector Pill */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex items-center gap-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setVideoMode('interactive');
                setIsPlaying(true);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                videoMode === 'interactive'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>Interactive AI Tour</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVideoMode('embed');
                setIsPlaying(true);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                videoMode === 'embed'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-teal-600" />
              <span>Embedded Video Player</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title="Configure Custom Video URL"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Showcase Container */}
      <div
        ref={containerRef}
        className={`bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col justify-between' : ''
        }`}
      >
        {/* Video Screen Area */}
        <div className="relative aspect-video max-h-[580px] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {videoMode === 'embed' ? (
            /* Embedded Real Video Player (YouTube / Vimeo / MP4) */
            <div className="w-full h-full relative">
              <iframe
                src={`${customVideoUrl}?autoplay=1&rel=0`}
                title="QuickCare AI Video Explainer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            /* Built-in Interactive AI Simulated Video Walkthrough */
            <div className="w-full h-full p-4 sm:p-8 flex flex-col justify-between relative select-none">
              {/* Subtle Animated Background Gradients */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Bar inside Video Screen */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-blue-600/90 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>QuickCare AI Engine</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300 hidden sm:inline">
                    {currentChapter.tag}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-mono">
                    {timeFormatted} / 2:20
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Interactive Stage / Scene Representation */}
              <div className="my-auto py-4 z-10">
                {currentChapterIndex === 0 && (
                  /* SCENE 1: AI Symptom Triaging */
                  <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                    <div className="flex items-start gap-3 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                        U
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400">Patient Symptom Query (English / Hindi / Marathi)</p>
                        <p className="text-sm font-semibold text-white">
                          "I have acute lower back pain radiating down my left leg for 3 days. Which specialist should I consult?"
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
                            Verified Match: Orthopedics
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          Your symptoms suggest potential lumbar radiculopathy (sciatica). I have routed you to our verified{' '}
                          <strong className="text-teal-300">Orthopedic & Spine Specialists</strong>.
                        </p>
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-teal-400" />
                            <span className="text-xs font-bold text-white">Dr. Vivek (Orthopedics)</span>
                          </div>
                          <span className="text-[10px] text-blue-400 font-bold">15-Min Slots Available Today</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentChapterIndex === 1 && (
                  /* SCENE 2: Atomic 15-Minute Slot Scheduling */
                  <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                    <div className="bg-slate-800/90 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-white">
                          <Calendar className="w-4 h-4 text-teal-400" />
                          <span className="text-xs font-bold">Select Date & 15-Min Live Slot</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Atomic Lock Active
                        </span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                        {['10:00 AM', '10:15 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:15 PM', '05:00 PM', '06:30 PM'].map((slot, idx) => {
                          const isSelected = slot === '10:15 AM';
                          const isBooked = slot === '10:00 AM';
                          return (
                            <div
                              key={slot}
                              className={`p-2 rounded-xl text-center font-bold text-[11px] transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md scale-105'
                                  : isBooked
                                  ? 'bg-slate-900 text-slate-500 opacity-60 line-through'
                                  : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {slot}
                              {isSelected && <span className="block text-[8px] text-blue-200 font-normal">Selected</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3 bg-emerald-950/60 border border-emerald-600/40 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>10:15 AM Slot Locked for Patient (No Double-Booking)</span>
                        </div>
                        <span className="text-[10px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {currentChapterIndex === 2 && (
                  /* SCENE 3: Doctor Controlled Google Meet */
                  <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                    <div className="bg-slate-800/90 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-white">
                          <Video className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold">Doctor Clinical Portal – Video Consultation</span>
                        </div>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">
                          Google Meet Only
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between">
                          <div>
                            <p className="text-white font-bold text-xs">Appointment #QC-8419</p>
                            <p className="text-[10px] text-slate-400">Patient: John Doe | 10:15 AM Video Consultation</p>
                          </div>
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded font-bold text-[10px]">
                            Approved
                          </span>
                        </div>

                        <div className="p-3 bg-indigo-950/60 border border-indigo-600/40 rounded-xl space-y-2">
                          <p className="text-[11px] font-bold text-indigo-200">Doctor Dispatches Google Meet Link:</p>
                          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-indigo-500/30 text-[11px] font-mono text-emerald-300">
                            <span>https://meet.google.com/qck-8419-care</span>
                          </div>
                          <p className="text-[10px] text-slate-300 flex items-center gap-1">
                            <Send className="w-3 h-3 text-indigo-400" />
                            Email dispatched immediately to patient registered inbox with 1-click Join link.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentChapterIndex === 3 && (
                  /* SCENE 4: Instant Digital Prescription */
                  <div className="max-w-xl mx-auto space-y-3 animate-fade-in">
                    <div className="bg-slate-800/90 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-white">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold">Authorized Digital e-Prescription</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          Doctor Digitally Signed
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-xs space-y-2">
                        <div className="flex justify-between text-slate-300 text-[11px]">
                          <span>Diagnosis: <strong>Lumbar Spine Strain</strong></span>
                          <span>Rx Date: <strong>Today</strong></span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg space-y-1 text-[10px] text-slate-300">
                          <p className="font-bold text-white">Prescribed Medications:</p>
                          <p>1. Aceclofenac + Paracetamol 100mg/325mg (1 tab twice daily after meals - 5 days)</p>
                          <p>2. Thiocolchicoside 4mg (1 tab at night - 5 days)</p>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400">Stored securely in Patient Cloud History</span>
                          <button
                            type="button"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download Official PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Captions Bar */}
              <div className="z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 text-center text-xs text-slate-200 shadow-md">
                <span className="font-bold text-teal-400 mr-2">AI Narrator:</span>
                <span>{currentChapter.caption}</span>
              </div>
            </div>
          )}
        </div>

        {/* Video Player Controls Bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
          {/* Progress Timeline Scrubber */}
          <div className="space-y-1">
            <div
              onClick={(e) => {
                if (videoMode === 'interactive') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  const targetChapter = Math.min(
                    chapters.length - 1,
                    Math.floor(ratio * chapters.length)
                  );
                  const chapterProgress = (ratio * chapters.length - targetChapter) * 100;
                  setCurrentChapterIndex(targetChapter);
                  setProgress(chapterProgress);
                }
              }}
              className="w-full h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative group"
            >
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500 transition-all duration-150"
                style={{
                  width: `${((currentChapterIndex * 25) + (progress / 4))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{timeFormatted}</span>
              <span>Total Duration: 2:20</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Play / Pause & Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md cursor-pointer flex items-center justify-center"
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
                      playbackSpeed === spd ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Selection Pills */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto">
              {chapters.map((ch, idx) => {
                const isActive = idx === currentChapterIndex;
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChapter(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600/90 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{ch.title}</span>
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

      {/* 4 Interactive Feature Cards Below Video */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {chapters.map((ch, idx) => {
          const isActive = idx === currentChapterIndex;
          const Icon = ch.icon;
          return (
            <div
              key={ch.id}
              onClick={() => handleSelectChapter(idx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50/80 border-blue-500 shadow-md translate-y-[-2px]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-200/80 text-blue-900' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {ch.duration}
                </span>
              </div>
              <h3 className="text-xs font-extrabold text-slate-900 mb-1">{ch.title}</h3>
              <p className="text-[11px] text-slate-500 leading-snug">{ch.summary}</p>
            </div>
          );
        })}
      </div>

      {/* Custom Video URL Configuration Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Custom Video Source</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              You can connect an AI-generated explainer video from YouTube, Vimeo, or an MP4 URL (e.g. created using HeyGen, Synthesia, or InVideo).
            </p>

            <form onSubmit={handleSaveCustomUrl} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Video Embed URL</label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save & Switch to Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
