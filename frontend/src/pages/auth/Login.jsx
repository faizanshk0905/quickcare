import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

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
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
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

        {/* Form Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
              {error.toLowerCase().includes('register') && (
                <div className="pt-2 border-t border-rose-200/60 flex items-center gap-3 text-[11px] font-bold">
                  <Link to="/register" className="text-blue-700 hover:text-blue-900 underline">
                    Register as Patient &rarr;
                  </Link>
                  <span className="text-rose-300">|</span>
                  <Link to="/register-doctor" className="text-teal-700 hover:text-teal-900 underline">
                    Register as Doctor &rarr;
                  </Link>
                </div>
              )}
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
                    if (error) setError('');
                  }}
                  placeholder="name@example.com"
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
                    if (error) setError('');
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

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2.5">
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
            <p className="text-[11px] text-slate-400 pt-1">
              Hospital Administration: Sign in with authorized administrator credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
