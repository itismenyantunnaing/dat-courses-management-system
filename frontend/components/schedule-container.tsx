// components/schedule/ScheduleContainer.tsx
"use client"

import React, { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type ScheduleView = "day" | "week" | "month"

interface Session {
  id: string
  name: string
  dayIndex: number // 0 = Monday ... 6 = Sunday
  startHour: number // decimal hours, e.g. 8.5 = 8:30 AM
  endHour: number
  theme: number // index into SESSION_THEMES
}

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

const HOUR_START = 7 // 7 AM
const HOUR_END = 19 // 7 PM
const HOUR_HEIGHT = 64 // px per hour row

// Pastel block themes, cycled across sessions - mirrors the soft calendar-card
// look in the reference design without leaning on any single default palette.
const SESSION_THEMES = [
  {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-700",
    subtext: "text-blue-600/70",
  },
  {
    bg: "bg-purple-50",
    border: "border-purple-400",
    text: "text-purple-700",
    subtext: "text-purple-600/70",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    text: "text-emerald-700",
    subtext: "text-emerald-600/70",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-700",
    subtext: "text-amber-600/70",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-400",
    text: "text-rose-700",
    subtext: "text-rose-600/70",
  },
]

// ----------------------------------------------------------------------------
// Dummy data - 16 sessions spread across the week
// ----------------------------------------------------------------------------

const DUMMY_SESSIONS: Session[] = [
  {
    id: "1",
    name: "Session 1",
    dayIndex: 0,
    startHour: 8,
    endHour: 9,
    theme: 0,
  },
  {
    id: "2",
    name: "Session 2",
    dayIndex: 0,
    startHour: 9.5,
    endHour: 10.5,
    theme: 2,
  },
  {
    id: "3",
    name: "Session 3",
    dayIndex: 0,
    startHour: 11,
    endHour: 12,
    theme: 1,
  },
  {
    id: "4",
    name: "Session 4",
    dayIndex: 1,
    startHour: 8,
    endHour: 9,
    theme: 0,
  },
  {
    id: "5",
    name: "Session 5",
    dayIndex: 1,
    startHour: 9,
    endHour: 10,
    theme: 2,
  },
  {
    id: "6",
    name: "Session 6",
    dayIndex: 1,
    startHour: 10.5,
    endHour: 11.5,
    theme: 3,
  },
  {
    id: "7",
    name: "Session 7",
    dayIndex: 2,
    startHour: 8.5,
    endHour: 9.5,
    theme: 0,
  },
  {
    id: "8",
    name: "Session 8",
    dayIndex: 2,
    startHour: 10,
    endHour: 11,
    theme: 2,
  },
  {
    id: "9",
    name: "Session 9",
    dayIndex: 2,
    startHour: 12,
    endHour: 13,
    theme: 4,
  },
  {
    id: "10",
    name: "Session 10",
    dayIndex: 3,
    startHour: 9,
    endHour: 10,
    theme: 1,
  },
  {
    id: "11",
    name: "Session 11",
    dayIndex: 3,
    startHour: 11,
    endHour: 12.5,
    theme: 3,
  },
  {
    id: "12",
    name: "Session 12",
    dayIndex: 4,
    startHour: 8,
    endHour: 9,
    theme: 0,
  },
  {
    id: "13",
    name: "Session 13",
    dayIndex: 4,
    startHour: 9.5,
    endHour: 10.5,
    theme: 4,
  },
  {
    id: "14",
    name: "Session 14",
    dayIndex: 4,
    startHour: 11.5,
    endHour: 12.5,
    theme: 2,
  },
  {
    id: "15",
    name: "Session 15",
    dayIndex: 5,
    startHour: 10,
    endHour: 11.5,
    theme: 1,
  },
  {
    id: "16",
    name: "Session 16",
    dayIndex: 6,
    startHour: 11,
    endHour: 12,
    theme: 3,
  },
]

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// Monday of the week containing `refDate`
const getWeekStart = (refDate: Date) => {
  const date = new Date(refDate)
  const day = date.getDay() // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diffToMonday)
  date.setHours(0, 0, 0, 0)
  return date
}

const getWeekDates = (weekStart: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const formatHourLabel = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour} ${period}`
}

const formatTimeLabel = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = Math.floor(hour % 12 === 0 ? 12 : hour % 12)
  const minutes = Math.round((hour % 1) * 60)
  return minutes === 0
    ? `${displayHour} ${period}`
    : `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`
}

const formatWeekRangeLabel = (weekDates: Date[]) => {
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

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ScheduleContainer() {
  const [view, setView] = useState<ScheduleView>("week")
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const today = useMemo(() => new Date(), [])

  const hours = useMemo(
    () =>
      Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  )

  const goToToday = () => setWeekStart(getWeekStart(new Date()))

  const goToPreviousWeek = () =>
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 7)
      return next
    })

  const goToNextWeek = () =>
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 7)
      return next
    })

  const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT

  return (
    <div className="w-full rounded-lg border bg-background">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">Schedule</h2>
          <p className="text-sm text-muted-foreground">
            Stay on top of your sessions this week
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>

          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={goToPreviousWeek}
              aria-label="Previous week"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
            </Button>
            <div className="flex items-center gap-1.5 border-x px-3 text-sm font-medium whitespace-nowrap">
              <HugeiconsIcon
                icon={Calendar01Icon}
                strokeWidth={2}
                className="h-3.5 w-3.5 text-muted-foreground"
              />
              {formatWeekRangeLabel(weekDates)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={goToNextWeek}
              aria-label="Next week"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="h-4 w-4"
              />
            </Button>
          </div>

          <div className="flex items-center rounded-md border p-0.5">
            {(["day", "week", "month"] as ScheduleView[]).map((option) => (
              <Button
                key={option}
                variant={view === option ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 capitalize"
                onClick={() => setView(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Week grid */}
      <div className="max-h-[640px] overflow-y-auto">
        <div className="grid grid-cols-[64px_repeat(7,minmax(120px,1fr))]">
          {/* Sticky day-header row */}
          <div className="sticky top-0 z-20 bg-background" />
          {weekDates.map((date, i) => {
            const isToday = isSameDay(date, today)
            return (
              <div
                key={`head-${i}`}
                className={cn(
                  "sticky top-0 z-20 border-l bg-background py-2 text-center",
                  isToday && "bg-blue-50"
                )}
              >
                <div
                  className={cn(
                    "text-[11px] font-medium text-muted-foreground",
                    isToday && "text-blue-600"
                  )}
                >
                  {WEEKDAY_LABELS[i]}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    isToday && "bg-blue-600 text-white"
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
            )
          })}

          {/* Time gutter */}
          <div className="relative border-t" style={{ height: gridHeight }}>
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((date, dayIndex) => {
            const isToday = isSameDay(date, today)
            const daySessions = DUMMY_SESSIONS.filter(
              (s) => s.dayIndex === dayIndex
            )

            return (
              <div
                key={`col-${dayIndex}`}
                className={cn(
                  "relative border-t border-l",
                  isToday && "bg-blue-50/40"
                )}
                style={{ height: gridHeight }}
              >
                {/* Hour gridlines */}
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-dashed border-muted"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}

                {/* Session blocks */}
                {daySessions.map((session) => {
                  const theme = SESSION_THEMES[session.theme]
                  const top = (session.startHour - HOUR_START) * HOUR_HEIGHT
                  const height =
                    (session.endHour - session.startHour) * HOUR_HEIGHT

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] p-1.5",
                        theme.bg,
                        theme.border
                      )}
                      style={{ top: top + 2, height: Math.max(height - 4, 24) }}
                    >
                      <div
                        className={cn(
                          "truncate text-xs font-medium",
                          theme.text
                        )}
                      >
                        {session.name}
                      </div>
                      <div
                        className={cn("truncate text-[11px]", theme.subtext)}
                      >
                        {formatTimeLabel(session.startHour)} -{" "}
                        {formatTimeLabel(session.endHour)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
