package com.dat_management.backend.service;

import com.dat_management.backend.dto.HolidayDto;
import com.dat_management.backend.entity.Holiday;
import com.dat_management.backend.repository.HolidayRepository;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests for HolidayService
// ─────────────────────────────────────────────────────────────────────────────

@ExtendWith(MockitoExtension.class)
class HolidayServiceTest {

    @Mock
    private HolidayRepository holidayRepository;

    @InjectMocks
    private HolidayService holidayService;

    // ── Reusable test data ────────────────────────────────────────────────────
    private HolidayDto validDto;
    private Holiday existingHoliday;

    @BeforeEach
    void setUp() {
        validDto = new HolidayDto();
        validDto.setHolidayDate("2025-12-25");
        validDto.setHolidayName("Christmas Day");

        existingHoliday = new Holiday();
        existingHoliday.setId(1);
        existingHoliday.setHolidayDate(LocalDate.of(2025, 12, 25));
        existingHoliday.setHolidayName("Christmas Day");
    }

    @Test
    @DisplayName("getAllHolidays | repo has data → returns only non-deleted holidays")
    void getAllHolidays_repoHasData_returnsAllHolidays() {
        // Service now calls findAllByIsDeletedFalse() — not findAll()
        List<Holiday> fakeList = List.of(existingHoliday, new Holiday());
        when(holidayRepository.findAllByIsDeletedFalse()).thenReturn(fakeList);

        List<Holiday> result = holidayService.getAllHolidays();

        assertThat(result).hasSize(2);
        verify(holidayRepository, times(1)).findAllByIsDeletedFalse();
        verify(holidayRepository, never()).findAll(); // old method must not be called
    }

    @Test
    @DisplayName("getAllHolidays | repo empty → returns empty list")
    void getAllHolidays_emptyRepo_returnsEmptyList() {
        when(holidayRepository.findAllByIsDeletedFalse()).thenReturn(List.of());

        List<Holiday> result = holidayService.getAllHolidays();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getHolidayById | valid ID → returns correct holiday")
    void getHolidayById_validId_returnsHoliday() {
        // Service now calls findByIdAndIsDeletedFalse() — not findById()
        when(holidayRepository.findByIdAndIsDeletedFalse(1))
                .thenReturn(Optional.of(existingHoliday));

        Holiday result = holidayService.getHolidayById(1);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getHolidayName()).isEqualTo("Christmas Day");
        assertThat(result.getHolidayDate()).isEqualTo(LocalDate.of(2025, 12, 25));
    }

    @Test
    @DisplayName("getHolidayById | non-existent ID → throws RuntimeException with 'not found'")
    void getHolidayById_nonExistentId_throwsRuntimeException() {
        when(holidayRepository.findByIdAndIsDeletedFalse(99999))
                .thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.getHolidayById(99999));

