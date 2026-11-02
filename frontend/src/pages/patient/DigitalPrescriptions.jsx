import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../../services/prescriptionService';
import { PrescriptionModal } from '../../components/common/PrescriptionModal';
import {
  FileText,
  Search,
  Download,
  Calendar,
  Stethoscope,
  Pill,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export const DigitalPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const res = await prescriptionService.getPatientPrescriptions();
        if (res && res.data) {
          setPrescriptions(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  const filtered = prescriptions.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.doctorName?.toLowerCase().includes(q) ||
      p.diagnosis?.toLowerCase().includes(q) ||
      p.doctorSpecialization?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Digital Prescriptions</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access, view instructions, and securely download official medical prescriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor or diagnosis..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading prescriptions...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No prescriptions found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Prescriptions issued by doctors after consultations will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((rx) => (
            <div
              key={rx.prescriptionId}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-full flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {rx.consultationDate}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {rx.prescriptionId}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    Dr. {rx.doctorName}
                  </h3>
                  <p className="text-xs text-slate-500">{rx.doctorSpecialization}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                    Diagnosis
                  </span>
                  <p className="font-semibold text-slate-800 line-clamp-2">{rx.diagnosis}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Prescribed Medicines ({rx.medicines?.length || 0})
                  </span>
                  <div className="space-y-1">
                    {rx.medicines?.slice(0, 2).map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs text-slate-700 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100"
                      >
                        <span className="font-semibold truncate flex items-center gap-1">
                          <Pill className="w-3 h-3 text-blue-500" /> {m.name}
                        </span>
                        <span className="text-[10px] text-slate-500">{m.dosage}</span>
                      </div>
                    ))}
                    {(rx.medicines?.length || 0) > 2 && (
                      <p className="text-[10px] text-blue-600 font-medium">
                        +{rx.medicines.length - 2} more medicines...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPrescription(rx)}
                  className="flex-1 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> View Details
                </button>
                <button
                  onClick={() => setSelectedPrescription(rx)}
                  className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPrescription && (
        <PrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </div>
  );
};
