package com.dat_management.backend.repository;

import com.dat_management.backend.entity.FeedbackSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackSuggestionRepository extends JpaRepository<FeedbackSuggestion, Integer> {
    
    List<FeedbackSuggestion> findByEmployeeId(String employeeId);
}