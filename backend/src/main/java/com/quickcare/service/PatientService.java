package com.quickcare.service;

import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.model.Appointment;
import com.quickcare.model.Patient;
import com.quickcare.model.Prescription;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    @Autowired
    private FirestoreDatabaseService db;

    public Patient getPatientByUid(String uid) {
        return db.findPatientByUid(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Patient record not found for user: " + uid));
    }

    public Patient getPatientById(String patientId) {
        return db.findPatientById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));
    }

    public Patient updatePatientProfile(String uid, Patient updated) {
        Patient pat = getPatientByUid(uid);
        if (updated.getFullName() != null) pat.setFullName(updated.getFullName());
        if (updated.getPhone() != null) pat.setPhone(updated.getPhone());
        if (updated.getDateOfBirth() != null) pat.setDateOfBirth(updated.getDateOfBirth());
        if (updated.getGender() != null) pat.setGender(updated.getGender());
        if (updated.getAddress() != null) pat.setAddress(updated.getAddress());
        if (updated.getProfileImage() != null) pat.setProfileImage(updated.getProfileImage());

        return db.savePatient(pat);
    }

    public List<Appointment> getPatientAppointments(String patientId) {
        return db.findAppointmentsByPatientId(patientId);
    }

    public List<Prescription> getPatientPrescriptions(String patientId) {
        return db.findPrescriptionsByPatientId(patientId);
    }
}
