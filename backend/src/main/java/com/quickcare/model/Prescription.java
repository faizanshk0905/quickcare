package com.quickcare.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class Prescription {
    private String prescriptionId;
    private String appointmentId;
    private String patientId;
    private String patientName;
    private String doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String doctorQualification;
    private String clinicDetails;
    private String consultationDate;
    private String diagnosis;
    private List<MedicineItem> medicines = new ArrayList<>();
    private String instructions;
    private String additionalNotes;
    private String prescriptionPdfUrl;
    private Instant createdAt;
    private Instant updatedAt;

    public Prescription() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(String prescriptionId) { this.prescriptionId = prescriptionId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }

    public String getDoctorQualification() { return doctorQualification; }
    public void setDoctorQualification(String doctorQualification) { this.doctorQualification = doctorQualification; }

    public String getClinicDetails() { return clinicDetails; }
    public void setClinicDetails(String clinicDetails) { this.clinicDetails = clinicDetails; }

    public String getConsultationDate() { return consultationDate; }
    public void setConsultationDate(String consultationDate) { this.consultationDate = consultationDate; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public List<MedicineItem> getMedicines() { return medicines; }
    public void setMedicines(List<MedicineItem> medicines) { this.medicines = medicines; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getAdditionalNotes() { return additionalNotes; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }

    public String getPrescriptionPdfUrl() { return prescriptionPdfUrl; }
    public void setPrescriptionPdfUrl(String prescriptionPdfUrl) { this.prescriptionPdfUrl = prescriptionPdfUrl; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
