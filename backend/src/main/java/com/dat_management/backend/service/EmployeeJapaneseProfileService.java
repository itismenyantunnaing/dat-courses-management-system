package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeJapaneseProfileRequest;
import com.dat_management.backend.dto.EmployeeJapaneseProfileResponse;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeJapaneseProfileService {

    private final EmployeeJapaneseProfileRepository profileRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<EmployeeJapaneseProfileResponse> getAll() {
        return profileRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmployeeJapaneseProfileResponse getById(Integer id) {
        return toResponse(findProfile(id));
    }

    @Transactional(readOnly = true)
    public EmployeeJapaneseProfileResponse getByEmployeeId(String employeeId) {
        EmployeeJapaneseProfile profile = profileRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Japanese profile not found for employee id: " + employeeId));

        return toResponse(profile);
    }

    @Transactional
    public EmployeeJapaneseProfileResponse create(EmployeeJapaneseProfileRequest request) {
        String employeeId = requireEmployeeId(request);

        if (profileRepository.existsByEmployeeId(employeeId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Japanese profile already exists for employee id: " + employeeId);
        }

        EmployeeJapaneseProfile profile = new EmployeeJapaneseProfile();
        profile.setEmployee(findEmployee(employeeId));

        setFields(profile, request);

        return toResponse(profileRepository.save(profile));
    }

    @Transactional
    public EmployeeJapaneseProfileResponse update(Integer id, EmployeeJapaneseProfileRequest request) {
        EmployeeJapaneseProfile profile = findProfile(id);

        if (request.getEmployeeId() != null && !request.getEmployeeId().isBlank()) {
            String employeeId = request.getEmployeeId().trim();
            profileRepository.findByEmployeeId(employeeId)
                    .filter(existingProfile -> !existingProfile.getId().equals(id))
                    .ifPresent(existingProfile -> {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Japanese profile already exists for employee id: " + employeeId);
                    });
            profile.setEmployee(findEmployee(employeeId));
        }

        setFields(profile, request);

        return toResponse(profileRepository.save(profile));
    }

    @Transactional
    public void delete(Integer id) {
        if (!profileRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Japanese profile not found with id: " + id);
        }
        profileRepository.deleteById(id);
    }

    @Transactional
    public List<EmployeeJapaneseProfileResponse> importList(List<EmployeeJapaneseProfileRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile list cannot be empty");
        }

        return requests.stream()
                .map(request -> {
                    String employeeId = requireEmployeeId(request);
                    EmployeeJapaneseProfile profile = profileRepository.findByEmployeeId(employeeId)
                            .orElseGet(EmployeeJapaneseProfile::new);
                    if (profile.getEmployee() == null) {
                        profile.setEmployee(findEmployee(employeeId));
                    }
                    setFields(profile, request);
                    return toResponse(profileRepository.save(profile));
                })
                .toList();
    }

    @Transactional
    public void deleteList(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile id list cannot be empty");
        }
        profileRepository.deleteAllById(ids);
    }

    private EmployeeJapaneseProfile findProfile(Integer id) {
        return profileRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Japanese profile not found with id: " + id));
    }

    private Employee findEmployee(String employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee not found with id: " + employeeId));
    }

    private String requireEmployeeId(EmployeeJapaneseProfileRequest request) {
        if (request == null || request.getEmployeeId() == null || request.getEmployeeId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId is required");
        }
        return request.getEmployeeId().trim();
    }

    private void setFields(EmployeeJapaneseProfile profile, EmployeeJapaneseProfileRequest request) {
        profile.setJlptHighestLevel(request.getJlptHighestLevel());
        profile.setOtherJapaneseLevel(request.getOtherJapaneseLevel());
        profile.setPreferredLearningGroup(request.getPreferredLearningGroup());

        profile.setCurrentCommunicationLevel(request.getCurrentCommunicationLevel());

        profile.setTarget1JlptNatLevel(request.getTarget1JlptNatLevel());
        profile.setTarget1CommunicationLevel(request.getTarget1CommunicationLevel());

        profile.setTarget2JlptNatLevel(request.getTarget2JlptNatLevel());
        profile.setTarget2CommunicationLevel(request.getTarget2CommunicationLevel());

        profile.setCurrentLearningLevel(request.getCurrentLearningLevel());
        profile.setLearningMethod(request.getLearningMethod());

        profile.setWantToSitExam(request.getWantToSitExam());
        profile.setExamTargetLevel(request.getExamTargetLevel());
        profile.setJlptNatTest(request.getJlptNatTest());
        profile.setConfidenceLevel(request.getConfidenceLevel());
        // profile.setLanguageSkillLevel(request.getLanguageSkillLevel());
    }

    private EmployeeJapaneseProfileResponse toResponse(EmployeeJapaneseProfile profile) {
        Employee employee = profile.getEmployee();

        return EmployeeJapaneseProfileResponse.builder()

                .id(profile.getId())
                .employee_id(employee != null ? employee.getId() : null)
                .jlptHighestLevel(profile.getJlptHighestLevel())
                .otherJapaneseLevel(profile.getOtherJapaneseLevel())
                .preferredLearningGroup(profile.getPreferredLearningGroup())

                .currentCommunicationLevel(profile.getCurrentCommunicationLevel())

                .target1JlptNatLevel(profile.getTarget1JlptNatLevel())
                .target1CommunicationLevel(profile.getTarget1CommunicationLevel())

                .target2JlptNatLevel(profile.getTarget2JlptNatLevel())
                .target2CommunicationLevel(profile.getTarget2CommunicationLevel())

                .currentLearningLevel(profile.getCurrentLearningLevel())
                .learningMethod(profile.getLearningMethod())

                .wantToSitExam(profile.getWantToSitExam())
                .examTargetLevel(profile.getExamTargetLevel())
                .jlptNatTest(profile.getJlptNatTest())
                .confidenceLevel(profile.getConfidenceLevel())
                // .languageSkillLevel(profile.getLanguageSkillLevel())

                .build();
    }
}