        assertThat(ex.getMessage()).contains("not found");
        assertThat(ex.getMessage()).contains("99999");
    }

    @Test
    @DisplayName("getHolidayById | soft-deleted holiday ID → throws RuntimeException (treated as not found)")
    void getHolidayById_softDeletedId_throwsRuntimeException() {
        // findByIdAndIsDeletedFalse returns empty for soft-deleted records
        // so the service throws "not found" — same as non-existent
        when(holidayRepository.findByIdAndIsDeletedFalse(1))
                .thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.getHolidayById(1));

        assertThat(ex.getMessage()).contains("not found");
    }

    @Test
    @DisplayName("createHoliday | valid dto, no existing record → creates new holiday")
    void createHoliday_validDto_savesAndReturnsHoliday() {
        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(LocalDate.of(2025, 12, 25)))
                .thenReturn(false);
        when(holidayRepository.findByHolidayDate(LocalDate.of(2025, 12, 25)))
                .thenReturn(Optional.empty()); // no soft-deleted record exists either
        when(holidayRepository.save(any(Holiday.class)))
                .thenReturn(existingHoliday);

        Holiday result = holidayService.createHoliday(validDto);

        assertThat(result.getHolidayName()).isEqualTo("Christmas Day");
        assertThat(result.getHolidayDate()).isEqualTo(LocalDate.of(2025, 12, 25));
        verify(holidayRepository, times(1)).save(any(Holiday.class));
    }

    @Test
    @DisplayName("createHoliday | soft-deleted record exists for date → reactivates it instead of creating new")
    void createHoliday_softDeletedRecordExists_reactivatesAndSaves() {
        // A soft-deleted holiday exists for this date
        Holiday softDeleted = new Holiday();
        softDeleted.setId(5);
        softDeleted.setHolidayDate(LocalDate.of(2025, 12, 25));
        softDeleted.setHolidayName("Old Christmas");
        softDeleted.setDeleted(true);

        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(LocalDate.of(2025, 12, 25)))
                .thenReturn(false); // no ACTIVE holiday — check passes
        when(holidayRepository.findByHolidayDate(LocalDate.of(2025, 12, 25)))
                .thenReturn(Optional.of(softDeleted)); // but a soft-deleted one exists
        when(holidayRepository.save(softDeleted)).thenReturn(softDeleted);

        holidayService.createHoliday(validDto);

        assertThat(softDeleted.isDeleted()).isFalse();
        assertThat(softDeleted.getHolidayName()).isEqualTo("Christmas Day");
        verify(holidayRepository, times(1)).save(softDeleted);
    }

    @Test
    @DisplayName("createHoliday | active duplicate date → throws RuntimeException, save() never called")
    void createHoliday_duplicateDate_throwsExceptionAndNeverSaves() {
        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(any()))
                .thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.createHoliday(validDto));

        assertThat(ex.getMessage()).contains("already exists");
        verify(holidayRepository, never()).save(any());
        verify(holidayRepository, never()).findByHolidayDate(any());
    }

    @Test
    @DisplayName("createHoliday | invalid date format (DD-MM-YYYY) → throws RuntimeException")
    void createHoliday_invalidDateFormat_throwsRuntimeException() {
        HolidayDto badDto = new HolidayDto();
        badDto.setHolidayDate("25-12-2025");
        badDto.setHolidayName("Christmas Day");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.createHoliday(badDto));

        assertThat(ex.getMessage()).contains("Invalid date format");
        assertThat(ex.getMessage()).contains("yyyy-MM-dd");

        verify(holidayRepository, never()).existsByHolidayDateAndIsDeletedFalse(any());
        verify(holidayRepository, never()).save(any());
    }

    @Test
    @DisplayName("createHoliday | date with leading/trailing spaces → parses successfully")
    void createHoliday_dateWithWhitespace_trimsAndSucceeds() {
        HolidayDto spacedDto = new HolidayDto();
        spacedDto.setHolidayDate("  2025-12-25  ");
        spacedDto.setHolidayName("Christmas Day");

        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(LocalDate.of(2025, 12, 25)))
                .thenReturn(false);
        when(holidayRepository.findByHolidayDate(LocalDate.of(2025, 12, 25)))
                .thenReturn(Optional.empty());
        when(holidayRepository.save(any(Holiday.class))).thenReturn(existingHoliday);

        assertThatCode(() -> holidayService.createHoliday(spacedDto))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("createHoliday | completely invalid date string → throws RuntimeException")
    void createHoliday_completelyInvalidDate_throwsRuntimeException() {
        HolidayDto badDto = new HolidayDto();
        badDto.setHolidayDate("not-a-date");
        badDto.setHolidayName("Christmas Day");

        assertThrows(RuntimeException.class,
                () -> holidayService.createHoliday(badDto));
    }

    @Test
    @DisplayName("createMultipleHolidays | all valid, no existing records → saves all")
    void createMultipleHolidays_allValid_savesAll() {
        HolidayDto dto2 = new HolidayDto();
        dto2.setHolidayDate("2026-01-01");
        dto2.setHolidayName("New Year");

        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(any())).thenReturn(false);
        when(holidayRepository.findByHolidayDate(any())).thenReturn(Optional.empty());
        when(holidayRepository.saveAll(anyList())).thenReturn(List.of(existingHoliday, new Holiday()));

        List<Holiday> result = holidayService.createMultipleHolidays(List.of(validDto, dto2));

        assertThat(result).hasSize(2);
        verify(holidayRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("createMultipleHolidays | one active duplicate → throws exception, saveAll() never called")
    void createMultipleHolidays_oneDuplicate_throwsAndSavesNothing() {
        HolidayDto dto2 = new HolidayDto();
        dto2.setHolidayDate("2026-01-01");
        dto2.setHolidayName("New Year");

        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(LocalDate.of(2025, 12, 25)))
                .thenReturn(false);
        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(LocalDate.of(2026, 1, 1)))
                .thenReturn(true); // this one causes the failure

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.createMultipleHolidays(List.of(validDto, dto2)));

        assertThat(ex.getMessage()).contains("already exists");
        verify(holidayRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("createMultipleHolidays | one invalid date format → throws, saveAll() never called")
    void createMultipleHolidays_oneInvalidDate_throwsAndSavesNothing() {
        HolidayDto badDto = new HolidayDto();
        badDto.setHolidayDate("25-12-2025");
        badDto.setHolidayName("Christmas Day");

        // No stubs needed — validateAndParseDate throws before repo is touched
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.createMultipleHolidays(List.of(badDto)));

        assertThat(ex.getMessage()).contains("Invalid date format");
        verify(holidayRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("createMultipleHolidays | empty list → saveAll called with empty list (BUG-02 documented)")
    void createMultipleHolidays_emptyList_callsSaveAllWithEmptyList() {
        when(holidayRepository.saveAll(anyList())).thenReturn(List.of());

        assertThatCode(() -> holidayService.createMultipleHolidays(List.of()))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("updateHoliday | valid ID and new date → updates and saves")
    void updateHoliday_validIdAndNewDate_updatesSuccessfully() {
        HolidayDto updateDto = new HolidayDto();
        updateDto.setHolidayDate("2025-12-26");
        updateDto.setHolidayName("Boxing Day");

        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));
        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(LocalDate.of(2025, 12, 26)))
                .thenReturn(false);
        when(holidayRepository.save(any(Holiday.class))).thenReturn(existingHoliday);

        Holiday result = holidayService.updateHoliday(1, updateDto);

        assertThat(result).isNotNull();
        verify(holidayRepository, times(1)).save(any(Holiday.class));
    }

    @Test
    @DisplayName("updateHoliday | same date (name change only) → skips duplicate check, saves")
    void updateHoliday_sameDateNameChange_updatesSuccessfully() {
        HolidayDto updateDto = new HolidayDto();
        updateDto.setHolidayDate("2025-12-25"); // same date
        updateDto.setHolidayName("Christmas Day (Updated)");

        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));
        when(holidayRepository.save(any(Holiday.class))).thenReturn(existingHoliday);

        assertThatCode(() -> holidayService.updateHoliday(1, updateDto))
                .doesNotThrowAnyException();

        verify(holidayRepository, never()).existsByHolidayDateAndIsDeletedFalse(any());
    }

    @Test
    @DisplayName("updateHoliday | new date conflicts with active holiday → throws RuntimeException")
    void updateHoliday_newDateConflictsWithOther_throwsException() {
        HolidayDto updateDto = new HolidayDto();
        updateDto.setHolidayDate("2026-01-01");
        updateDto.setHolidayName("New Year");

        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));
        when(holidayRepository.existsByHolidayDateAndIsDeletedFalse(LocalDate.of(2026, 1, 1)))
                .thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.updateHoliday(1, updateDto));

        assertThat(ex.getMessage()).contains("already exists");
        verify(holidayRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateHoliday | attempting to update a soft-deleted holiday → throws RuntimeException")
    void updateHoliday_softDeletedHoliday_throwsException() {
        // NEW guard added in updated service — cannot update a deleted holiday
        existingHoliday.setDeleted(true);

        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));

        HolidayDto dto = new HolidayDto();
        dto.setHolidayDate("2025-12-25");
        dto.setHolidayName("Christmas");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.updateHoliday(1, dto));

        assertThat(ex.getMessage()).contains("deleted");
        assertThat(ex.getMessage()).contains("1");
        verify(holidayRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateHoliday | non-existent ID → throws RuntimeException, save never called")
    void updateHoliday_nonExistentId_throwsException() {
        when(holidayRepository.findById(99999)).thenReturn(Optional.empty());

        HolidayDto dto = new HolidayDto();
        dto.setHolidayDate("2025-12-25");
        dto.setHolidayName("Christmas");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.updateHoliday(99999, dto));

        assertThat(ex.getMessage()).contains("not found");
        verify(holidayRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateHoliday | invalid date format → throws RuntimeException")
    void updateHoliday_invalidDateFormat_throwsException() {
        HolidayDto badDto = new HolidayDto();
        badDto.setHolidayDate("25/12/2025");
        badDto.setHolidayName("Christmas");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.updateHoliday(1, badDto));

        assertThat(ex.getMessage()).contains("Invalid date format");

        // findById should never be reached — date parsing fails first
        verify(holidayRepository, never()).findById(any());
    }

    @Test
    @DisplayName("softDeleteHoliday | valid ID → isDeleted set to true, save() called, delete() never called")
    void softDeleteHoliday_validId_setsDeletedFlagAndSaves() {
        // existingHoliday starts with isDeleted = false (default)
        assertThat(existingHoliday.isDeleted()).isFalse();

        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));
        when(holidayRepository.save(existingHoliday)).thenReturn(existingHoliday);

        holidayService.softDeleteHoliday(1);

        // isDeleted must be flipped to true on the entity
        assertThat(existingHoliday.isDeleted()).isTrue();

        // save() must be called to persist the flag change
        verify(holidayRepository, times(1)).save(existingHoliday);

        // CRITICAL: delete() must NEVER be called — this is a soft delete
        verify(holidayRepository, never()).delete(any());
        verify(holidayRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("softDeleteHoliday | non-existent ID → throws RuntimeException, save() never called")
    void softDeleteHoliday_nonExistentId_throwsExceptionAndNeverSaves() {
        when(holidayRepository.findById(99999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.softDeleteHoliday(99999));

        assertThat(ex.getMessage()).contains("not found");

        // save() and delete() must both be unreachable
        verify(holidayRepository, never()).save(any());
        verify(holidayRepository, never()).delete(any());
    }

    @Test
    @DisplayName("softDeleteHoliday | already soft-deleted ID → throws RuntimeException, save() never called")
    void softDeleteHoliday_alreadyDeleted_throwsException() {
        existingHoliday.setDeleted(true);

        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.softDeleteHoliday(1));

        assertThat(ex.getMessage()).contains("already deleted");
        assertThat(ex.getMessage()).contains("1");

        verify(holidayRepository, never()).save(any());
    }
}