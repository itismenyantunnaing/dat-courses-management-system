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
import type { 
  CategoryItem, 
  Course, 
  CourseCategoryData, 
  BackendCourseDto,
  BackendCategoryDto 
} from "@/types/course"

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