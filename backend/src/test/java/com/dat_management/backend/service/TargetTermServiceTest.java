package com.dat_management.backend.service;

import com.dat_management.backend.dto.TargetTermRequest;
import com.dat_management.backend.dto.TargetTermResponse;
import com.dat_management.backend.entity.TargetTerm;
import com.dat_management.backend.repository.TargetTermRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TargetTermServiceTest {

    @Mock
    private TargetTermRepository targetTermRepository;

    @InjectMocks
    private TargetTermService targetTermService;

    private TargetTerm activeTerm;
    private TargetTerm inactiveTerm;
    private TargetTermRequest request;

    @BeforeEach
    void setUp() {
        activeTerm = new TargetTerm();
        activeTerm.setId(1);
        activeTerm.setTarget1Date(LocalDate.of(2025, 1, 10));
        activeTerm.setTarget2Date(LocalDate.of(2025, 2, 10));
        activeTerm.setExamDate(LocalDate.of(2025, 3, 10));
        activeTerm.setIsActive(true);

        inactiveTerm = new TargetTerm();
        inactiveTerm.setId(2);
        inactiveTerm.setTarget1Date(LocalDate.of(2024, 1, 10));
        inactiveTerm.setTarget2Date(LocalDate.of(2024, 2, 10));
        inactiveTerm.setExamDate(LocalDate.of(2024, 3, 10));
        inactiveTerm.setIsActive(false);

        request = new TargetTermRequest();
        request.setTarget1Date(LocalDate.of(2025, 1, 10));
        request.setTarget2Date(LocalDate.of(2025, 2, 10));
        request.setExamDate(LocalDate.of(2025, 3, 10));
        request.setIsActive(true);
    }

    @Test
    @DisplayName("getAll | terms exist → returns all terms mapped to response")
    void getAll_returnsAllTermsMappedToResponse() {
        when(targetTermRepository.findAll()).thenReturn(List.of(activeTerm, inactiveTerm));

        List<TargetTermResponse> result = targetTermService.getAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1);
        assertThat(result.get(0).getIsActive()).isTrue();
        assertThat(result.get(1).getId()).isEqualTo(2);
        assertThat(result.get(1).getIsActive()).isFalse();
        verify(targetTermRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("getAll | no terms exist → returns empty list")
    void getAll_returnsEmptyList_whenNoTermsExist() {
        when(targetTermRepository.findAll()).thenReturn(List.of());

        List<TargetTermResponse> result = targetTermService.getAll();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getActiveTerms | active terms exist → returns only active terms")
    void getActiveTerms_returnsOnlyActiveTerms() {
        when(targetTermRepository.findByIsActiveTrue()).thenReturn(List.of(activeTerm));

        List<TargetTermResponse> result = targetTermService.getActiveTerms();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1);
        assertThat(result.get(0).getIsActive()).isTrue();
        verify(targetTermRepository, times(1)).findByIsActiveTrue();
    }

    @Test
    @DisplayName("getActiveTerms | no active terms exist → returns empty list")
    void getActiveTerms_returnsEmptyList_whenNoActiveTerms() {
        when(targetTermRepository.findByIsActiveTrue()).thenReturn(List.of());

        List<TargetTermResponse> result = targetTermService.getActiveTerms();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getById | term exists → returns mapped response")
    void getById_returnsCorrectResponse_whenTermExists() {
        when(targetTermRepository.findById(1)).thenReturn(Optional.of(activeTerm));

        TargetTermResponse result = targetTermService.getById(1);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getTarget1Date()).isEqualTo(LocalDate.of(2025, 1, 10));
        assertThat(result.getTarget2Date()).isEqualTo(LocalDate.of(2025, 2, 10));
        assertThat(result.getExamDate()).isEqualTo(LocalDate.of(2025, 3, 10));
        assertThat(result.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("getById | term not found → throws RuntimeException")
    void getById_throwsRuntimeException_whenTermNotFound() {
        when(targetTermRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> targetTermService.getById(99))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Target term not found with id: 99");
    }

    @Test
    @DisplayName("create | request contains isActive → saves and returns response")
    void create_savesAndReturnsResponse_withIsActiveFromRequest() {
        when(targetTermRepository.save(any(TargetTerm.class))).thenReturn(activeTerm);

        TargetTermResponse result = targetTermService.create(request);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getTarget1Date()).isEqualTo(LocalDate.of(2025, 1, 10));
        assertThat(result.getIsActive()).isTrue();
        verify(targetTermRepository, times(1)).save(any(TargetTerm.class));
    }

    @Test
    @DisplayName("create | isActive is null → defaults to true")
    void create_defaultsIsActiveToTrue_whenRequestHasNullIsActive() {
        request.setIsActive(null);

        TargetTerm savedTerm = new TargetTerm();
        savedTerm.setId(3);
        savedTerm.setTarget1Date(request.getTarget1Date());
        savedTerm.setTarget2Date(request.getTarget2Date());
        savedTerm.setExamDate(request.getExamDate());
        savedTerm.setIsActive(true);

        when(targetTermRepository.save(any(TargetTerm.class))).thenReturn(savedTerm);

        TargetTermResponse result = targetTermService.create(request);

        // Verify save was called with isActive = true (the default)
        verify(targetTermRepository).save(argThat(term -> Boolean.TRUE.equals(term.getIsActive())));
        assertThat(result.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("create | isActive is false → preserves explicit false value")
    void create_respectsExplicitIsActiveFalse_whenProvidedInRequest() {
        request.setIsActive(false);

        TargetTerm savedTerm = new TargetTerm();
        savedTerm.setId(4);
        savedTerm.setTarget1Date(request.getTarget1Date());
        savedTerm.setTarget2Date(request.getTarget2Date());
        savedTerm.setExamDate(request.getExamDate());
        savedTerm.setIsActive(false);

        when(targetTermRepository.save(any(TargetTerm.class))).thenReturn(savedTerm);

        TargetTermResponse result = targetTermService.create(request);

        verify(targetTermRepository).save(argThat(term -> Boolean.FALSE.equals(term.getIsActive())));
        assertThat(result.getIsActive()).isFalse();
    }

    @Test
    @DisplayName("update | term exists → updates fields and returns response")
    void update_updatesFieldsAndReturnsResponse_whenTermExists() {
        TargetTermRequest updateRequest = new TargetTermRequest();
        updateRequest.setTarget1Date(LocalDate.of(2026, 5, 1));
        updateRequest.setTarget2Date(LocalDate.of(2026, 6, 1));
        updateRequest.setExamDate(LocalDate.of(2026, 7, 1));
        updateRequest.setIsActive(false);

        TargetTerm updatedTerm = new TargetTerm();
        updatedTerm.setId(1);
        updatedTerm.setTarget1Date(updateRequest.getTarget1Date());
        updatedTerm.setTarget2Date(updateRequest.getTarget2Date());
        updatedTerm.setExamDate(updateRequest.getExamDate());
        updatedTerm.setIsActive(false);

        when(targetTermRepository.findById(1)).thenReturn(Optional.of(activeTerm));
        when(targetTermRepository.save(any(TargetTerm.class))).thenReturn(updatedTerm);

        TargetTermResponse result = targetTermService.update(1, updateRequest);

        assertThat(result.getTarget1Date()).isEqualTo(LocalDate.of(2026, 5, 1));
        assertThat(result.getTarget2Date()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(result.getExamDate()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(result.getIsActive()).isFalse();
        verify(targetTermRepository, times(1)).save(any(TargetTerm.class));
    }

    @Test
    @DisplayName("update | isActive is null → keeps existing isActive value")
    void update_doesNotChangeIsActive_whenRequestHasNullIsActive() {
        TargetTermRequest updateRequest = new TargetTermRequest();
        updateRequest.setTarget1Date(LocalDate.of(2026, 5, 1));
        updateRequest.setTarget2Date(LocalDate.of(2026, 6, 1));
        updateRequest.setExamDate(LocalDate.of(2026, 7, 1));
        updateRequest.setIsActive(null); // not provided

        when(targetTermRepository.findById(1)).thenReturn(Optional.of(activeTerm));
        when(targetTermRepository.save(any(TargetTerm.class))).thenReturn(activeTerm);

        targetTermService.update(1, updateRequest);

        // isActive on activeTerm should remain true (unchanged)
        verify(targetTermRepository).save(argThat(term -> Boolean.TRUE.equals(term.getIsActive())));
    }

    @Test
    @DisplayName("update | term not found → throws RuntimeException")
    void update_throwsRuntimeException_whenTermNotFound() {
        when(targetTermRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> targetTermService.update(99, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Target term not found with id: 99");

        verify(targetTermRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete | term exists → deletes entity")
    void delete_deletesEntity_whenTermExists() {
        when(targetTermRepository.findById(1)).thenReturn(Optional.of(activeTerm));

        targetTermService.delete(1);

        verify(targetTermRepository, times(1)).delete(activeTerm);
    }

    @Test
    @DisplayName("delete | term not found → throws RuntimeException")
    void delete_throwsRuntimeException_whenTermNotFound() {
        when(targetTermRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> targetTermService.delete(99))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Target term not found with id: 99");

        verify(targetTermRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteList | ids provided → calls deleteAllById with given ids")
    void deleteList_callsDeleteAllById_withGivenIds() {
        List<Integer> ids = List.of(1, 2, 3);

        targetTermService.deleteList(ids);

        verify(targetTermRepository, times(1)).deleteAllById(ids);
    }

    @Test
    @DisplayName("deleteList | empty list provided → calls deleteAllById with empty list")
    void deleteList_callsDeleteAllById_withEmptyList() {
        targetTermService.deleteList(List.of());

        verify(targetTermRepository, times(1)).deleteAllById(List.of());
    }
}