package com.dat_management.backend.repository;

import com.dat_management.backend.entity.DepartmentDat;
import com.dat_management.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Integer> {
    Optional<Team> findByTeamNameAndDepartmentDat(String teamName, DepartmentDat departmentDat);

    Optional<Team> findByTeamNameIgnoreCaseAndDepartmentDat(String teamName, DepartmentDat departmentDat);

    List<Team> findAllByIsDeletedFalse();

    List<Team> findAllByDepartmentDatAndIsDeletedFalse(DepartmentDat departmentDat);

    List<Team> findAllByDepartmentDatDivisionAndIsDeletedFalse(com.dat_management.backend.entity.Division division);

    Optional<Team> findByIdAndIsDeletedFalse(Integer id);
}
