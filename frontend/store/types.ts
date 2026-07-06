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
  type TeamCertificationResponse,
} from "@/types/exam_progress_report"
import type { JapaneseCertificate } from "@/types/certificate"
import type { SessionData } from "@/types/session";
import type { DevelopmentData, ManagementSkillData, TechnicalSkillData } from "@/components/drawers/skillset/skillsetForm"

export interface Employee_StoreType {
  employee_data: Employee[]
  isCreating?: boolean
  isDeleting?: boolean
  isUpdating?: boolean
  division_options: { value: string; label: string }[]
  department_options: { value: string; label: string }[]
  team_options: { value: string; label: string }[]
  role_options: { value: string; label: string }[]
  fetch_EmployeeData: () => Promise<void>
  add_EmployeeData: (employee: Employee) => Promise<string>
  delete_EmployeeData: (employeeIds: string | string[]) => Promise<string>
  update_EmployeeData: (id: string, employee: Employee) => Promise<string>
  bulkDelete_EmployeeData: (employeeIds: string[]) => Promise<void>
}

export interface Holiday_StoreType {
  holiday_data: Holiday[]

  fetch_HolidayData: () => Promise<void>
  add_HolidayData: (holiday: Holiday) => Promise<string>
  delete_HolidayData: (holidayIds: number | number[]) => Promise<string>
  update_HolidayData: (id: number, updatedHoliday: Holiday) => Promise<string>
  bulkCreate_HolidayData: (holidays: { holidayName: string; holidayDate: string }[]) => Promise<void>
}

export interface SkillSet_StoreType {
  // State
  managementScores_Data: ManagementScore[];
  skillData: EmployeeSkill[];
  skill_headers: SkillCategory[];
  devCap_headers: DevelopmentCapability[];
  devCap_data: DevelopmentCapability[];
  languageSkill_data: LanguageSkill[];

  // FETCH
  fetch_SkillHeaders: () => Promise<void>;
  fetch_SkillData: () => Promise<void>;
  fetch_managementScoreData: () => Promise<void>;
  fetch_languageSkillData: () => Promise<void>;
  fetch_devCapData: () => Promise<void>;
  fetch_devCapHeaders: () => Promise<void>;

  // ADD
  add_SkillData: (data: {
    employeeId: string;
    skillName: string;
    categoryName?: string;
    subCategoryName?: string;
    yearsOfExperience: number;
    experienceLevel: string;
  }) => Promise<EmployeeSkill>;
  add_managementScoreData: (data: {
    employeeId: string;
    managementExperienceLevel: number;
    qcdScore: number;
    reportConsultScore: number;
    educationScore: number;
  }) => Promise<ManagementScore>;
  add_japaneseLevel: (data: {
    employeeId: string;
    languageSkillLevel: number;
  }) => Promise<LanguageSkill>;
  add_devCapHeaders: (typeNames: string[]) => Promise<DevelopmentCapability[]>;
  add_devCapData: (data: {
    employeeId: string;
    developmentTypeName: string;
    processName: string;
    yearsOfExperience: number;
  }) => Promise<DevelopmentCapability>;
  add_BulkSkillCategories: (data: Array<{
    categoryName: string;
    skillSubCategories?: Array<{
      subCategoryName: string;
      skills?: Array<{
        skillName: string;
      }>;
    }>;
  }>) => Promise<SkillCategory[]>;

  // UPDATE
  update_SkillCategory: (data: {
    id: number;
    categoryName: string;
    skillSubCategories?: Array<{
      id?: number;
      subCategoryName: string;
      skills?: Array<{
        id?: number;
        skillName: string;
      }>;
    }>;
  }) => Promise<SkillCategory>;
  update_SkillData: (id: number, data: {
    employeeId: string;
    skillName: string;
    categoryName?: string;
    subCategoryName?: string;
    yearsOfExperience: number;
    experienceLevel: string;
  }) => Promise<EmployeeSkill>;
  update_managementScoreData: (id: number, data: {
    employeeId: string;
    managementExperienceLevel: number;
    qcdScore: number;
    reportConsultScore: number;
    educationScore: number;
  }) => Promise<ManagementScore>;
  update_japaneseLevel: (id: number, data: {
    employeeId: string;
    languageSkillLevel: number;
  }) => Promise<LanguageSkill>;
  update_devCapData: (id: number, data: {
    employeeId: string;
    developmentTypeName: string;
    processName: string;
    yearsOfExperience: number;
  }) => Promise<DevelopmentCapability>;

  // BULK
  add_BulkLanguageSkills: (data: LanguageSkill[]) => Promise<LanguageSkill[]>;
  add_BulkManagementSkills: (data: ManagementScore[]) => Promise<ManagementScore[]>;
  add_BulkDevelopmentSkills: (data: DevelopmentCapability[]) => Promise<DevelopmentCapability[]>;
  add_BulkTechnicalSkills: (data: TechnicalSkillData[]) => Promise<EmployeeSkill[]>;
}

export interface CurrentTarget_StoreType {
  japaneseTargetDates_Data: TargetDates[];
  employeeJapaneseLevel_Data: EmployeeJapaneseLevel[];
  isLoading: boolean;
  error: string | null;
  fetch_TargetDates: () => Promise<void>;
  update_TargetDates: (id: number, data: TargetDates) => Promise<string>;
  fetch_EmployeeJapaneseLevel: () => Promise<void>;
  add_EmployeeJapaneseLevel: (data: EmployeeJapaneseLevel) => Promise<string>;
  edit_EmployeeJapaneseLevel: (id: number, data: EmployeeJapaneseLevel) => Promise<string>;
  delete_singleJapaneseLevel: (id: number) => Promise<string>;
  delete_bulkJapaneseLevel: (ids: number[]) => Promise<string>;
  deleteEmployeeJapaneseProfileByEmployeeId: (employeeId: string) => Promise<string>;
  bulkCreate_CurrentTargetData: (data: EmployeeJapaneseLevel[]) => Promise<string>;
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
  getDeptWithCounts: () => DeptWithCounts[];
  getTeamWithCounts: () => TeamWithCounts[];
  getTeamsByDept: (deptId: number) => TeamWithCounts[];
}



export interface Certificates_StoreType {
  certificateData: JapaneseCertificate[]
  fetch_CertificateData: (userId?: string) => Promise<JapaneseCertificate[]>
  add_CertificateData: (certificate: JapaneseCertificate) => Promise<string>
  update_CertificateData: (id: string, updates: Partial<JapaneseCertificate>) => Promise<string>
  delete_CertificateData: (id: string) => Promise<string>
}


export interface Session_StoreType {
  session: SessionData | null
  isAuthenticated: boolean
  setSession: (session: SessionData | null) => void
  clearSession: () => void
  getToken: () => string | null
  getUserRole: () => string | null
  getUserName: () => string | null
  getUserEmail: () => string | null
  getUserId: () => string | null
}