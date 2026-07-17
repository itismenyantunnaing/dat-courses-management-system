export interface CourseStatsDTO {
  name: string;
  enrolled: number;
  completed: number;
  category: string;
  completionRate: number;  // (completed / enrolled) * 100
  courseType: 'TRAINER_PROVIDED' | 'SELF_STUDY';
}

// types/monthly-attendance.ts
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

// types/risk.ts
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