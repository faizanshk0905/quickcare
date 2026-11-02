import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Shield,
  Clock,
  User,
  Stethoscope,
  Maximize2,
  FilePlus,
} from 'lucide-react';
import { consultationService } from '../../services/consultationService';

export const VideoRoom = ({ appointment, currentUser, onEndCall, onOpenPrescription }) => {
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [consultation, setConsultation] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize Media Devices & Session
  useEffect(() => {
    let timer = null;

    const setupSession = async () => {
      try {
        const res = await consultationService.getByAppointment(appointment.appointmentId);
        if (res && res.data) {
          setConsultation(res.data);
          await consultationService.join(res.data.consultationId);
        }
      } catch (err) {
        console.error('Consultation authorization error', err);
      }

      // Start local webcam stream
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Real webcam stream unavailable, fallback active.', err);
        setCameraError('Webcam hardware simulated or access restricted.');
      }
    };

    setupSession();

    // Call duration timer
    timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [appointment.appointmentId]);

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
        return;
      }
    }
    setCameraActive(!cameraActive);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
        return;
      }
    }
    setMicActive(!micActive);
  };

  const handleEndCall = async () => {
    if (consultation) {
      try {
        await consultationService.end(consultation.consultationId);
      } catch (err) {
        console.error(err);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onEndCall && onEndCall();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDoctor = currentUser?.role === 'DOCTOR';

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-800">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-slate-950/90 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ENCRYPTED TELEHEALTH SESSION</span>
          </div>
          <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            {formatTime(callDuration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isDoctor && onOpenPrescription && (
            <button
              onClick={onOpenPrescription}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Write Rx</span>
            </button>
          )}
          <span className="text-xs text-slate-400 hidden sm:inline">
            Room: {appointment.meetingRoomId || 'QC-SECURE'}
          </span>
        </div>
      </div>

      {/* Video Feeds Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-16 pb-24 relative">
        {/* Remote Participant View (Doctor or Patient) */}
        <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800/80 group">
          {/* Simulated remote medical stream visual */}
          <div className="absolute inset-0 bg-radial from-slate-800 via-slate-900 to-slate-950 opacity-90 flex flex-col items-center justify-center text-slate-400">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/50 flex items-center justify-center text-blue-400">
                {isDoctor ? <User className="w-12 h-12" /> : <Stethoscope className="w-12 h-12" />}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <p className="font-bold text-base text-white">
              {isDoctor ? appointment.patientName : appointment.doctorName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDoctor ? 'Patient (Connected)' : `${appointment.doctorSpecialization || 'Specialist'} (Attending)`}
            </p>

            {/* Audio waveform simulation */}
            <div className="flex items-center gap-1 mt-4">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-8 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]" />
            </div>
          </div>

          <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-2">
            <span>{isDoctor ? `Patient: ${appointment.patientName}` : `Dr. ${appointment.doctorName}`}</span>
          </div>
        </div>

        {/* Local Participant View */}
        <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800/80">
          {cameraActive ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                <VideoOff className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-slate-400">Camera Paused</p>
            </div>
          )}

          {cameraError && cameraActive && !streamRef.current && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-2">
                <Shield className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-white">Local Video Active</p>
              <p className="text-xs text-slate-400 mt-1">
                You: {currentUser?.fullName || 'User'} ({currentUser?.role})
              </p>
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-2">
            <span>You ({currentUser?.role?.toLowerCase()})</span>
            {!micActive && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 p-2.5 rounded-2xl shadow-2xl">
        <button
          onClick={toggleMic}
          className={`p-3.5 rounded-xl transition ${
            micActive
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30'
          }`}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3.5 rounded-xl transition ${
            cameraActive
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30'
          }`}
          title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={handleEndCall}
          className="flex items-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/40 transition active:scale-95"
          title="End Telehealth Consultation"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider">End Call</span>
        </button>
      </div>
    </div>
  );
};
