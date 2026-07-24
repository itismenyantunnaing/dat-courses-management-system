package com.dat_management.backend.service;

import com.dat_management.backend.dto.CertificateStatisticsDtos.OverallCertificateStatisticsDTO;
import com.dat_management.backend.dto.CertificateStatisticsDtos.TeamCertificateStatisticsDTO;
import com.dat_management.backend.entity.EmployeeCertificate.CertificateType;
import com.dat_management.backend.repository.EmployeeCertificateRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateStatisticsServiceTest {

    @Mock
    private EmployeeCertificateRepository certificateRepository;

    @Test
    void getOverallStatistics_noEmployees_returnsEmptyStatistics() {
        CertificateStatisticsService service = new CertificateStatisticsService(certificateRepository);
        when(certificateRepository.countTotalEmployees()).thenReturn(0L);

        OverallCertificateStatisticsDTO result = service.getOverallStatistics();

        Assertions.assertTrue(result.statistics().isEmpty());
    }

    @Test
    void getOverallStatistics_withCertificates_calculatesPercentageOfTotalEmployees() {
        CertificateStatisticsService service = new CertificateStatisticsService(certificateRepository);
        when(certificateRepository.countTotalEmployees()).thenReturn(20L);
        when(certificateRepository.countVerifiedCertificatesByTypeAndLevel())
                .thenReturn(List.<Object[]>of(
                        new Object[]{CertificateType.JLPT, "N2", 5L}
                ));

        OverallCertificateStatisticsDTO result = service.getOverallStatistics();

        Map<String, Map<String, Double>> stats = result.statistics();
        Assertions.assertEquals(25.0, stats.get("JLPT").get("N2"));
    }

    @Test
    void getOverallStatistics_nullLevel_usesUnspecifiedKey() {
        CertificateStatisticsService service = new CertificateStatisticsService(certificateRepository);
        when(certificateRepository.countTotalEmployees()).thenReturn(10L);
        when(certificateRepository.countVerifiedCertificatesByTypeAndLevel())
                .thenReturn(List.<Object[]>of(
                new Object[]{CertificateType.OTHER, null, 2L}
        ));

        OverallCertificateStatisticsDTO result = service.getOverallStatistics();

        Assertions.assertEquals(20.0, result.statistics().get("OTHER").get("UNSPECIFIED"));
    }

    @Test
    void getTeamStatistics_noTeams_returnsEmptyStatistics() {
        CertificateStatisticsService service = new CertificateStatisticsService(certificateRepository);
        when(certificateRepository.countEmployeesByTeam()).thenReturn(List.of());

        TeamCertificateStatisticsDTO result = service.getTeamStatistics();

        Assertions.assertTrue(result.statistics().isEmpty());
    }

    @Test
    void getTeamStatistics_withCertificates_calculatesPercentageOfTeamEmployees() {
        CertificateStatisticsService service = new CertificateStatisticsService(certificateRepository);
        when(certificateRepository.countEmployeesByTeam())
                .thenReturn(List.<Object[]>of(
                new Object[]{"Team A", 4L}
        ));
        when(certificateRepository.countVerifiedCertificatesByTeamTypeAndLevel())
                .thenReturn(List.<Object[]>of(
                new Object[]{"Team A", CertificateType.JLPT, "N1", 1L}
        ));

        TeamCertificateStatisticsDTO result = service.getTeamStatistics();

        Map<String, Map<String, Map<String, Double>>> stats = result.statistics();
        Assertions.assertEquals(25.0, stats.get("Team A").get("JLPT").get("N1"));
    }

    @Test
    void getTeamStatisticsByTeamName_teamNotFound_returnsEmptyMap() {
        CertificateStatisticsService service = new CertificateStatisticsService(certificateRepository);
        when(certificateRepository.countEmployeesByTeamName("Ghost Team")).thenReturn(0L);

        Map<String, Map<String, Double>> result = service.getTeamStatisticsByTeamName("Ghost Team");

        Assertions.assertTrue(result.isEmpty());
    }

    @Test
    void getTeamStatisticsByTeamName_filtersOnlyMatchingTeam() {
        CertificateStatisticsService service = new CertificateStatisticsService(certificateRepository);
        when(certificateRepository.countEmployeesByTeamName("Team A")).thenReturn(4L);
        when(certificateRepository.countVerifiedCertificatesByTeamTypeAndLevel())
                .thenReturn(List.of(
                        new Object[]{"Team A", CertificateType.JLPT, "N1", 2L},
                        new Object[]{"Team B", CertificateType.JLPT, "N1", 9L}));

        Map<String, Map<String, Double>> result = service.getTeamStatisticsByTeamName("Team A");

        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(50.0, result.get("JLPT").get("N1"));
    }
}
