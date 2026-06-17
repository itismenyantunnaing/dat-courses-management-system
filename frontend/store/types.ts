import type { EmployeeJapaneseLevel, TargetDates } from "@/types/current_target"
import { Employee } from "@/types/employee"
import { Holiday } from "@/types/holiday"
import {
  SkillCategory,
  EmployeeSkill,
  DevelopmentCapability,
  EmployeeDevelopmentExperience,
  LanguageSkill,
  ManagementScore,
} from "@/types/skillset"
import {

  type DeptWithCounts,
  type TeamWithCounts,
  type DeptCertificationResponse,
  type TeamCertificationResponse, // ✅ Add Team import
} from "@/types/exam_progress_report"

export interface Employee_StoreType {
  employee_data: Employee[]
  fetch_EmployeeData: () => Promise<void>
}

export interface Holiday_StoreType {
  holiday_data: Holiday[]
  fetch_HolidayData: () => Promise<void>
}

export interface SkillSet_StoreType {
  skillData?: EmployeeSkill[];
  skill_headers?: SkillCategory[];
  devCap_headers?: DevelopmentCapability[];
  devCap_data?: EmployeeDevelopmentExperience[];
  languageSkill_data?: LanguageSkill[];
  managementScores_Data?: ManagementScore[];
  fetch_SkillData: () => Promise<void>;
  fetch_SkillHeaders: () => Promise<void>;
  fetch_devCapHeaders: () => Promise<void>;
  fetch_devCapData: () => Promise<void>;
  fetch_languageSkillData: () => Promise<void>;
  fetch_managementScoreData: () => Promise<void>;
}

export interface CurrentTarget_StoreType {
  japaneseTargetDates_Data?: TargetDates[];
  employeeJapaneseLevel_Data?: EmployeeJapaneseLevel[];
  fetch_TargetDates: () => Promise<void>;
  fetch_EmployeeJapaneseLevel: () => Promise<void>;
}

// export interface ExamProgressReport_StoreType {
//   deptDat_data?: DeptDat[];
//   certificationCounts_data?: CertificationCounts[];
//   team_data?: Team[];
//   fetch_DeptDatData: () => Promise<void>;
//   fetch_CertificationCountsData: () => Promise<void>;
//   fetch_TeamData: () => Promise<void>;
//   getDeptWithCounts: (deptId?: number) => DeptWithCounts[] | DeptWithCounts | null;
//   getTeamWithCounts: (teamId?: number) => TeamWithCounts[] | TeamWithCounts | null;
//   getTeamsByDept: (deptId?: number) => Team[];
// }

export interface ExamProgressReport_StoreType {
    deptData?: DeptCertificationResponse;
    teamData?: TeamCertificationResponse;
    deptDisplayData?: DeptWithCounts[];
    teamDisplayData?: TeamWithCounts[];
    fetch_DeptData: () => Promise<void>;
    fetch_TeamData: () => Promise<void>;
    fetch_TargetDates: () => Promise<void>;
    getDeptWithCounts: () => DeptWithCounts[];
    getTeamWithCounts: () => TeamWithCounts[];
    getTeamsByDept: (deptId: number) => TeamWithCounts[];
}