
export type ScheduleView = "week" | "month"
export type ScheduleType = "trainer-provided" | "self-study"

export interface Session {
  id: string
  name: string
  courseName: string
  instructor?: string
  instructorEmail?: string
  dayIndex: number // 0 = Monday ... 6 = Sunday
  startHour: number // decimal hours, e.g. 8.5 = 8:30 AM
  endHour: number
  theme: number // index into SESSION_THEMES
  group?: string
  type?: ScheduleType
  weekIndex?: number // Self-study only: which of the 4 board columns (0-3)
  durationDays?: number // Self-study only: length of the session, defaults to 7
  sessionDate?: Date // For status calculation
  originalSessionId?: string | number // Self-study only
  employeeId?: string // Self-study only
}

export type SessionAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"

export interface SessionLearnerRow {
  id: string
  learnerName: string
  email: string
  department: string
  team: string
  position: string
  group?: string
  status: SessionAttendanceStatus
  note?: string
  lateMinutes?: number
}

export interface SessionDialogState {
  open: boolean
  session: Session | null
}

export type SessionTestRole = "learner" | "admin"

export const SELF_STUDY_COLUMNS = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "kanji", label: "Kanji" },
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
] as const

export type SelfStudyColumnKey = (typeof SELF_STUDY_COLUMNS)[number]["key"]

export interface SelfStudyProgressFields {
  grammarCurrent: number
  grammarTarget: number
  vocabularyCurrent: number
  vocabularyTarget: number
  kanjiCurrent: number
  kanjiTarget: number
  readingCurrent: number
  readingTarget: number
  listeningCurrent: number
  listeningTarget: number
}

export interface SessionProgressRow extends SelfStudyProgressFields {
  id: string
  learnerName: string
  email: string
  department: string
  team: string
  position: string
  group?: string
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  ratePercent: number
}

export interface ProgressSummary {
  totalCurrent: number
  totalTarget: number
  ratePercent: number
}

export interface StudyColumnRange {
  start: Date
  end: Date
}