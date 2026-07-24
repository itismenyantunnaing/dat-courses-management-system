// types/course.ts

export interface Course {
  id: string
  imageUrl?: string
  title: string
  trainerName?: string  // ← Maps from backend 'trainer_name'
  courseType: "trainer" | "self-study"
  categoryId?: number
  category?: string
  targetLevel?: string
  totalSessions?: number
  startDate?: Date
  endDate?: Date
  groups: CourseGroup[] // For trainer courses, at least one group
  self_study_sessions: CourseSession[] // For self-study courses - matches backend 'self_study_sessions'
  registrationDeadline?: Date // Registration deadline for the course
  // Self-study fields
  selfStudyType?: string // Explicit self-study type (e.g., "JLPT", "NAT") - maps from backend 'self_study_type'
  daysPerSession?: number // Number of days between sessions - maps from backend 'session_per_days'
  totalKanji?: number
  totalVocabulary?: number
  totalGrammar?: number
  totalReadingMinutes?: number
  totalListeningMinutes?: number
  mentionedLearners?: MentionedLearner[] // Learners mentioned in this course
  status: "active" | "upcoming" | "completed" | "draft"
  createdAt: Date
  updatedAt: Date
  isDeleted?: boolean
}

// Backend DTO Interfaces
export interface BackendCategoryDto {
  id: number
  course_category_name: string
  course_type: "TRAINER_PROVIDED" | "SELF_STUDY"
  is_deleted: boolean
}

export interface BackendSessionDto {
  id: number
  session_no: number
  session_date: string
  start_time: string
  end_time: string
  session_status: string
}

export interface BackendSelfStudySessionDto {
  id: number
  session_no: number
  file_path?: string
  filepath?: string
  kanji_target: number
  vocabulary_target: number
  grammar_target: number
  reading_target_minutes: number
  listening_target_minutes: number
  session_status: string
  created_at?: string
  updated_at?: string
}

export interface BackendGroupDto {
  id: number
  group_name: string
  capacity: number | null
  group_status: string
  created_at: string
  sessions: BackendSessionDto[]
  registered_count: number
}

export interface BackendCourseDto {
  id: number
  course_name: string
  trainer_name?: string  // ← Maps to Course.trainerName
  self_study_type?: string  // ← Maps to Course.selfStudyType
  course_category_id: number
  target_level?: string
  total_sessions?: number
  session_per_days?: number  // ← Maps to Course.daysPerSession
  start_date?: string
  end_date?: string
  registration_deadline?: string
  status: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  category: BackendCategoryDto
  groups: BackendGroupDto[]
  self_study_sessions: BackendSelfStudySessionDto[]  // ← Maps to Course.self_study_sessions
  image_path?: string
}

export interface CourseCategoryData {
  trainer: CategoryItem[];
  selfStudy: CategoryItem[];
}

// New interface for mentioned learners
export interface MentionedLearner {
  id: string
  name: string
  email: string
  avatar?: string
  department?: string
  team?: string
  status: "active" | "pending" | "completed" | "inactive"
  addedAt: Date
}

// Computed fields interface for display purposes
export interface CourseWithDisplayFields extends Course {
  startDate?: Date
  endDate?: Date
  capacity?: number | "unlimited"
  totalSessions?: number
}

export interface CourseGroup {
  id: string
  name: string // e.g., "Group A", "Group 1"
  capacity: number | undefined
  status?: string
  startDate: Date
  endDate?: Date
  sessionsPerWeek?: number[] // Array of days (0=Sunday, 1=Monday, etc.)
  startTime?: string // e.g., "09:00"
  endTime?: string // e.g., "11:00"
  sessions: CourseSession[]
  registeredCount?: number // Number of registered learners
  createdAt?: Date
}

export interface CourseSession {
  id: string
  sessionNo?: number
  date: Date
  status?: string
  // Trainer course fields
  startTime?: string
  endTime?: string
  // Self-study course fields (these will be calculated per session)
  kanjiCount?: number
  vocabularyCount?: number
  grammarCount?: number
  readingMinutes?: number
  listeningMinutes?: number
  // Link field for non-JLPT self-study courses
  link?: string
}

// Form data interface
export interface CourseFormData {
  title: string
  trainerName?: string
  imageUrl?: string
  courseType: string
  category: string
  categoryId?: number
  registrationDeadline?: Date
  groups: CourseGroup[]
  sessions: CourseSession[]
  selfStudyType?: "jlpt" | "other"
  daysPerSession?: number
  mentionedLearners: MentionedLearner[]
  totalKanji: number
  totalVocabulary: number
  totalGrammar: number
  totalReadingMinutes: number
  totalListeningMinutes: number
  status?: "active" | "upcoming" | "completed" | "draft"
}

