import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import { DoctorCard } from '../../components/common/DoctorCard';
import { Search, Filter, Stethoscope, SlidersHorizontal, RefreshCw } from 'lucide-react';

export const OurDoctors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpec = searchParams.get('specialization') || 'ALL';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState(initialSpec);
  const [minExp, setMinExp] = useState(0);
  const [maxFee, setMaxFee] = useState(2000);

  const specializations = [
    'ALL',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'General Physician',
    'Dentistry',
    'Psychiatry',
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.query = query.trim();
      if (specialization && specialization !== 'ALL') params.specialization = specialization;
      if (minExp > 0) params.minExperience = minExp;
      if (maxFee < 2000) params.maxFee = maxFee;

      const res = await doctorService.searchDoctors(params);
      if (res && res.data) {
        setDoctors(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialization, minExp, maxFee]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const resetFilters = () => {
    setQuery('');
    setSpecialization('ALL');
    setMinExp(0);
    setMaxFee(2000);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
          Verified Medical Faculty
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
          Find Top Doctors & Specialists
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Browse verified doctors, filter by clinical specialization, fees, and years of experience, and schedule your appointment in seconds.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search doctor by name, qualification, or clinic..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-sm transition shrink-0"
          >
            Search
          </button>
        </form>

        {/* Specialization Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 font-bold shrink-0">Speciality:</span>
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => {
                setSpecialization(spec);
                setSearchParams(spec === 'ALL' ? {} : { specialization: spec });
              }}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition shrink-0 ${
                specialization === spec
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Sliders row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="font-semibold text-slate-700 flex justify-between mb-1">
              <span>Min Experience</span>
              <span className="text-blue-600 font-bold">{minExp}+ years</span>
            </label>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 flex justify-between mb-1">
              <span>Max Consultation Fee</span>
              <span className="text-teal-600 font-bold">₹{maxFee}</span>
            </label>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>

          <div className="flex items-end justify-start sm:justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Available Verified Doctors ({doctors.length})
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading doctors...
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No doctors match your filters</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your specialization, experience, or fee range to see more specialists.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.doctorId} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
