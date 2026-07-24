package com.dat_management.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.dat_management.backend.dto.UpcomingSessionResponse;
import com.dat_management.backend.repository.CourseEnrollmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CourseEnrollmentRepository repository;

    public List<UpcomingSessionResponse> getUpcomingSessions(
            String employeeId) {

        List<UpcomingSessionResponse> responses =
                new ArrayList<>();

        responses.addAll(
                repository.findUpcomingTrainerSessions(
                        employeeId).stream()
                        .map(this::mapTrainerSession)
                        .toList());

        responses.addAll(
                repository.findUpcomingSelfStudySessions(
                        employeeId).stream()
                        .map(this::mapSelfStudySession)
                        .toList());

        return responses;
    }

    public List<UpcomingSessionResponse> getHighlightSessions(
        String employeeId) {

    List<UpcomingSessionResponse> result =
            new ArrayList<>();

    List<UpcomingSessionResponse> trainer =
            repository
                    .findUpcomingTrainerSessions(employeeId)
                    .stream()
                    .map(this::mapTrainerSession)
                    .toList();

    List<UpcomingSessionResponse> selfStudy =
            repository
                    .findUpcomingSelfStudySessions(employeeId)
                    .stream()
                    .map(this::mapSelfStudySession)
                    .toList();

    // Trainer ACTIVE
    trainer.stream()
            .filter(x -> "ACTIVE".equals(
                    x.getStatus()))
            .forEach(result::add);

    // Next Trainer UPCOMING
    trainer.stream()
            .filter(x -> "UPCOMING".equals(
                    x.getStatus()))
            .findFirst()
            .ifPresent(result::add);

    // Self Study IN_PROGRESS
    selfStudy.stream()
            .filter(x -> "IN_PROGRESS".equals(
                    x.getCompletionStatus()))
            .findFirst()
            .ifPresent(result::add);

    // Self Study NOT_STARTED
    selfStudy.stream()
            .filter(x -> "NOT_STARTED".equals(
                    x.getCompletionStatus()))
            .findFirst()
            .ifPresent(result::add);

    return result;
}

    private UpcomingSessionResponse mapTrainerSession(Object[] row) {
        UpcomingSessionResponse response = new UpcomingSessionResponse();
        response.setCourseId(toInteger(row[0]));
        response.setGroupId(toInteger(row[1]));
        response.setSessionId(toInteger(row[2]));
        response.setAttendanceId(toInteger(row[3]));
        response.setProgressId(toInteger(row[4]));
        response.setCourseName((String) row[5]);
        response.setCourseType((String) row[6]);
        response.setSessionNo(toShort(row[7]));
        response.setSessionDate(toLocalDate(row[8]));
        response.setStartTime(toLocalTime(row[9]));
        response.setEndTime(toLocalTime(row[10]));
        response.setStatus((String) row[13]);
        response.setAttendanceStatus((String) row[14]);
        return response;
    }

    private UpcomingSessionResponse mapSelfStudySession(Object[] row) {
        UpcomingSessionResponse response = new UpcomingSessionResponse();
        response.setCourseId(toInteger(row[0]));
        response.setGroupId(toInteger(row[1]));
        response.setSessionId(toInteger(row[2]));
        response.setProgressId(toInteger(row[4]));
        response.setCourseName((String) row[5]);
        response.setCourseType((String) row[6]);
        response.setSessionNo(toShort(row[7]));
        response.setSessionDeadline(toLocalDateTime(row[11]));
        response.setDurationPerSession(toInteger(row[12]));
        response.setStatus((String) row[13]);
        response.setCompletionStatus((String) row[25]);
        response.setGrammarCount(toInteger(row[15]));
        response.setVocabularyCount(toInteger(row[16]));
        response.setKanjiCount(toInteger(row[17]));
        response.setReadingMinutes(toInteger(row[18]));
        response.setListeningMinutes(toInteger(row[19]));
        response.setGrammarTarget(toInteger(row[20]));
        response.setVocabularyTarget(toInteger(row[21]));
        response.setKanjiTarget(toInteger(row[22]));
        response.setReadingTargetMinutes(toInteger(row[23]));
        response.setListeningTargetMinutes(toInteger(row[24]));
        return response;
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        return value instanceof Number number
                ? number.intValue()
                : Integer.parseInt(value.toString());
    }

    private Short toShort(Object value) {
        if (value == null) {
            return null;
        }
        return value instanceof Number number
                ? number.shortValue()
                : Short.parseShort(value.toString());
    }

    private LocalDate toLocalDate(Object value) {
        return value == null ? null : (LocalDate) value;
    }

    private LocalTime toLocalTime(Object value) {
        return value == null ? null : (LocalTime) value;
    }

    private LocalDateTime toLocalDateTime(Object value) {
        return value == null ? null : (LocalDateTime) value;
    }
}