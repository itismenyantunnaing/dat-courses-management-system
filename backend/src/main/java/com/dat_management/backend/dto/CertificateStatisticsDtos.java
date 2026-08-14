package com.dat_management.backend.dto;

import java.util.Map;

public final class CertificateStatisticsDtos {

    private CertificateStatisticsDtos() {
    }

    /**
     * Overall certificate statistics response
     * Format: { "JLPT": { "N1": 12.5, "N2": 25.0 } }
     */
    public record OverallCertificateStatisticsDTO(
            Map<String, Map<String, Double>> statistics
    ) {}

    /**
     * Team-wise certificate statistics response
     * Format: { "Team A": { "JLPT": { "N1": 20.0 } } }
     */
    public record TeamCertificateStatisticsDTO(
            Map<String, Map<String, Map<String, Double>>> statistics
    ) {}

    /**
     * Department-wise certificate statistics with teams breakdown
     * Format: { "Department A": { "Team A": { "JLPT": { "N1": 20.0 } } } }
     */
    public record DepartmentCertificateStatisticsDTO(
            Map<String, Map<String, Map<String, Map<String, Double>>>> statistics
    ) {}

    /**
     * Division-wise certificate statistics with departments and teams breakdown
     * Format: { "Division A": { "Department A": { "Team A": { "JLPT": { "N1": 20.0 } } } } }
     * This gives you the complete hierarchy: Division → Department → Team → Certificate
     */
    public record DivisionCertificateStatisticsDTO(
            Map<String, Map<String, Map<String, Map<String, Map<String, Double>>>>> statistics
    ) {}
}