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
}