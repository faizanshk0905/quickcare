import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  Sun,
  Moon,
  Settings,
} from 'lucide-react';

export const Navbar = () => {
  const { t } = useTranslation();
  const { user, role, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdown and mobile menu automatically upon navigation
  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Handle outside click and Escape key dismissal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && !e.target.closest('[data-mobile-toggle]')) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'DOCTOR') return '/doctor';
    return '/patient';
  };

  const getProfilePath = () => {
    if (role === 'DOCTOR') return '/doctor/profile';
    if (role === 'ADMIN') return '/admin/settings';
    return '/patient/profile';
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  QUICK<span className="text-blue-600 dark:text-blue-400">CARE</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-semibold leading-none">
                  Your Health, Our Priority
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center ml-8 space-x-1">
              <Link
                to="/"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/doctors"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t('nav.findDoctors')}
              </Link>
              <Link
                to="/about"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t('nav.about')}
              </Link>
              <Link
                to="/contact"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t('nav.contact')}
              </Link>
            </div>
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle Button (Light / Dark Mode) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                >
                  {role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                  {role === 'DOCTOR' && <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                  {role === 'PATIENT' && <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  <span>{t('nav.dashboard')}</span>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition focus:outline-none cursor-pointer"
                    aria-expanded={userDropdownOpen}
                    aria-label="User Profile Menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center text-slate-700 dark:text-slate-200 text-xs font-bold">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user?.fullName?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {user?.fullName?.split(' ')[0]}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{role?.toLowerCase()}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        userDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700/80">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                        >
                          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                          <span>{t('nav.dashboard')}</span>
                        </Link>

                        <Link
                          to={getProfilePath()}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                        >
                          <User className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                          <span>Profile & Account</span>
                        </Link>

                        {role === 'PATIENT' && (
                          <Link
                            to="/patient/prescriptions"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                          >
                            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                            <span>{t('nav.prescriptions')}</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('nav.logout')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            {isAuthenticated && <NotificationDropdown />}
            <button
              data-mobile-toggle="true"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-6 space-y-2 animate-in fade-in duration-150"
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('nav.findDoctors')}
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('nav.about')}
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('nav.contact')}
          </Link>

          {isAuthenticated ? (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>

              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
              >
                {t('nav.dashboard')} ({role})
              </Link>
              <Link
                to={getProfilePath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Profile & Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
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
