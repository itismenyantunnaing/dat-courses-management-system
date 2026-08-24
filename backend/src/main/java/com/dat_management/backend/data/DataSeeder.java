// package com.dat_management.backend.data;

// import com.dat_management.backend.entity.DepartmentDat;
// import com.dat_management.backend.entity.DepartmentDir;
// import com.dat_management.backend.entity.Division;
// import com.dat_management.backend.entity.Employee;
// import com.dat_management.backend.entity.Role;
// import com.dat_management.backend.entity.Team;
// import com.dat_management.backend.repository.DepartmentDatRepository;
// import com.dat_management.backend.repository.DepartmentDirRepository;
// import com.dat_management.backend.repository.DivisionRepository;
// import com.dat_management.backend.repository.EmployeeRepository;
// import com.dat_management.backend.repository.RoleRepository;
// import com.dat_management.backend.repository.TeamRepository;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.stereotype.Component;

// import java.time.LocalDate;
// import java.util.ArrayList;
// import java.util.List;

// @Component
// public class DataSeeder implements CommandLineRunner {

//     private final EmployeeRepository employeeRepository;
//     private final RoleRepository roleRepository;
//     private final DivisionRepository divisionRepository;
//     private final DepartmentDatRepository departmentDatRepository;
//     private final DepartmentDirRepository departmentDirRepository;
//     private final TeamRepository teamRepository;
//     private final PasswordEncoder passwordEncoder;

//     public DataSeeder(EmployeeRepository employeeRepository,
//                       RoleRepository roleRepository,
//                       DivisionRepository divisionRepository,
//                       DepartmentDatRepository departmentDatRepository,
//                       DepartmentDirRepository departmentDirRepository,
//                       TeamRepository teamRepository,
//                       PasswordEncoder passwordEncoder) {
//         this.employeeRepository = employeeRepository;
//         this.roleRepository = roleRepository;
//         this.divisionRepository = divisionRepository;
//         this.departmentDatRepository = departmentDatRepository;
//         this.departmentDirRepository = departmentDirRepository;
//         this.teamRepository = teamRepository;
//         this.passwordEncoder = passwordEncoder;
//     }

//     @Override
//     public void run(String... args) {
//         seedDivisions();
//         seedDepartmentDirs();
//         List<DepartmentDat> departmentDats = seedDepartmentDats();
//         seedTeams(departmentDats);
//         seedEmployees();
//     }

//     private void seedDivisions() {
//         if (divisionRepository.count() > 0) {
//             System.out.println("Divisions already seeded. Skipping...");
//             return;
//         }

//         System.out.println("Seeding 5 dummy divisions...");
//         List<Division> divisions = new ArrayList<>();
//         for (int i = 1; i <= 5; i++) {
//             Division division = new Division();
//             division.setDivisionName("Division " + i);
//             division.setIsDeleted(false);
//             divisions.add(division);
//         }
//         divisionRepository.saveAll(divisions);
//     }

//     private void seedDepartmentDirs() {
//         if (departmentDirRepository.count() > 0) {
//             System.out.println("Department Dir already seeded. Skipping...");
//             return;
//         }

//         System.out.println("Seeding 5 dummy department dir...");
//         List<DepartmentDir> departmentDirs = new ArrayList<>();
//         for (int i = 1; i <= 5; i++) {
//             DepartmentDir departmentDir = new DepartmentDir();
//             departmentDir.setDeptName("Directory Department " + i);
//             departmentDir.setIsDeleted(false);
//             departmentDirs.add(departmentDir);
//         }
//         departmentDirRepository.saveAll(departmentDirs);
//     }

//     private List<DepartmentDat> seedDepartmentDats() {
//         if (departmentDatRepository.count() > 0) {
//             System.out.println("DepartmentDats already seeded. Skipping...");
//             return departmentDatRepository.findAll();
//         }

//         List<Division> divisions = divisionRepository.findAll();
//         if (divisions.isEmpty()) {
//             System.out.println("No divisions found, cannot seed departmentDats.");
//             return new ArrayList<>();
//         }

