import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { PrescriptionModal } from '../../components/common/PrescriptionModal';
import {
  FilePlus,
  Plus,
  Trash2,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  User,
} from 'lucide-react';

export const CreatePrescription = () => {
  const [searchParams] = useSearchParams();
  const initialAptId = searchParams.get('appointmentId') || '';
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(initialAptId);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [medicines, setMedicines] = useState([
    {
      name: 'Paracetamol',
      dosage: '650mg',
      frequency: '1-0-1 (Morning & Night)',
      duration: '3 days',
      instructions: 'Take after food',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPrescription, setCreatedPrescription] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await appointmentService.getDoctorAppointments();
        if (res && res.data) {
          // Available for prescription: CONFIRMED or COMPLETED
          const list = res.data.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED');
          setAppointments(list);

          if (initialAptId) {
            const found = list.find((a) => a.appointmentId === initialAptId);
            if (found) {
              setSelectedAppointment(found);
            }
          } else if (list.length > 0) {
            setSelectedAppointmentId(list[0].appointmentId);
            setSelectedAppointment(list[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAppointments();
  }, [initialAptId]);

  const handleSelectAppointment = (id) => {
    setSelectedAppointmentId(id);
    const found = appointments.find((a) => a.appointmentId === id);
    setSelectedAppointment(found || null);
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: '',
        dosage: '',
        frequency: '1-0-1',
        duration: '5 days',
        instructions: 'Take after meals',
      },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedAppointment) {
      setError('Please select an appointment for this prescription.');
      return;
    }

    if (!diagnosis.trim()) {
      setError('Clinical diagnosis is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await prescriptionService.createPrescription({
        appointmentId: selectedAppointment.appointmentId,
        patientId: selectedAppointment.patientId,
        diagnosis,
        medicines,
        instructions,
        additionalNotes,
      });

      if (res && res.data) {
        setCreatedPrescription(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to issue prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Issue Digital Prescription</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Formulate official clinical diagnosis, specify medicines & dosages, and generate signed PDF prescriptions.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Appointment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Patient Consultation Visit *
            </label>
            {appointments.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                No active or confirmed patient appointments available to prescribe for.
              </div>
            ) : (
              <select
                value={selectedAppointmentId}
                onChange={(e) => handleSelectAppointment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                required
              >
                {appointments.map((a) => (
                  <option key={a.appointmentId} value={a.appointmentId}>
                    {a.patientName} • {a.appointmentDate} at {a.appointmentTime} ({a.status})
                  </option>
                ))}
              </select>
            )}

            {selectedAppointment && (
              <div className="mt-2.5 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900">Patient: {selectedAppointment.patientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>Date: {selectedAppointment.appointmentDate} ({selectedAppointment.appointmentTime})</span>
                </div>
                <div className="w-full text-slate-500 text-[11px]">
                  <strong>Chief Complaint:</strong> {selectedAppointment.reason || 'General Health Consultation'}
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Clinical Diagnosis *
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Viral Bronchitis / Hypertension Grade 1"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Medicines Repeater Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Prescribed Medicines (Rx)
              </label>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Drug Row
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[11px]">
                      Medicine #{index + 1}
                    </span>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete drug"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                        placeholder="Drug / Medicine Name (e.g. Amoxicillin)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        placeholder="Dosage (e.g. 500mg)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        placeholder="Duration (e.g. 5 days)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        placeholder="Frequency (e.g. 1-0-1 Morning & Night)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                        placeholder="Instructions (e.g. After food with water)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice & Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Doctor's Dietary Advice & Instructions
            </label>
            <textarea
              rows="3"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Drink 3 liters of warm water daily, avoid oily foods, complete antibiotic course..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Additional Notes / Follow-up Advice
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Follow-up consultation in 7 days if symptoms persist."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || !selectedAppointment}
              className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/25 transition active:scale-95 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? 'Signing Prescription...' : 'Sign & Issue Digital Prescription'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal on Success */}
      {createdPrescription && (
        <PrescriptionModal
          prescription={createdPrescription}
          onClose={() => {
            setCreatedPrescription(null);
            navigate('/doctor');
          }}
        />
      )}
    </div>
  );
};
