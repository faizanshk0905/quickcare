import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Check, Clock, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { appointmentService } from '../../services/appointmentService';

export const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  const dropdownRef = useRef(null);
  const location = useLocation();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s for updates
    return () => clearInterval(interval);
  }, []);

  // Close when navigating to another page
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmationResponse = async (appointmentId, response, notificationId, e) => {
    e.stopPropagation();
    try {
      const res = await appointmentService.confirmAvailability(appointmentId, response);
      setActionFeedback(res?.message || 'Response recorded successfully.');
      // Mark notification read
      await notificationService.markAsRead(notificationId);
      fetchNotifications();
      setTimeout(() => setActionFeedback(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Action failed.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-rose-500 rounded-full px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {actionFeedback && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold text-center border-b border-emerald-100 animate-in fade-in">
              {actionFeedback}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                    !n.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      !n.isRead ? 'bg-blue-600' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    {/* 15-MINUTE CONFIRMATION ACTION BUTTONS */}
                    {n.type === 'CONFIRMATION_REQUEST' && !n.isRead && (
                      <div className="mt-2 pt-2 border-t border-blue-100 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(e) =>
                            handleConfirmationResponse(n.referenceId, 'YES', n.notificationId, e)
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase rounded-lg shadow-2xs transition flex items-center gap-1 active:scale-95"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>YES, I AM AVAILABLE</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleConfirmationResponse(n.referenceId, 'NO', n.notificationId, e)
                          }
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase rounded-lg shadow-2xs transition flex items-center gap-1 active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>NO, I AM NOT AVAILABLE</span>
                        </button>
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.notificationId, e)}
                      title="Mark read"
                      className="p-1 hover:bg-white rounded text-slate-400 hover:text-blue-600 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
