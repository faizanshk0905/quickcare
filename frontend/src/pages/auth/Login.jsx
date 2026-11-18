import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Mail, Lock, AlertCircle, ArrowRight, Sparkles, Check, RotateCcw } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [fillMessage, setFillMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      const userRole = data?.role;

      // Navigate to destination or role dashboard
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (userRole === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'DOCTOR') {
        navigate('/doctor', { replace: true });
      } else {
        navigate('/patient', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (
        !err.response ||
        err.code === 'ERR_NETWORK' ||
        err.response?.status === 500 ||
        err.response?.status === 502 ||
        err.response?.status === 405 ||
        err.response?.status === 404
      ) {
        setError(msg || 'Account not found. Please verify your email and password or register a new account.');
      } else {
        setError(msg || 'Login failed. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Only fills credentials into the input fields — DOES NOT auto-login or redirect!
  const handleQuickFill = (roleType) => {
    setError('');
    setSelectedRole(roleType);

    if (roleType === 'PATIENT') {
      setEmail('patient@quickcare.com');
      setPassword('password123');
      setFillMessage('Sample Patient credentials filled. You can modify or click "Sign In to Account" below.');
    } else if (roleType === 'DOCTOR') {
      setEmail('doctor@quickcare.com');
      setPassword('password123');
      setFillMessage('Sample Doctor credentials filled. You can enter your own doctor email & password, then click "Sign In".');
    } else if (roleType === 'ADMIN') {
      setEmail('admin@quickcare.com');
      setPassword('password123');
      setFillMessage('Sample Admin credentials filled. Click "Sign In to Account" below.');
    }
  };

  const handleClear = () => {
    setEmail('');
    setPassword('');
    setSelectedRole(null);
    setFillMessage('');
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/25">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to QuickCare
          </h2>
          <p className="text-xs text-slate-500">
            Access your appointments, medical records, and telemedicine consultations
          </p>
        </div>

        {/* Quick-Fill Sample Credentials Box (No Automatic Login) */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Quick-Fill Sample Credentials (Optional)
            </span>
            {(email || password) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Click a button to fill sample credentials into the form, or directly type your own email and password below.
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('PATIENT')}
              className={`px-2.5 py-2 font-bold rounded-xl border transition active:scale-95 cursor-pointer text-center ${
                selectedRole === 'PATIENT'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
              }`}
              title="Fill Sample Patient Credentials"
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('DOCTOR')}
              className={`px-2.5 py-2 font-bold rounded-xl border transition active:scale-95 cursor-pointer text-center ${
                selectedRole === 'DOCTOR'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white hover:bg-teal-50 text-teal-700 border-teal-200 shadow-2xs'
              }`}
              title="Fill Sample Doctor Credentials"
            >
              Doctor
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className={`px-2.5 py-2 font-bold rounded-xl border transition active:scale-95 cursor-pointer text-center ${
                selectedRole === 'ADMIN'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200 shadow-2xs'
              }`}
              title="Fill Sample Admin Credentials"
            >
              Admin
            </button>
          </div>

          {fillMessage && (
            <div className="p-2 bg-white rounded-lg border border-blue-200 text-[11px] text-blue-800 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{fillMessage}</span>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFillMessage('');
                  }}
                  placeholder="name@quickcare.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFillMessage('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
                Register as Patient
              </Link>
            </p>
            <p>
              Medical Doctor?{' '}
              <Link to="/register-doctor" className="font-bold text-teal-600 hover:text-teal-800">
                Doctor Registration Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};