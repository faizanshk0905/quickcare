package com.quickcare.model;

public class MedicineItem {
    private String name;
    private String dosage;      // e.g., "500mg"
    private String frequency;   // e.g., "1-0-1 (Morning & Night)"
    private String duration;    // e.g., "5 days"
    private String instructions;// e.g., "Take after meals"

    public MedicineItem() {}

    public MedicineItem(String name, String dosage, String frequency, String duration, String instructions) {
        this.name = name;
        this.dosage = dosage;
        this.frequency = frequency;
        this.duration = duration;
        this.instructions = instructions;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
}
