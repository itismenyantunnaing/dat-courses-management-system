
import {
  SessionLearnerRow,
  SessionProgressRow,
  SelfStudyProgressFields,
  SELF_STUDY_COLUMNS,
  AttendanceSummary,
  ProgressSummary,
} from "@/types/schedule"
import {
  DOW_LONG,
  MONTH_SHORT,
} from "../constants/schedule.constants"

export const getInitials = (name: string) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export const getWeekStart = (refDate: Date) => {
  const date = new Date(refDate)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diffToMonday)
  date.setHours(0, 0, 0, 0)
  return date
}

export const getWeekDates = (weekStart: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const formatHourLabel = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour} ${period}`
}

export const formatTimeLabel = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = Math.floor(hour % 12 === 0 ? 12 : hour % 12)
  const minutes = Math.round((hour % 1) * 60)
  return minutes === 0
    ? `${displayHour} ${period}`
    : `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`
}

export const formatFullDate = (d: Date) => {
  const dow = DOW_LONG[d.getDay()]
  const month = MONTH_SHORT[d.getMonth()]
  return ` ${month} ${d.getDate()} ${d.getFullYear()} (${dow})`
}

export const formatWeekRangeLabel = (weekDates: Date[]) => {
  const start = weekDates[0]
  const end = weekDates[6]
  const startMonth = start.toLocaleString("default", { month: "short" })
  const endMonth = end.toLocaleString("default", { month: "short" })
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()} ${year}`
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()} ${year}`
}

export const formatStudyColumnLabel = (col: { start: Date; end: Date }) => {
  const startMonth = col.start.toLocaleString("default", { month: "short" })
  const endMonth = col.end.toLocaleString("default", { month: "short" })
  if (startMonth === endMonth) {
    return `${startMonth} ${col.start.getDate()} - ${col.end.getDate()}`
  }
  return `${startMonth} ${col.start.getDate()} - ${endMonth} ${col.end.getDate()}`
}

export const formatMonthLabel = (date: Date) => {
  return date.toLocaleString("default", { month: "short" })
}

export const calculateAttendanceSummary = (
  rows: SessionLearnerRow[]
): AttendanceSummary => {
  const total = rows.length || 1
  const present = rows.filter((r) => r.status === "PRESENT").length
  const absent = rows.filter((r) => r.status === "ABSENT").length
  const late = rows.filter((r) => r.status === "LATE").length
  const excused = rows.filter((r) => r.status === "EXCUSED").length
  const ratePercent = Math.round(((present + late + excused) / total) * 100)
  return { total, present, absent, late, excused, ratePercent }
}

export const calculateProgressSummary = (
  rows: SessionProgressRow[]
): ProgressSummary => {
  let totalCurrent = 0
  let totalTarget = 0
  rows.forEach((row) => {
    SELF_STUDY_COLUMNS.forEach(({ key }) => {
      totalCurrent += row[`${key}Current` as keyof SelfStudyProgressFields]
      totalTarget += row[`${key}Target` as keyof SelfStudyProgressFields]
    })
  })
  const ratePercent = totalTarget
    ? Math.round((totalCurrent / totalTarget) * 100)
    : 0
  return { totalCurrent, totalTarget, ratePercent }
}

export const getLearnerCompletion = (row: SessionProgressRow): number => {
  let totalCurrent = 0
  let totalTarget = 0
  SELF_STUDY_COLUMNS.forEach(({ key }) => {
    totalCurrent += row[`${key}Current` as keyof SelfStudyProgressFields]
    totalTarget += row[`${key}Target` as keyof SelfStudyProgressFields]
  })
  return totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
}