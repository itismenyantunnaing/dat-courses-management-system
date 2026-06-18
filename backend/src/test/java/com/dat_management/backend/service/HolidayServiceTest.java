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
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HolidayServiceTest {

    @Mock
    private HolidayRepository holidayRepository;

    @InjectMocks
    private HolidayService holidayService;
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
    @DisplayName("getAllHolidays | repo has data → returns full list")
    void getAllHolidays_repoHasData_returnsAllHolidays() {
        // Arrange
        List<Holiday> fakeList = List.of(existingHoliday, new Holiday());
        when(holidayRepository.findAll()).thenReturn(fakeList);

        // Act
        List<Holiday> result = holidayService.getAllHolidays();

        // Assert
        assertThat(result).hasSize(2);
        verify(holidayRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("getAllHolidays | repo empty → returns empty list")
    void getAllHolidays_emptyRepo_returnsEmptyList() {
        when(holidayRepository.findAll()).thenReturn(List.of());

        List<Holiday> result = holidayService.getAllHolidays();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getHolidayById | valid ID → returns correct holiday")
    void getHolidayById_validId_returnsHoliday() {
        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));

        Holiday result = holidayService.getHolidayById(1);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getHolidayName()).isEqualTo("Christmas Day");
        assertThat(result.getHolidayDate()).isEqualTo(LocalDate.of(2025, 12, 25));
    }

    @Test
    @DisplayName("getHolidayById | non-existent ID → throws RuntimeException with 'not found'")
    void getHolidayById_nonExistentId_throwsRuntimeException() {
        when(holidayRepository.findById(99999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.getHolidayById(99999));

        assertThat(ex.getMessage()).contains("not found");
        assertThat(ex.getMessage()).contains("99999");
    }

    @Test
    @DisplayName("createHoliday | valid dto, no duplicate → saves and returns holiday")
    void createHoliday_validDto_savesAndReturnsHoliday() {
        // Arrange
        when(holidayRepository.existsByHolidayDate(LocalDate.of(2025, 12, 25)))
                .thenReturn(false);  // no duplicate exists
        when(holidayRepository.save(any(Holiday.class)))
                .thenReturn(existingHoliday);  // fake what save() returns

        // Act
        Holiday result = holidayService.createHoliday(validDto);

        // Assert:
        assertThat(result.getHolidayName()).isEqualTo("Christmas Day");
        assertThat(result.getHolidayDate()).isEqualTo(LocalDate.of(2025, 12, 25));

        // Assert:
        verify(holidayRepository, times(1)).save(any(Holiday.class));
    }

    @Test
    @DisplayName("createHoliday | duplicate date → throws RuntimeException, save() never called")
    void createHoliday_duplicateDate_throwsExceptionAndNeverSaves() {
        when(holidayRepository.existsByHolidayDate(any()))
                .thenReturn(true);  // pretend duplicate exists

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.createHoliday(validDto));

        assertThat(ex.getMessage()).contains("already exists");

        // CRITICAL: verify save() was NEVER called — no partial writes to DB
        verify(holidayRepository, never()).save(any());
    }

    @Test
    @DisplayName("createHoliday | invalid date format (DD-MM-YYYY) → throws RuntimeException")
    void createHoliday_invalidDateFormat_throwsRuntimeException() {
        HolidayDto badDto = new HolidayDto();
        badDto.setHolidayDate("25-12-2025");  // wrong format — should be yyyy-MM-dd
        badDto.setHolidayName("Christmas Day");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.createHoliday(badDto));

        assertThat(ex.getMessage()).contains("Invalid date format");
        assertThat(ex.getMessage()).contains("yyyy-MM-dd");

        // Repo should never be touched if date parsing fails
        verify(holidayRepository, never()).existsByHolidayDate(any());
        verify(holidayRepository, never()).save(any());
    }

    @Test
    @DisplayName("createHoliday | date with leading/trailing spaces → parses successfully")
    void createHoliday_dateWithWhitespace_trimsAndSucceeds() {
        // Service calls dateStr.trim() — verify this actually works
        HolidayDto spacedDto = new HolidayDto();
        spacedDto.setHolidayDate("  2025-12-25  ");  // spaces around date
        spacedDto.setHolidayName("Christmas Day");

        when(holidayRepository.existsByHolidayDate(LocalDate.of(2025, 12, 25)))
                .thenReturn(false);
        when(holidayRepository.save(any(Holiday.class))).thenReturn(existingHoliday);

        // Should NOT throw — trim() handles the spaces
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
    @DisplayName("createMultipleHolidays | all valid → saves all, returns list")
    void createMultipleHolidays_allValid_savesAll() {
        HolidayDto dto2 = new HolidayDto();
        dto2.setHolidayDate("2026-01-01");
        dto2.setHolidayName("New Year");

        when(holidayRepository.existsByHolidayDate(any())).thenReturn(false);
        when(holidayRepository.saveAll(anyList())).thenReturn(List.of(existingHoliday, new Holiday()));

        List<Holiday> result = holidayService.createMultipleHolidays(List.of(validDto, dto2));

        assertThat(result).hasSize(2);
        verify(holidayRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("createMultipleHolidays | one duplicate → throws exception, saveAll() never called")
    void createMultipleHolidays_oneDuplicate_throwsAndSavesNothing() {
        HolidayDto dto2 = new HolidayDto();
        dto2.setHolidayDate("2026-01-01");
        dto2.setHolidayName("New Year");

        // First date = no duplicate, second date = duplicate
        when(holidayRepository.existsByHolidayDate(LocalDate.of(2025, 12, 25)))
                .thenReturn(false);
        when(holidayRepository.existsByHolidayDate(LocalDate.of(2026, 1, 1)))
                .thenReturn(true);  // this one causes the failure

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.createMultipleHolidays(List.of(validDto, dto2)));

        assertThat(ex.getMessage()).contains("already exists");

        // saveAll() must NEVER be called — all-or-nothing batch
        verify(holidayRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("createMultipleHolidays | one invalid date format → throws, saveAll() never called")
    void createMultipleHolidays_oneInvalidDate_throwsAndSavesNothing() {
        HolidayDto badDto = new HolidayDto();
        badDto.setHolidayDate("25-12-2025");  // wrong format
        badDto.setHolidayName("Christmas Day");

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
        when(holidayRepository.existsByHolidayDate(LocalDate.of(2025, 12, 26)))
                .thenReturn(false);  // new date is available
        when(holidayRepository.save(any(Holiday.class))).thenReturn(existingHoliday);

        Holiday result = holidayService.updateHoliday(1, updateDto);

        assertThat(result).isNotNull();
        verify(holidayRepository, times(1)).save(any(Holiday.class));
    }

    @Test
    @DisplayName("updateHoliday | same date as existing (name change only) → updates successfully")
    void updateHoliday_sameDateNameChange_updatesSuccessfully() {
        // Changing name only — date stays the same
        // Service logic: if date unchanged, skip duplicate check
        HolidayDto updateDto = new HolidayDto();
        updateDto.setHolidayDate("2025-12-25");  // same date
        updateDto.setHolidayName("Christmas Day (Updated)");

        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));
        when(holidayRepository.save(any(Holiday.class))).thenReturn(existingHoliday);

        assertThatCode(() -> holidayService.updateHoliday(1, updateDto))
                .doesNotThrowAnyException();

        verify(holidayRepository, never()).existsByHolidayDate(any());
    }

    @Test
    @DisplayName("updateHoliday | new date conflicts with another holiday → throws RuntimeException")
    void updateHoliday_newDateConflictsWithOther_throwsException() {
        HolidayDto updateDto = new HolidayDto();
        updateDto.setHolidayDate("2026-01-01");  // this date is taken by another holiday
        updateDto.setHolidayName("New Year");

        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));
        when(holidayRepository.existsByHolidayDate(LocalDate.of(2026, 1, 1)))
                .thenReturn(true);  // conflict

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.updateHoliday(1, updateDto));

        assertThat(ex.getMessage()).contains("already exists");
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
        badDto.setHolidayDate("25/12/2025");  // slashes instead of dashes
        badDto.setHolidayName("Christmas");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.updateHoliday(1, badDto));

        assertThat(ex.getMessage()).contains("Invalid date format");

        verify(holidayRepository, never()).findById(any());
    }

    @Test
    @DisplayName("deleteHoliday | valid ID → delete() called exactly once")
    void deleteHoliday_validId_callsDeleteOnce() {
        when(holidayRepository.findById(1)).thenReturn(Optional.of(existingHoliday));
        doNothing().when(holidayRepository).delete(existingHoliday);

        holidayService.deleteHoliday(1);

        verify(holidayRepository, times(1)).delete(existingHoliday);
    }

    @Test
    @DisplayName("deleteHoliday | non-existent ID → throws RuntimeException, delete() never called")
    void deleteHoliday_nonExistentId_throwsExceptionAndNeverDeletes() {
        when(holidayRepository.findById(99999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> holidayService.deleteHoliday(99999));

        assertThat(ex.getMessage()).contains("not found");

        verify(holidayRepository, never()).delete(any());
    }
}