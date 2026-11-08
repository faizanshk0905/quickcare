import React from 'react';
import { jsPDF } from 'jspdf';
import { X, Download, FileText, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';

export const PrescriptionModal = ({ prescription, onClose }) => {
  if (!prescription) return null;

  const downloadPdf = () => {
    const doc = new jsPDF();

    // Brand Header
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('QUICK CARE HEALTHCARE', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Certified Telemedicine & Digital Healthcare Platform', 14, 25);
    doc.text(`Prescription ID: ${prescription.prescriptionId || 'RX-001'}`, 140, 25);

    // Doctor & Clinic Information
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dr. ${prescription.doctorName || 'Attending Physician'}`, 14, 42);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${prescription.doctorSpecialization || 'General Medicine'} | ${prescription.doctorQualification || 'MBBS'}`, 14, 48);
    doc.text(`${prescription.clinicDetails || 'QuickCare Medical Center'}`, 14, 53);

    // Date
    doc.text(`Consultation Date: ${prescription.consultationDate || new Date().toISOString().split('T')[0]}`, 140, 42);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 58, 196, 58);

    // Patient Information
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 62, 182, 18, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Patient: ${prescription.patientName || 'Patient'}`, 18, 73);

    // Diagnosis Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DIAGNOSIS & CLINICAL IMPRESSION:', 14, 90);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(prescription.diagnosis || 'General checkup and consultation.', 14, 97);

    // Rx Symbol & Medicine Table
    doc.setFontSize(16);
    doc.setFont('times', 'bolditalic');
    doc.setTextColor(37, 99, 235);
    doc.text('Rx', 14, 112);

    let yPos = 120;
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, yPos - 6, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Medicine / Drug Name', 18, yPos);
    doc.text('Dosage', 85, yPos);
    doc.text('Frequency', 115, yPos);
    doc.text('Duration', 145, yPos);
    doc.text('Instructions', 170, yPos);

    yPos += 8;

    doc.setFont('helvetica', 'normal');
    const medicines = prescription.medicines || [];
    medicines.forEach((med, i) => {
      doc.text(med.name || 'Medicine', 18, yPos);
      doc.text(med.dosage || '-', 85, yPos);
      doc.text(med.frequency || '-', 115, yPos);
      doc.text(med.duration || '-', 145, yPos);
      doc.text(med.instructions || 'As advised', 170, yPos);
      yPos += 7;
    });

    // Instructions & Advice
    yPos = Math.max(yPos + 10, 180);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('GENERAL INSTRUCTIONS & ADVICE:', 14, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(prescription.instructions || 'Take all prescribed doses on time. Stay hydrated and rest.', 180);
    doc.text(lines, 14, yPos + 6);

    // Digital Signature & Disclaimer
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 255, 196, 255);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a digitally generated & authorized medical prescription issued through QuickCare Telehealth.', 14, 265);
    doc.text('Verification Hash: ' + (prescription.prescriptionId ? prescription.prescriptionId.toUpperCase() : 'QC-VERIFIED'), 14, 270);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`Digitally Signed by Dr. ${prescription.doctorName || 'Doctor'}`, 130, 265);
    doc.text('QuickCare Certified Medical Officer', 130, 270);

    doc.save(`Prescription_${prescription.prescriptionId || 'QuickCare'}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Digital Medical Prescription</h3>
              <p className="text-xs text-blue-100">
                ID: {prescription.prescriptionId} • {prescription.consultationDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Doctor & Patient Info */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Prescribing Doctor
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">Dr. {prescription.doctorName}</p>
              <p className="text-slate-500 dark:text-slate-400">{prescription.doctorSpecialization}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{prescription.doctorQualification}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{prescription.clinicDetails}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Patient Details
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{prescription.patientName}</p>
              <p className="text-slate-500 dark:text-slate-400">Consultation Date: {prescription.consultationDate}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" /> Signed & Verified
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Diagnosis
            </h4>
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl text-xs font-semibold text-blue-950 dark:text-blue-200">
              {prescription.diagnosis}
            </div>
          </div>

          {/* Medicines */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Prescribed Medicines (Rx)
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div className="grid grid-cols-5 p-2.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span className="col-span-2">Medicine</span>
                <span>Dosage</span>
                <span>Frequency</span>
                <span>Duration</span>
              </div>
              {prescription.medicines && prescription.medicines.length > 0 ? (
                prescription.medicines.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-5 p-2.5 text-xs text-slate-700 dark:text-slate-300 items-center">
                    <div className="col-span-2 font-semibold text-slate-900 dark:text-white">
                      {m.name}
                      {m.instructions && (
                        <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400">{m.instructions}</p>
                      )}
                    </div>
                    <span>{m.dosage}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{m.frequency}</span>
                    <span>{m.duration}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">No medicines prescribed.</div>
              )}
            </div>
          </div>

          {/* Instructions */}
          {prescription.instructions && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Doctor's Advice & Instructions
              </h4>
              <p className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {prescription.instructions}
              </p>
            </div>
          )}
        </div>

        {/* Footer with PDF Download button */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Digital Medical Record</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Close
            </button>
            <button
              onClick={downloadPdf}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Prescription PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
