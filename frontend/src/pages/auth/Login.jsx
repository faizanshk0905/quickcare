import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      if (!err.response || err.code === 'ERR_NETWORK' || err.response?.status === 500 || err.response?.status === 502) {
        setError('Cannot connect to the backend server. Please ensure Spring Boot is running on port 8080 (run start-backend.bat).');
      } else {
        setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Quick-Fill Helpers
  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
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

        {/* Quick Demo Credentials Box (Crucial for Evaluation) */}
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              1-Click Demo Evaluation Profiles
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('patient@quickcare.com', 'patient123')}
              className="px-2 py-1.5 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 shadow-2xs transition"
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('priya.deshmukh@quickcare.com', 'doctor123')}
              className="px-2 py-1.5 bg-white hover:bg-blue-100 text-teal-700 font-bold rounded-lg border border-blue-200 shadow-2xs transition"
            >
              Doctor
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@quickcare.com', 'admin123')}
              className="px-2 py-1.5 bg-white hover:bg-blue-100 text-purple-700 font-bold rounded-lg border border-blue-200 shadow-2xs transition"
            >
              Admin
            </button>
          </div>
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@quickcare.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2"
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