//         System.out.println("Seeding 5 dummy departmentDats...");
//         List<DepartmentDat> departmentDats = new ArrayList<>();
//         for (int i = 1; i <= 5; i++) {
//             DepartmentDat departmentDat = new DepartmentDat();
//             // Distribute the 5 departmentDats across the available divisions
//             Division division = divisions.get((i - 1) % divisions.size());
//             departmentDat.setDivision(division);
//             departmentDat.setDeptName("Department " + i);
//             departmentDat.setIsDeleted(false);
//             departmentDats.add(departmentDat);
//         }
//         return departmentDatRepository.saveAll(departmentDats);
//     }

//     private void seedTeams(List<DepartmentDat> departmentDats) {
//         if (teamRepository.count() > 0) {
//             System.out.println("Teams already seeded. Skipping...");
//             return;
//         }

//         if (departmentDats.isEmpty()) {
//             System.out.println("No departmentDats found, cannot seed teams.");
//             return;
//         }

//         System.out.println("Seeding 10 dummy teams...");
//         List<Team> teams = new ArrayList<>();
//         for (int i = 1; i <= 10; i++) {
//             Team team = new Team();
//             // Distribute the 10 teams across the available departmentDats
//             DepartmentDat departmentDat = departmentDats.get((i - 1) % departmentDats.size());
//             team.setDepartmentDat(departmentDat);
//             team.setTeamName("Team " + i);
//             team.setIsDeleted(false);
//             teams.add(team);
//         }
//         teamRepository.saveAll(teams);
//     }

//     private void seedEmployees() {
//         if (employeeRepository.count() > 0) {
//             System.out.println("Database already seeded. Skipping...");
//             return;
//         }

//         System.out.println("Seeding initial roles and employees...");

//         Role adminRole = getOrCreateRole("Admin");
//         Role pmoRole = getOrCreateRole("Approver");
//         Role operatorRole = getOrCreateRole("Learner");
//         Role staffRole = getOrCreateRole("STAFF");

//         List<Employee> testEmployees = new ArrayList<>();

//         // Use a single counter to keep the EMP-XXX sequence continuous across all roles
//         int empCounter = 1;

//         // 1. Generate 3 ADMINS
//         for (int i = 1; i <= 3; i++) {
//             String empId = String.format("EMP-%03d", empCounter++);
//             testEmployees.add(buildTestEmployee(empId, "Admin User " + i, adminRole));
//         }

//         // 2. Generate 5 PMOs
//         for (int i = 1; i <= 5; i++) {
//             String empId = String.format("EMP-%03d", empCounter++);
//             testEmployees.add(buildTestEmployee(empId, "PMO User " + i, pmoRole));
//         }

//         // 3. Generate 15 OPERATORS
//         for (int i = 1; i <= 12; i++) {
//             String empId = String.format("EMP-%03d", empCounter++);
//             testEmployees.add(buildTestEmployee(empId, "Operator User " + i, operatorRole));
//         }

//         employeeRepository.saveAll(testEmployees);
//         System.out.println("Successfully seeded 20 test employees!");
//     }

//     private Role getOrCreateRole(String roleName) {
//         return roleRepository.findByRoleName(roleName)
//                 .orElseGet(() -> {
//                     Role newRole = new Role();
//                     newRole.setRoleName(roleName);
//                     return roleRepository.save(newRole);
//                 });
//     }

//     private Employee buildTestEmployee(String id, String name, Role role) {
//         Employee emp = new Employee();
//         emp.setId(id);
//         emp.setName(name);
//         emp.setEmail(id.toLowerCase() + "@company.com");
//         emp.setDoorlog("DOOR-" + id);
//         emp.setPassword(passwordEncoder.encode("Default123!"));
//         emp.setRole(role);
//         emp.setPosition(role.getRoleName() + " Position");
//         emp.setDob(LocalDate.of(1990, 1, 1));

//         return emp;
//     }
// }