package com.quickcare.dto;

import com.quickcare.model.MedicineItem;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class PrescriptionRequest {
    @NotBlank(message = "Appointment ID is required")
    private String appointmentId;

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Diagnosis is required")
    private String diagnosis;

    private List<MedicineItem> medicines;
    private String instructions;
    private String additionalNotes;

    public PrescriptionRequest() {}

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public List<MedicineItem> getMedicines() { return medicines; }
    public void setMedicines(List<MedicineItem> medicines) { this.medicines = medicines; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getAdditionalNotes() { return additionalNotes; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }
}
