package com.quickcare.dto;

import java.util.Map;

public class DashboardStatsDto {
    private long totalPatients;
    private long totalDoctors;
    private long verifiedDoctors;
    private long pendingDoctorApprovals;
    private long totalAppointments;
    private long confirmedAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
    private long pendingAppointments;
    private long todayAppointments;
    private Map<String, Long> specializationStats;
    private Map<String, Long> monthlyAppointments;

    public DashboardStatsDto() {}

    public long getTotalPatients() { return totalPatients; }
    public void setTotalPatients(long totalPatients) { this.totalPatients = totalPatients; }

    public long getTotalDoctors() { return totalDoctors; }
    public void setTotalDoctors(long totalDoctors) { this.totalDoctors = totalDoctors; }

    public long getVerifiedDoctors() { return verifiedDoctors; }
    public void setVerifiedDoctors(long verifiedDoctors) { this.verifiedDoctors = verifiedDoctors; }

    public long getPendingDoctorApprovals() { return pendingDoctorApprovals; }
    public void setPendingDoctorApprovals(long pendingDoctorApprovals) { this.pendingDoctorApprovals = pendingDoctorApprovals; }

    public long getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(long totalAppointments) { this.totalAppointments = totalAppointments; }

    public long getConfirmedAppointments() { return confirmedAppointments; }
    public void setConfirmedAppointments(long confirmedAppointments) { this.confirmedAppointments = confirmedAppointments; }

    public long getCompletedAppointments() { return completedAppointments; }
    public void setCompletedAppointments(long completedAppointments) { this.completedAppointments = completedAppointments; }

    public long getCancelledAppointments() { return cancelledAppointments; }
    public void setCancelledAppointments(long cancelledAppointments) { this.cancelledAppointments = cancelledAppointments; }

    public long getPendingAppointments() { return pendingAppointments; }
    public void setPendingAppointments(long pendingAppointments) { this.pendingAppointments = pendingAppointments; }

    public long getTodayAppointments() { return todayAppointments; }
    public void setTodayAppointments(long todayAppointments) { this.todayAppointments = todayAppointments; }

    public Map<String, Long> getSpecializationStats() { return specializationStats; }
    public void setSpecializationStats(Map<String, Long> specializationStats) { this.specializationStats = specializationStats; }

    public Map<String, Long> getMonthlyAppointments() { return monthlyAppointments; }
    public void setMonthlyAppointments(Map<String, Long> monthlyAppointments) { this.monthlyAppointments = monthlyAppointments; }
}
