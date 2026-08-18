package com.dat_management.backend.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dat_management.backend.dto.GroupChangeRequest;
import com.dat_management.backend.service.CourseEnrollmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/groupchange")
@RequiredArgsConstructor
public class GroupChangeController {

    private final CourseEnrollmentService service;

    // Employee request
    @PutMapping("/request")
    public String requestGroup(@RequestBody GroupChangeRequest request) {
        service.requestGroupChange(
                request.getEnrollmentId(),
                request.getGroupId());

        return "Request submitted.";
    }

    // Admin changes immediately
    @PutMapping("/{enrollmentId}/adminchange/{groupId}")
    public String adminChangeGroup(
            @PathVariable Integer enrollmentId,
            @PathVariable Integer groupId) {

        service.adminChangeGroup(enrollmentId, groupId);

        return "Group changed successfully.";
    }

    // Admin approves request
    @PutMapping("/{enrollmentId}/approve")
    public String approveRequest(@PathVariable Integer enrollmentId) {

        service.approveRequest(enrollmentId);

        return "Request approved.";
    }

    // Admin rejects request
    @PutMapping("/{enrollmentId}/reject")
    public String rejectRequest(@PathVariable Integer enrollmentId) {

        service.rejectRequest(enrollmentId);

        return "Request rejected.";
    }
}