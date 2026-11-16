import React, { useState, useEffect, useRef } from 'react';
import { Mail, ShieldCheck, Clock, RefreshCw, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

export const OtpVerificationView = ({
  email,
  role = 'PATIENT',
  fullName = '',
  onVerified,
  onBack,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // 5 minutes expiry countdown (300 seconds)
  const [expirySeconds, setExpirySeconds] = useState(300);
  
  // 45 seconds resend cooldown
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // Auto-focus first input box
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Expiration timer countdown
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const interval = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [expirySeconds]);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    setError('');
    const cleanVal = value.replace(/[^0-9]/g, '');
    
    // Support pasting multi-digit code
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      const nextDigits = [...digits];
      pasted.forEach((d, i) => {
        if (i < 6) nextDigits[i] = d;
      });
      setDigits(nextDigits);
      const focusIndex = Math.min(pasted.length, 5);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus();
      }
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleanVal ? cleanVal[0] : '';
    setDigits(nextDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const cleanNumbers = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
    if (cleanNumbers.length > 0) {
      const nextDigits = [...digits];
      for (let i = 0; i < cleanNumbers.length; i++) {
        nextDigits[i] = cleanNumbers[i];
      }
      setDigits(nextDigits);
      const nextFocus = Math.min(cleanNumbers.length, 5);
      if (inputRefs.current[nextFocus]) {
        inputRefs.current[nextFocus].focus();
      }
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('Verification code has expired. Please click "Resend Code" to receive a fresh OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.verifyOtp({ email, otp });
      setSuccessMsg('Email verified successfully! Activating your account...');
      setTimeout(() => {
        onVerified(otp);
      }, 700);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Incorrect verification code. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      await authService.resendOtp({ email, role, fullName });
      setDigits(['', '', '', '', '', '']);
      setExpirySeconds(300); // Reset 5-minute timer
      setResendCooldown(45); // 45s cooldown
      setSuccessMsg('A new 6-digit verification code has been dispatched to your email.');
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend verification code. Please wait and try again.');
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 space-y-6">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Details</span>
          </button>
        )}

        {/* Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-blue-100">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Verify Your Email
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            We sent a 6-digit verification code to
          </p>
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-full font-mono font-bold text-xs text-slate-800 border border-slate-200">
            {email}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* 6-Digit OTP Inputs */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-extrabold font-mono rounded-2xl border-2 transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  digit
                    ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                    : 'border-slate-200 bg-slate-50/70 text-slate-800 focus:border-blue-500 focus:bg-white'
                }`}
              />
            ))}
          </div>

          {/* Expiry Timer */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold">
            <Clock className={`w-4 h-4 ${expirySeconds < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-slate-500">Code expires in:</span>
            <span
              className={`font-mono font-bold ${
                expirySeconds < 60 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {formatTimer(expirySeconds)}
            </span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={!isComplete || loading || expirySeconds <= 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition active:scale-98 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Activate Account</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Section with Countdown */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">Didn't receive the email code?</p>
          {resendCooldown > 0 ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Resend available in <strong className="font-mono text-slate-900">{resendCooldown}s</strong></span>
            </div>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition underline underline-offset-4 disabled:opacity-50"
            >
              {resending ? 'Sending New Code...' : 'Resend Verification Code'}
            </button>
          )}
        </div>

        {/* Security badge */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-[11px] text-slate-500 text-center flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Quick Care 256-Bit SHA Encrypted OTP Verification</span>
        </div>
      </div>
    </div>
  );
};
