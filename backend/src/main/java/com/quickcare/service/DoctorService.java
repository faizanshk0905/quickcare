package com.quickcare.service;

import com.quickcare.dto.AvailabilityUpdateRequest;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.model.Appointment;
import com.quickcare.model.Doctor;
import com.quickcare.model.DoctorAvailability;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired
    private FirestoreDatabaseService db;

    public List<Doctor> searchDoctors(String query, String specialization, Integer minExp, Double maxFee) {
        return searchDoctors(query, specialization, minExp, maxFee, null);
    }

    public List<Doctor> searchDoctors(String query, String specialization, Integer minExp, Double maxFee, String gender) {
        return db.findVerifiedDoctors().stream()
                .filter(d -> {
                    if (query != null && !query.trim().isEmpty()) {
                        String q = query.toLowerCase().trim();
                        boolean matchesName = d.getFullName() != null && d.getFullName().toLowerCase().contains(q);
                        boolean matchesSpec = d.getSpecialization() != null && d.getSpecialization().toLowerCase().contains(q);
                        if (!matchesName && !matchesSpec) return false;
                    }
                    if (specialization != null && !specialization.trim().isEmpty() && !"ALL".equalsIgnoreCase(specialization)) {
                        if (d.getSpecialization() == null || !d.getSpecialization().equalsIgnoreCase(specialization.trim())) {
                            return false;
                        }
                    }
                    if (gender != null && !gender.trim().isEmpty() && !"ALL".equalsIgnoreCase(gender.trim())) {
                        if (d.getGender() == null || !d.getGender().equalsIgnoreCase(gender.trim())) {
                            return false;
                        }
                    }
                    if (minExp != null && d.getExperience() < minExp) {
                        return false;
                    }
                    if (maxFee != null && d.getConsultationFee() > maxFee) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    public Doctor getDoctorById(String doctorId) {
        return db.findDoctorById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + doctorId));
    }

    public Doctor getDoctorByUid(String uid) {
        return db.findDoctorByUid(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + uid));
    }

    public Doctor updateDoctorProfile(String doctorId, Doctor updated) {
        Doctor doc = getDoctorById(doctorId);
        if (updated.getFullName() != null) doc.setFullName(updated.getFullName());
        if (updated.getSpecialization() != null) doc.setSpecialization(updated.getSpecialization());
        if (updated.getQualification() != null) doc.setQualification(updated.getQualification());
        if (updated.getExperience() > 0) doc.setExperience(updated.getExperience());
        if (updated.getConsultationFee() > 0) doc.setConsultationFee(updated.getConsultationFee());
        if (updated.getAvailableDays() != null) doc.setAvailableDays(updated.getAvailableDays());
        if (updated.getWorkingHours() != null) doc.setWorkingHours(updated.getWorkingHours());
        if (updated.getBio() != null) doc.setBio(updated.getBio());
        if (updated.getClinicAddress() != null) doc.setClinicAddress(updated.getClinicAddress());
        if (updated.getProfileImage() != null) doc.setProfileImage(updated.getProfileImage());
        if (updated.getGender() != null) doc.setGender(updated.getGender());

        return db.saveDoctor(doc);
    }

    public List<Appointment> getDoctorAppointments(String doctorId) {
        return db.findAppointmentsByDoctorId(doctorId);
    }

    public LocalTime parseTimeFlexible(String timeStr, LocalTime fallback) {
        if (timeStr == null || timeStr.trim().isEmpty()) return fallback;
        String s = timeStr.trim().toUpperCase();
        try {
            if (s.contains("AM") || s.contains("PM")) {
                if (s.length() == 7 && s.charAt(1) == ':') {
                    s = "0" + s; // e.g. "9:00 AM" -> "09:00 AM"
                }
                return LocalTime.parse(s, DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
            } else {
                if (s.length() == 4 && s.charAt(1) == ':') {
                    s = "0" + s; // e.g. "9:00" -> "09:00"
                }
                return LocalTime.parse(s, DateTimeFormatter.ofPattern("HH:mm"));
            }
        } catch (Exception e) {
            return fallback;
        }
    }

    public List<String> generate15MinSlots(Doctor doctor, LocalDate date) {
        if (doctor == null || date == null) return Collections.emptyList();

        String zoneName = doctor.getTimezone() != null && !doctor.getTimezone().trim().isEmpty()
                ? doctor.getTimezone().trim() : "Asia/Kolkata";
        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(zoneName);
        } catch (Exception e) {
            zoneId = ZoneId.of("Asia/Kolkata");
        }

        LocalDate todayInZone = LocalDate.now(zoneId);
        if (date.isBefore(todayInZone)) {
            // Cannot book slots in the past
            return Collections.emptyList();
        }

        // 1. Check holidays
        if (doctor.getHolidays() != null && doctor.getHolidays().contains(date.toString())) {
            return Collections.emptyList();
        }

        // 2. Check working days (MON-SUN)
        List<String> workingDays = doctor.getAvailableDays();
        if (workingDays != null && !workingDays.isEmpty()) {
            String dayName = date.getDayOfWeek().name(); // MONDAY, TUESDAY...
            boolean isWorkingDay = workingDays.stream()
                    .anyMatch(d -> d.equalsIgnoreCase(dayName) ||
                            (dayName.length() >= 3 && d.toUpperCase().startsWith(dayName.substring(0, 3))));
            if (!isWorkingDay) {
                return Collections.emptyList();
            }
        }

        // 3. Working Hours & Breaks
        LocalTime startTime = parseTimeFlexible(doctor.getWorkingStartTime(), LocalTime.of(9, 0));
        LocalTime endTime = parseTimeFlexible(doctor.getWorkingEndTime(), LocalTime.of(17, 0));
        LocalTime breakStart = parseTimeFlexible(doctor.getBreakStartTime(), LocalTime.of(13, 0));
        LocalTime breakEnd = parseTimeFlexible(doctor.getBreakEndTime(), LocalTime.of(14, 0));

        int duration = doctor.getSlotDurationMinutes() > 0 ? doctor.getSlotDurationMinutes() : 15;

        LocalTime nowInZone = LocalTime.now(zoneId);
        boolean isToday = date.equals(todayInZone);

        List<String> slots = new ArrayList<>();
        LocalTime current = startTime;

        DateTimeFormatter slotFormatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

        while (current.plusMinutes(duration).compareTo(endTime) <= 0) {
            LocalTime slotEnd = current.plusMinutes(duration);

            // Check if slot overlaps with doctor's break
            boolean inBreak = (current.compareTo(breakStart) >= 0 && current.compareTo(breakEnd) < 0) ||
                    (slotEnd.compareTo(breakStart) > 0 && slotEnd.compareTo(breakEnd) <= 0);

            if (!inBreak) {
                // If today, filter out past slots
                if (!isToday || current.isAfter(nowInZone)) {
                    slots.add(current.format(slotFormatter));
                }
            }
            current = slotEnd;
        }

        return slots;
    }

    public DoctorAvailability getOrCreateAvailability(String doctorId, String date) {
        Doctor doctor = getDoctorById(doctorId);
        LocalDate localDate;
        try {
            localDate = LocalDate.parse(date);
        } catch (Exception e) {
            localDate = LocalDate.now();
        }

        Optional<DoctorAvailability> existing = db.findAvailability(doctorId, date);
        if (existing.isPresent()) {
            DoctorAvailability da = existing.get();
            // Dynamically filter out past slots if date is today
            ZoneId zoneId;
            try {
                zoneId = ZoneId.of(doctor.getTimezone() != null ? doctor.getTimezone() : "Asia/Kolkata");
            } catch (Exception e) {
                zoneId = ZoneId.of("Asia/Kolkata");
            }

            if (localDate.equals(LocalDate.now(zoneId))) {
                LocalTime now = LocalTime.now(zoneId);
                List<String> filtered = da.getAvailableSlots().stream()
                        .filter(s -> {
                            LocalTime slotTime = parseTimeFlexible(s, null);
                            return slotTime != null && slotTime.isAfter(now);
                        })
                        .collect(Collectors.toList());
                da.setAvailableSlots(filtered);
            }
            return da;
        }

        // Generate 15-minute slots automatically based on doctor configuration
        List<String> slots = generate15MinSlots(doctor, localDate);
        DoctorAvailability da = new DoctorAvailability(doctorId + "_" + date, doctorId, date, slots);
        da.setWorkingHours(doctor.getWorkingHours());
        da.setSlotDurationMinutes(doctor.getSlotDurationMinutes() > 0 ? doctor.getSlotDurationMinutes() : 15);
        if (doctor.getHolidays() != null && doctor.getHolidays().contains(date)) {
            da.setHoliday(true);
            da.setHolidayReason("Doctor scheduled holiday");
        }
        return db.saveAvailability(da);
    }

    public DoctorAvailability updateAvailability(AvailabilityUpdateRequest req) {
        Doctor doctor = getDoctorById(req.getDoctorId());

        // Update Doctor's global schedule configuration if supplied
        boolean doctorConfigUpdated = false;
        if (req.getWorkingDays() != null && !req.getWorkingDays().isEmpty()) {
            doctor.setAvailableDays(req.getWorkingDays());
            doctorConfigUpdated = true;
        }
        if (req.getWorkingStartTime() != null && !req.getWorkingStartTime().trim().isEmpty()) {
            doctor.setWorkingStartTime(req.getWorkingStartTime().trim());
            doctorConfigUpdated = true;
        }
        if (req.getWorkingEndTime() != null && !req.getWorkingEndTime().trim().isEmpty()) {
            doctor.setWorkingEndTime(req.getWorkingEndTime().trim());
            doctorConfigUpdated = true;
        }
        if (req.getBreakStartTime() != null && !req.getBreakStartTime().trim().isEmpty()) {
            doctor.setBreakStartTime(req.getBreakStartTime().trim());
            doctorConfigUpdated = true;
        }
        if (req.getBreakEndTime() != null && !req.getBreakEndTime().trim().isEmpty()) {
            doctor.setBreakEndTime(req.getBreakEndTime().trim());
            doctorConfigUpdated = true;
        }
        if (req.getSlotDurationMinutes() != null && req.getSlotDurationMinutes() > 0) {
            doctor.setSlotDurationMinutes(req.getSlotDurationMinutes());
            doctorConfigUpdated = true;
        }
        if (req.getHolidays() != null) {
            doctor.setHolidays(req.getHolidays());
            doctorConfigUpdated = true;
        }
        if (req.getTimezone() != null && !req.getTimezone().trim().isEmpty()) {
            doctor.setTimezone(req.getTimezone().trim());
            doctorConfigUpdated = true;
        }
        if (req.getWorkingHours() != null && !req.getWorkingHours().trim().isEmpty()) {
            doctor.setWorkingHours(req.getWorkingHours().trim());
            doctorConfigUpdated = true;
        }
        if (doctorConfigUpdated) {
            db.saveDoctor(doctor);
        }

        // If specific date requested
        String targetDate = req.getDate() != null ? req.getDate() : LocalDate.now().toString();
        DoctorAvailability da = getOrCreateAvailability(req.getDoctorId(), targetDate);

        if (req.getAvailableSlots() != null) {
            da.setAvailableSlots(req.getAvailableSlots());
        } else {
            // Auto-regenerate 15-min slots using latest schedule settings
            try {
                LocalDate d = LocalDate.parse(targetDate);
                da.setAvailableSlots(generate15MinSlots(doctor, d));
            } catch (Exception ignored) {}
        }

        if (req.getWorkingHours() != null) {
            da.setWorkingHours(req.getWorkingHours());
        }
        return db.saveAvailability(da);
    }
}
