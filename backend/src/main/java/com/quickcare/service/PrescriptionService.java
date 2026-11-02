package com.quickcare.service;

import com.quickcare.dto.PrescriptionRequest;
import com.quickcare.exception.BadRequestException;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.exception.UnauthorizedException;
import com.quickcare.model.Appointment;
import com.quickcare.model.Doctor;
import com.quickcare.model.Patient;
import com.quickcare.model.Prescription;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class PrescriptionService {

    @Autowired
    private FirestoreDatabaseService db;

    @Autowired
    private NotificationService notificationService;

    public Prescription createPrescription(String doctorUid, PrescriptionRequest req) {
        Appointment apt = db.findAppointmentById(req.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + req.getAppointmentId()));

        Doctor doctor = db.findDoctorByUid(doctorUid)
                .orElseThrow(() -> new UnauthorizedException("Only registered doctors can issue prescriptions."));

        if (!doctor.getDoctorId().equals(apt.getDoctorId())) {
            throw new UnauthorizedException("You are not the designated doctor for this appointment.");
        }

        Patient patient = db.findPatientById(req.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + req.getPatientId()));

        Prescription rx = new Prescription();
        rx.setPrescriptionId("rx_" + UUID.randomUUID().toString().substring(0, 8));
        rx.setAppointmentId(apt.getAppointmentId());
        rx.setPatientId(patient.getPatientId());
        rx.setPatientName(patient.getFullName());
        rx.setDoctorId(doctor.getDoctorId());
        rx.setDoctorName(doctor.getFullName());
        rx.setDoctorSpecialization(doctor.getSpecialization());
        rx.setDoctorQualification(doctor.getQualification());
        rx.setClinicDetails(doctor.getClinicAddress() != null ? doctor.getClinicAddress() : "QuickCare Medical Center");
        rx.setConsultationDate(LocalDate.now().toString());
        rx.setDiagnosis(req.getDiagnosis());
        rx.setMedicines(req.getMedicines() != null ? req.getMedicines() : List.of());
        rx.setInstructions(req.getInstructions());
        rx.setAdditionalNotes(req.getAdditionalNotes());
        rx.setPrescriptionPdfUrl("/api/prescriptions/" + rx.getPrescriptionId() + "/pdf");

        Prescription saved = db.savePrescription(rx);

        // Mark appointment as COMPLETED
        apt.setStatus("COMPLETED");
        db.saveAppointment(apt);

        // Notify patient
        notificationService.sendNotification(patient.getUid(), "Prescription Issued",
                "Dr. " + doctor.getFullName() + " has issued your digital prescription for diagnosis: " + req.getDiagnosis() + ". You can download the PDF anytime.",
                "PRESCRIPTION_ISSUED", saved.getPrescriptionId());

        return saved;
    }

    public Prescription getPrescriptionById(String id) {
        return db.findPrescriptionById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + id));
    }

    public List<Prescription> getPrescriptionsByPatient(String patientId) {
        return db.findPrescriptionsByPatientId(patientId);
    }

    public List<Prescription> getPrescriptionsByDoctor(String doctorId) {
        return db.findPrescriptionsByDoctorId(doctorId);
    }

    public List<Prescription> getAllPrescriptions() {
        return db.findAllPrescriptions();
    }
}
