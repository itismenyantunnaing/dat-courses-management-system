import type { EmployeeJapaneseLevel, TargetDates } from "@/types/current_target"
import { Employee, type Division } from "@/types/employee"
import { Holiday } from "@/types/holiday"
import {
  SkillCategory,
  EmployeeSkill,
  DevelopmentCapability,
  EmployeeDevelopmentExperience,
  LanguageSkill,
  ManagementScore,
  type dictionary,
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
import type {
  CategoryItem,
  Course,
  CourseCategoryData,
  BackendCourseDto,
  BackendCategoryDto
} from "@/types/course"
import {
  CourseStatsDTO,
  DepartmentMonthlyAttendanceDTO,
  RiskResponseDTO,
  OverallCertificateStatisticsDTO,
  TeamCertificateStatisticsDTO,
  ActiveLearnerResponseDTO,
  EmployeeCourseStatsResponseDTO,
  EmployeeProgressResponseDTO,
  EmployeeCourseSummaryResponseDTO,
  type UpcomingSessionResponse,
  type EmployeeTargetLevelDTO
} from '@/types/dashboard';
import type { FeedbackSuggestionDto } from "@/types/feedback"
import type { AuditLog } from "@/types/audit-log"
import type { NotificationSettings } from "@/types/notification"

export interface SystemConfig {
  id: number;
  fileUploadSizeMb: number;
  sessionTimeoutMinutes: number;
  jwtExpiryHours: number;
  maxLoginAttempts: number;
  activeSmtpProvider?: "GMAIL" | "OUTLOOK";
  gmailHost?: string;
  gmailPort?: number;
  gmailUsername?: string;
  gmailPassword?: string;
  outlookHost?: string;
  outlookPort?: number;
  outlookUsername?: string;
  outlookPassword?: string;
}

export interface SystemConfig_StoreType {
  systemConfig: SystemConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetch_SystemConfig: () => Promise<void>;
  update_SystemConfig: (config: Partial<SystemConfig>) => Promise<SystemConfig>;
}

export interface Employee_StoreType {
  employee_data: Employee[]
  divisions: Division[]
  isCreating?: boolean
  isDeleting?: boolean
  isUpdating?: boolean
  division_options: { value: string; label: string }[]
  department_options: { value: string; label: string }[]
  team_options: { value: string; label: string }[]
  role_options: { value: string; label: string }[]
  fetch_EmployeeData: () => Promise<void>
  fetch_divisions: () => Promise<void>
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

export interface Feedback_StoreType {
  feedback: FeedbackSuggestionDto[];
  isCreating: boolean;
  isUpdating: boolean;
  isLoading: boolean;
  fetch_FeedbackData: () => Promise<void>;
  fetch_FeedbackByEmployeeId: (employeeId: string) => Promise<string | undefined>;
  add_FeedbackData: (newFeedback: FeedbackSuggestionDto) => Promise<string>;
  delete_FeedbackData: (feedbackIds: number | number[]) => Promise<string>;
  update_FeedbackData: (id: number, updatedFeedback: FeedbackSuggestionDto) => Promise<string>;
  clear_FeedbackData: () => void;
}

export interface SkillSet_StoreType {
  // State
  dictionary: dictionary[],
  managementScores_Data: ManagementScore[];
  skillData: EmployeeSkill[];
  skill_headers: SkillCategory[];
  devCap_headers: DevelopmentCapability[];
  devCap_data: DevelopmentCapability[];
  languageSkill_data: LanguageSkill[];

  // FETCH
  fetch_dictionary: () => Promise<void>;
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
  fetch_DeptData?: () => Promise<void>;
  fetch_TeamData?: () => Promise<void>;
  getDeptWithCounts: () => DeptWithCounts[];
  getTeamWithCounts: () => TeamWithCounts[];
  getTeamsByDept: (deptId: number) => TeamWithCounts[];
}



export interface Certificates_StoreType {
  certificateData: JapaneseCertificate[]
  pendingCertificates: JapaneseCertificate[]
  allCertificates: JapaneseCertificate[]
  fetch_CertificateData: (userId?: string) => Promise<JapaneseCertificate[]>
  fetch_PendingCertificates: (userId?: string) => Promise<JapaneseCertificate[]>
  fetch_AllCertificates: (userId?: string) => Promise<JapaneseCertificate[]>
  add_CertificateData: (certificate: Partial<JapaneseCertificate> & { file?: File }) => Promise<string>
  update_CertificateData: (id: string, updates: Partial<JapaneseCertificate> & { file?: File }) => Promise<string>
  delete_CertificateData: (id: string) => Promise<string>
  verify_CertificateData: (id: string, remark?: string) => Promise<string>
  reject_CertificateData: (id: string, remark?: string) => Promise<string>
}

export interface NotificationStoreType {
  notifications: Notification[];
  unreadCount: number;
  notificationSettings: NotificationSettings | null;
  isLoading: boolean;
  isUpdating: boolean;

  // Notification methods
  fetch_Notifications: (employeeId: string, unreadOnly?: boolean) => Promise<void>;
  fetch_UnreadCount: (employeeId: string) => Promise<void>;
  mark_NotificationRead: (id: number, employeeId: string) => Promise<string>;
  mark_AllNotificationsRead: (employeeId: string) => Promise<string>;

  // Settings methods
  fetch_NotificationSettings: (employeeId: string) => Promise<void>;
  update_NotificationSettings: (settings: NotificationSettings) => Promise<string>;
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

export interface Course_StoreType {
  // ========== STATE ==========
  courses: Course[];
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  courseCategory_data: CourseCategoryData;
  isFormVisible: boolean;
  editingCourse: Course | null;

  // ========== SESSION METHODS ==========
  getToken: () => string | null;
  getUserRole?: () => string | null;
  getUserName?: () => string | null;
  getUserEmail?: () => string | null;
  getUserId?: () => string | null;

  // ========== HELPER METHODS ==========
  getAuthHeaders: () => HeadersInit;
  getMultipartAuthHeaders: () => HeadersInit;
  transformBackendCourseToFrontend: (course: BackendCourseDto) => Course;
  transformFrontendToBackendRequest: (course: Partial<Course>) => Record<string, unknown>;

  // ========== COURSE API METHODS ==========
  fetchAll_CourseData: () => Promise<void>;
  fetch_CourseData: (id: number | string) => Promise<{
    success: boolean;
    course?: Course;
    message?: string;
  }>;
  add_CourseData: (formData: FormData | Record<string, unknown>) => Promise<{
    success: boolean;
    message?: string;
    course?: Course;
  }>;
  update_CourseData: (id: number | string, courseData: Partial<Course>) => Promise<{
    success: boolean;
    message?: string;
    course?: Course;
  }>;
  upload_CourseImage: (id: number | string, formData: FormData) => Promise<{
    success: boolean;
    message?: string;
    course?: Course;
  }>;
  delete_CourseImage: (id: number | string) => Promise<{
    success: boolean;
    message?: string;
    course?: Course;
  }>;
  delete_CourseData: (id: number | string) => Promise<{
    success: boolean;
    message?: string;
  }>;

  // ========== COURSE CATEGORY API METHODS ==========
  fetch_courseCategories: () => Promise<void>;
  add_courseCategories: (categoryName: string, courseType: 'trainer' | 'self-study') => Promise<{
    success: boolean;
    message?: string;
    category?: CourseCategoryData;
  }>;
  update_courseCategories: (categoryId: number, categoryName: string, courseType: 'trainer' | 'self-study') => Promise<{
    success: boolean;
    message?: string;
    category?: CourseCategoryData;
  }>;
  delete_courseCategories: (categoryId: number) => Promise<{
    success: boolean;
    message?: string;
  }>;

  // ========== CATEGORY HELPER FUNCTIONS ==========
  getAllCategories: () => CategoryItem[];
  getCategoryByValue: (value: string) => CategoryItem | undefined;
  getCategoryByIdFromStore: (id: number) => CategoryItem | undefined;
  getCategoryType: (value: string) => string | null;
  getSelfStudyType: (value: string) => string;

  // ========== COURSE ENROLLMENT STATE ==========
  enrollments: EnrolledEmployee[];
  enrollmentError: string | null;
  isEnrolling: boolean;
  isUnenrolling: boolean;
  isUpdatingEnrollment: boolean;

  // ========== COURSE ENROLLMENT METHODS ==========
  fetch_courseEnrollments: (courseId: number | string) => Promise<EnrolledEmployee[]>;
  enrollEmployee: (courseId: number | string, courseGroupId: number) => Promise<{
    success: boolean;
    message?: string;
    data?: EnrolledEmployee;
  }>;
  unenrollEmployee: (courseId: number | string, enrollmentId: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  cancelEnrollment: (courseId: number | string, enrollmentId: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  fetchMyCourses: () => Promise<{
    success: boolean;
    data?: Course[];
    message?: string;
  }>;
  checkMyEnrollment: (courseId: number | string) => Promise<{
    success: boolean;
    isEnrolled: boolean;
    enrollment?: EnrolledEmployee;
    message?: string;
  }>;
  getMyEnrollment: (courseId: number | string) => EnrolledEmployee | null;
  isMeEnrolled: (courseId: number | string) => boolean;
  getEnrollmentByEmployeeId: (courseId: number | string, employeeId: string) => EnrolledEmployee | null;
  isEmployeeEnrolled: (courseId: number | string, employeeId: string) => boolean;
  getEnrollmentCountsByStatus: (courseId: number | string) => {
    total: number;
    approved: number;
    pending: number;
    cancelled: number;
    completed: number;
  };
  clearEnrollments: () => void;
  resetEnrollmentStates: () => void;

  // ========== SELF-STUDY PROGRESS STATE ==========
  studyProgress: StudyProgressData | null;
  isFetchingProgress: boolean;
  isAddingProgress: boolean;
  isUpdatingProgress: boolean;
  progressError: string | null;

  // ========== SELF-STUDY PROGRESS METHODS ==========
  fetch_studyProgress: (courseId: number | string) => Promise<{
    success: boolean;
    progress?: StudyProgressData;
    message?: string;
  }>;
  add_studyProgress: (courseId: number | string, progressData: StudyProgressInput) => Promise<{
    success: boolean;
    message?: string;
    data?: StudyProgressData;
  }>;
  update_studyProgress: (courseId: number | string, progressId: number, progressData: StudyProgressInput) => Promise<{
    success: boolean;
    message?: string;
    data?: StudyProgressData;
  }>;

  // ========== ATTENDANCE STATE ==========
  attendances: AttendanceRecord[];
  isFetchingAttendance: boolean;
  isCreatingAttendance: boolean;
  isUpdatingAttendance: boolean;
  attendanceError: string | null;

  // ========== ATTENDANCE METHODS ==========
  fetchAttendance: (courseId: number | string, groupId: number) => Promise<AttendanceRecord[]>;
  createAttendance: (courseId: number | string, groupId: number, data: CreateAttendanceInput) => Promise<{
    success: boolean;
    message?: string;
    data?: AttendanceRecord;
  }>;
  updateAttendance: (courseId: number | string, groupId: number, attendanceId: number, data: UpdateAttendanceInput) => Promise<{
    success: boolean;
    message?: string;
    data?: AttendanceRecord;
  }>;

  // ========== GROUP CHANGE STATE ==========
  groupChangeError: string | null;
  isRequestingGroupChange: boolean;
  isAdminChangingGroup: boolean;
  isApprovingGroupChange: boolean;
  isRejectingGroupChange: boolean;
  groupChangeSuccess: string | null;

  // ========== GROUP CHANGE METHODS ==========
  requestGroupChange: (enrollmentId: number, groupId: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  adminChangeGroup: (enrollmentId: number, groupId: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  approveGroupChange: (enrollmentId: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  rejectGroupChange: (enrollmentId: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  getGroupChangeRequests: (courseId: number | string) => GroupChangeRequest[];
  getPendingGroupChangeCount: (courseId: number | string) => number;
  hasPendingGroupChange: (enrollmentId: number) => boolean;
  clearGroupChangeState: () => void;
  resetGroupChangeStates: () => void;

  // ========== LEGACY/UTILITY COURSE OPERATIONS ==========
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourse: (id: string) => Course | undefined;
  initializeCourses: () => void;

  // ========== UI STATE METHODS ==========
  setIsFormVisible: (visible: boolean) => void;
  setEditingCourse: (course: Course | null) => void;
  resetForm: () => void;
}

// ========== SUPPORTING TYPES ==========

export interface EnrolledEmployee {
  id: number;
  employeeId: string;
  employeeName: string;
  email: string;
  departmentId: number;
  departmentName: string;
  teamId: number;
  teamName: string;
  position: string;
  courseGroupId: number;
  courseGroupName: string;
  enrollmentStatus: string;
  enrolledAt: string;
  pfImage?: string;
  groupChangeStatus?: string;
  requestedCourseGroupId?: number;
  requestedCourseGroupName?: string;
}

export interface StudyProgressData {
  id?: number;
  enrollment_id?: number;
  employee_id?: string;
  employee_name?: string;
  self_study_session_id?: number;
  session_no?: number;
  session_deadline?: string;
  kanji_count?: number;
  vocabulary_count?: number;
  grammar_count?: number;
  reading_minutes?: number;
  listening_minutes?: number;
  completion_status?: string;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  kanji_progress_percent?: number;
  vocabulary_progress_percent?: number;
  grammar_progress_percent?: number;
  reading_progress_percent?: number;
  listening_progress_percent?: number;
}

export interface StudyProgressInput {
  enrollment_id?: number;
  self_study_session_id?: number;
  kanji_count?: number;
  vocabulary_count?: number;
  grammar_count?: number;
  reading_minutes?: number;
  listening_minutes?: number;
  completion_status?: string;
}

export interface AttendanceRecord {
  id: number;
  enrollmentId: number;
  employeeId: string;
  employeeName: string;
  courseSessionId: number;
  sessionNo: number;
  sessionDate: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  registeredAt: string;
}

export interface CreateAttendanceInput {
  enrollmentId: number;
  courseSessionId: number;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface UpdateAttendanceInput {
  enrollmentId?: number;
  courseSessionId?: number;
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface GroupChangeRequest {
  id: number;
  enrollmentId: number;
  employeeName: string;
  email: string;
  courseGroupId: number;
  courseGroupName: string;
  requestedCourseGroupId: number;
  requestedCourseGroupName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';
  requestedAt: string;
  processedAt?: string;
}

export interface DashboardData_StoreType {
  // State
  courseStats: CourseStatsDTO[];
  monthlyAttendance: DepartmentMonthlyAttendanceDTO[];
  riskData: RiskResponseDTO | null;
  overallCertificateStats: OverallCertificateStatisticsDTO | null;
  teamCertificateStats: TeamCertificateStatisticsDTO | null;
  activeLearnerCount: ActiveLearnerResponseDTO | null;
  employeeCourseStats: EmployeeCourseStatsResponseDTO | null;
  employeeProgress: EmployeeProgressResponseDTO | null;
  employeeCourseSummary: EmployeeCourseSummaryResponseDTO[];
  upcomingSessions: UpcomingSessionResponse[];
  employeeTargetLevel: EmployeeTargetLevelDTO | null;  
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourseStats: () => Promise<void>;
  fetchDailyAttendance: () => Promise<void>;
  fetchRiskData: () => Promise<void>;
  fetchOverallCertificateStats: () => Promise<void>;
  fetchTeamCertificateStats: () => Promise<void>;
  fetchActiveLearnerCount: () => Promise<void>;
  fetchEmployeeCourseStats: (employeeId: string) => Promise<void>;
  fetchEmployeeAttendance: (employeeId: string) => Promise<void>;
  fetchAllEmployeesCourseSummary: () => Promise<void>;
  fetchUpcomingSessions: (employeeId: string) => Promise<void>; 
  fetchEmployeeTargetLevel: (employeeId: string) => Promise<void>;
  reset: () => void;
}

// types/index.ts or types/store.ts
export interface AuditLog_StoreType {
  auditLogs: AuditLog[];
  allAuditLogs: AuditLog[];
  isCreating: boolean;
  isLoading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
  _filters: {
    employeeId?: string;
    module?: string;
    action?: string;
    from?: string;
    to?: string;
  };
  fetch_AuditLogs: (
    employeeId?: string,
    module?: string,
    action?: string,
    from?: string,
    to?: string,
    page?: number,
    size?: number
  ) => Promise<void>;
  fetch_AuditLogsWithFilters: (
    employeeId?: string,
    module?: string,
    action?: string,
    from?: string,
    to?: string,
    page?: number,
    size?: number
  ) => Promise<void>;
  fetch_AuditLogById: (id: number) => Promise<AuditLog>;
  fetch_AllAuditLogs: (
    employeeId?: string,
    module?: string,
    action?: string,
    from?: string,
    to?: string
  ) => Promise<AuditLog[]>;
  add_AuditLog: (newAuditLog: any) => Promise<any>;
  update_AuditLog: (id: number, updatedAuditLog: any) => Promise<any>;
  delete_AuditLog: (id: number) => Promise<string>;
  delete_BulkAuditLogs: (ids: number[]) => Promise<string>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setPageSize: (size: number) => Promise<void>;
  clearFilters: () => Promise<void>;
  resetPagination: () => Promise<void>;
}

export interface EmployeeProfileStoreType {
  employeeProfile: EmployeeProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  fetch_EmployeeProfile: (employeeId: string) => Promise<void>;
  update_EmployeeProfile: (employeeId: string, formData: FormData) => Promise<string>;
  update_EmployeeProfileFields: (employeeId: string, fields: {
    isCorePersonnel?: boolean;
    hasJapanBusinessTrip?: boolean;
    dob?: string;
  }) => Promise<string>;
  update_ProfileImage: (employeeId: string, file: File) => Promise<string>;
  delete_ProfileImage: (employeeId: string) => Promise<string>;
}

export interface EmployeeProfile {
  employeeId: string;
  profilePhotoPath: string | null;
  isCorePersonnel: boolean;
  hasJapanBusinessTrip: boolean;
  dob: string | null;
}