export interface CourseFormSubmitData {
  title: string
  trainerName?: string
  imageUrl?: string
  courseType: "trainer" | "self-study"
  category: CourseCategory
  registrationDeadline?: Date
  groups: CourseGroup[]
  sessions: CourseSession[]
  selfStudyType?: "jlpt" | "other"
  daysPerSession?: number
  mentionedLearners?: MentionedLearner[]
  totalKanji?: number
  totalVocabulary?: number
  totalGrammar?: number
  totalReadingMinutes?: number
  totalListeningMinutes?: number
}

export interface CourseFormProps {
  initialData?: CourseFormData
  initialImage?: string | null
  mode: "add" | "edit"
  onSubmit: (data: CourseFormSubmitData) => void
  onCancel: () => void
  onDelete?: () => void
  isSubmitting?: boolean
  onChanges?: (hasChanges: boolean) => void
}

// Category Drawer interfaces
export interface CategoryFormData {
  name: string
  type: "trainer" | "self-study"
  selfStudyType?: "jlpt" | "other"
}

export interface CategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCategory?: CourseCategory | ""
  selectedSelfStudyType?: "jlpt" | "other"
  onSelectCategory: (
    category: CourseCategory,
    selfStudyType?: "jlpt" | "other"
  ) => void
}

export interface CategoryItem {
  id?: number
  value: string
  label: string
  type: "trainer" | "self-study"
  selfStudyType?: "jlpt" | "other"
}

export const COURSE_STATUSES = [
  "active",
  "upcoming",
  "completed",
  "draft",
] as const

export const COURSE_STATUS_LABELS = {
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
  draft: "Draft",
} as const

export const COURSE_TYPES = ["trainer", "self-study"] as const
export const COURSE_TYPE_LABELS = {
  trainer: "Trainer Provided",
  "self-study": "Self Study",
} as const

// Course Categories - Including selfStudyType for self-study categories
export const COURSE_CATEGORIES = {
  trainer: [
    { value: "jlpt-target-trainer", label: "JLPT Exam Target Course" },
    { value: "jlpt-practice-trainer", label: "JLPT Exam Practice Course" },
    {
      value: "business-kaiwa-trainer",
      label: "Japanese Communication (Business Kaiwa)",
    },
    { value: "snr-mf-mark-trainer", label: "SNR-MF, Mark Training" },
  ],
  selfStudy: [
    {
      value: "jlpt-target-selfstudy",
      label: "JLPT Exam Target Course",
      selfStudyType: "jlpt",
    },
    {
      value: "professional-mindset-selfstudy",
      label: "Building A Professional Mindset",
      selfStudyType: "other",
    },
    {
      value: "technical-japanese-selfstudy",
      label: "Technical Japanese",
      selfStudyType: "other",
    },
    { value: "nglp-selfstudy", label: "NGLP Courses", selfStudyType: "other" },
    {
      value: "staff-development-selfstudy",
      label: "Staff Development Course",
      selfStudyType: "other",
    },
    {
      value: "offshore-certification-selfstudy",
      label: "Offshore Certification",
      selfStudyType: "other",
    },
  ],
} as const

export type CourseCategory =
  | "jlpt-target-trainer"
  | "jlpt-practice-trainer"
  | "business-kaiwa-trainer"
  | "snr-mf-mark-trainer"
  | "jlpt-target-selfstudy"
  | "professional-mindset-selfstudy"
  | "technical-japanese-selfstudy"
  | "nglp-selfstudy"
  | "staff-development-selfstudy"
  | "offshore-certification-selfstudy"

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  "jlpt-target-trainer": "JLPT Exam Target Course",
  "jlpt-practice-trainer": "JLPT Exam Practice Course",
  "business-kaiwa-trainer": "Japanese Communication (Business Kaiwa)",
  "snr-mf-mark-trainer": "(SNR-MF, Mark Training)",
  "jlpt-target-selfstudy": "JLPT Exam Target Course",
  "professional-mindset-selfstudy": "Building A Professional Mindset",
  "technical-japanese-selfstudy": "Technical Japanese",
  "nglp-selfstudy": "NGLP Courses",
  "staff-development-selfstudy": "Staff Development Course",
  "offshore-certification-selfstudy": "Offshore Certification",
}

// Helper function to get course type from category
export const getCourseTypeFromCategory = (
  category: CourseCategory
): "trainer" | "self-study" => {
  if (category.includes("-trainer")) return "trainer"
  if (category.includes("-selfstudy")) return "self-study"
  // Fallback - check if it exists in trainer categories
  if (COURSE_CATEGORIES.trainer.some((c) => c.value === category))
    return "trainer"
  return "self-study"
}

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const

// Helper to check if self-study type is JLPT
export const isJLPTType = (selfStudyType?: "jlpt" | "other"): boolean => {
  return selfStudyType === "jlpt"
}

// Helper to get the self-study type for a category
export const getCategorySelfStudyType = (
  category: CourseCategory | ""
): "jlpt" | "other" | undefined => {
  if (!category) return undefined
  const found = COURSE_CATEGORIES.selfStudy.find((c) => c.value === category)
  return found?.selfStudyType
}