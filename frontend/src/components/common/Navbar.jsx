import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  HeartPulse,
  Menu,
  X,
  User,
  LogOut,
  Calendar,
  FileText,
  Shield,
  Stethoscope,
  ChevronDown,
} from 'lucide-react';

export const Navbar = () => {
  const { t } = useTranslation();
  const { user, role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'DOCTOR') return '/doctor';
    return '/patient';
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  QUICK<span className="text-blue-600">CARE</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-wider text-teal-600 font-semibold leading-none">
                  Your Health, Our Priority
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center ml-8 space-x-1">
              <Link
                to="/"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/doctors"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
              >
                {t('nav.findDoctors')}
              </Link>
              <Link
                to="/about"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
              >
                {t('nav.about')}
              </Link>
              <Link
                to="/contact"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
              >
                {t('nav.contact')}
              </Link>
            </div>
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                >
                  {role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-purple-600" />}
                  {role === 'DOCTOR' && <Stethoscope className="w-3.5 h-3.5 text-teal-600" />}
                  {role === 'PATIENT' && <Calendar className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{t('nav.dashboard')}</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center text-slate-700 text-xs font-bold">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user?.fullName?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">
                        {user?.fullName?.split(' ')[0]}
                      </p>
                      <span className="text-[10px] text-slate-500 capitalize">{role?.toLowerCase()}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800">{user?.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {t('nav.dashboard')}
                      </Link>
                      {role === 'PATIENT' && (
                        <Link
                          to="/patient/prescriptions"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          {t('nav.prescriptions')}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 rounded-xl hover:bg-slate-50 transition"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition shadow-blue-500/20"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('nav.findDoctors')}
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('nav.about')}
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('nav.contact')}
          </Link>

          {isAuthenticated ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-600 bg-blue-50"
              >
                {t('nav.dashboard')} ({role})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
