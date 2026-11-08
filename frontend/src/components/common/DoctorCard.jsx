import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Calendar, Clock, Award, ShieldCheck } from 'lucide-react';

export const DoctorCard = ({ doctor }) => {
  const isMale = doctor.gender?.toLowerCase() === 'male';
  const defaultFallback = isMale
    ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
    : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col justify-between group">
      <div>
        <div className="relative mb-4">
          <img
            src={doctor.profileImage || defaultFallback}
            alt={doctor.fullName}
            className="w-full h-48 object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = defaultFallback;
            }}
          />
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-xs">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{doctor.rating ? doctor.rating.toFixed(1) : '4.8'}</span>
            <span className="text-slate-400 font-normal">({doctor.reviewCount || 48})</span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {doctor.gender && (
              <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                {doctor.gender === 'Female' ? '👩‍⚕️ Female' : doctor.gender === 'Male' ? '👨‍⚕️ Male' : doctor.gender}
              </span>
            )}
            {doctor.verificationStatus === 'VERIFIED' && (
              <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              {doctor.specialization}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {doctor.experience} yrs exp
            </span>
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {doctor.fullName}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{doctor.qualification}</p>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.clinicAddress || 'QuickCare Clinic'}</span>
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{doctor.workingHours || '09:00 AM - 05:00 PM'}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">Consultation Fee</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white">₹{doctor.consultationFee}</span>
        </div>
        <Link
          to={`/doctors/${doctor.doctorId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Visit</span>
        </Link>
      </div>
    </div>
  );
};
