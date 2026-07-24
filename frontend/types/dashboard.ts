// types/dashboard.ts

// ==============================
// Course Stats Types
// ==============================
export interface CourseStatsDTO {
  name: string;
  enrolled: number;
  completed: number;
  category: string;
  completionRate: number;  // (completed / enrolled) * 100
  courseType: 'TRAINER_PROVIDED' | 'SELF_STUDY';
}

// ==============================
// Monthly Attendance Types
// ==============================
export interface DepartmentMonthlyAttendanceDTO {
  departmentName: string;
  teams: TeamMonthlyAttendanceDTO[];
}

export interface TeamMonthlyAttendanceDTO {
  teamName: string;
  courses: CourseMonthlyAttendanceDTO[];
}

export interface CourseMonthlyAttendanceDTO {
  courseName: string;
  groups: GroupMonthlyAttendanceDTO[];
}

export interface GroupMonthlyAttendanceDTO {
  groupName: string;
  monthlyAttendance: MonthlyAttendanceDetailDTO[];
}

export interface MonthlyAttendanceDetailDTO {
  month: string;
  year: number;
  attendance: number;
  presentCount: number;
  totalSessions: number;
  totalStudents: number;
}

// ==============================
// Risk Types
// ==============================
export interface RiskResponseDTO {
  atRiskStudents: RiskDTO[];
  totalAtRisk: number;
  summary: RiskSummaryDTO;
}

export interface RiskDTO {
  name: string;
  issue: string;
  risk: number;  // Percentage
  department: string;
  team: string;
  course: string;
}

export interface RiskSummaryDTO {
  totalAtRisk: number;
  byIssue: IssueBreakdownDTO;
  byDepartment: DepartmentBreakdownDTO;
  byRiskLevel: RiskLevelDTO;
}

export interface IssueBreakdownDTO {
  lowAttendance: number;
  lowProgress: number;
}

export interface DepartmentBreakdownDTO {
  departments: DepartmentRiskDTO[];
}

export interface DepartmentRiskDTO {
  departmentName: string;
  atRiskCount: number;
}

export interface RiskLevelDTO {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

// ==============================
// Active Learner Types
// ==============================
export interface ActiveLearnerResponseDTO {
  totalActiveLearners: number;
  // Add other fields based on your backend response
}

// ==============================
// Employee Course Stats Types
// ==============================
export interface EmployeeCourseStatsResponseDTO {
  employeeId: string;
  employeeName: string;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  completionRate: number;  // Percentage
  totalSessions: number;
  activeSessions: number;
  courses: EmployeeCourseDetailDTO[];
}

export interface EmployeeCourseDetailDTO {
  courseName: string;
  courseType: string;  // "TRAINER_PROVIDED" | "SELF_STUDY"
  status: string;      // "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED"
  attendance: number;  // For TRAINER: attendance %, For SELF_STUDY: progress %
  totalSessions: number;
  groupName: string;
}

// ==============================
// Employee Progress Types
// ==============================
export interface EmployeeProgressResponseDTO {
  employeeId: string;
  employeeName: string;
  courses: EmployeeCourseProgressDTO[];
}

export interface EmployeeCourseProgressDTO {
  courseName: string;
  courseType: string;  // "TRAINER_PROVIDED" | "SELF_STUDY"
  status: string;      // "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED"
  attendance: number;  // Attendance percentage or progress percentage
  groupName: string;
}

// ==============================
// Employee Course Summary Types
// ==============================
export interface EmployeeCourseSummaryResponseDTO {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  teamName: string;
  completedCourses: CourseSummaryDTO;
  attendingCourses: CourseSummaryDTO;
}

export interface CourseSummaryDTO {
  count: number;
  courses: string[];  // List of course names
}

// ==============================
// Certificate Statistics Types
// ==============================
export interface OverallCertificateStatisticsDTO {
  totalEmployees: number;
  totalCourses: number;
  totalCertificatesIssued: number;
  completionRate: number;
  // Add other fields based on your backend response
}

export interface TeamCertificateStatisticsDTO {
  teamName: string;
  totalEmployees: number;
  certificatesIssued: number;
  completionRate: number;
  // Add other fields based on your backend response
}

export interface UpcomingSessionResponse {
  courseName: string;
  courseType: 'TRAINER_PROVIDED' | 'SELF_STUDY';
  sessionNo: number;
  sessionDate: string;  // LocalDate -> ISO string
  startTime: string;    // LocalTime -> ISO string
  endTime: string;      // LocalTime -> ISO string
  status: string;       // "ACTIVE" | "UPCOMING" | "COMPLETED" etc.
  attendanceStatus: string | null; // "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null
  
  // Self-study progress fields (will be null for trainer-led)
  grammarCount: number | null;
  vocabularyCount: number | null;
  kanjiCount: number | null;
  readingMinutes: number | null;
  listeningMinutes: number | null;
  
  // Self-study targets (will be null for trainer-led)
  grammarTarget: number | null;
  vocabularyTarget: number | null;
  kanjiTarget: number | null;
  readingTargetMinutes: number | null;
  listeningTargetMinutes: number | null;
}

export interface EmployeeTargetLevelDTO {
  employeeId: string;
  targetJlptNatLevel: string; 
  targetDate: string;         
}