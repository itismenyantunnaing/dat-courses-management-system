// components/course/tabs/SessionsTab.tsx
"use client"

import React, { useState, useEffect } from "react"
import { resolveUploadUrl } from "@/lib/utils"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  ClockIcon,
  Megaphone02Icon,
  CheckCircle,
  Alert01Icon,
  SaveIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { Course, isJLPTType } from "@/types/course"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { mainStore } from "@/store/mainStore"

interface SessionsTabProps {
  course: Course
  enrollments: any[]
  userRole: string
  currentUserId: string | null
  currentUserEnrollment: any
  isUserEnrolled: boolean
  profile?: any
}

const getInitials = (name: string) => {
  if (!name) return "??"
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const truncateText = (text: string, maxLength: number = 30) => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

export function SessionsTab({
  course,
  enrollments,
  userRole,
  currentUserId,
  currentUserEnrollment,
  isUserEnrolled,
  profile,
}: SessionsTabProps) {
  const isAdmin = userRole === "admin"
  const isApprover = userRole === "approver"
  const isLearner = userRole === "learner"

  const {
    studyProgress,
    fetch_studyProgress,
    add_studyProgress,
    update_studyProgress,
  } = mainStore()

  const [savedProgress, setSavedProgress] = useState<Record<string, any>>({})
  const [sessionInputs, setSessionInputs] = useState<Record<string, any>>({})
  const [savingSessions, setSavingSessions] = useState<Record<string, boolean>>(
    {}
  )

  const TESTING_DATE = new Date()
  // const TESTING_DATE = new Date("2026-08-4")

  const getSessionStatus = (sessionDate: Date | string | undefined) => {
    if (!sessionDate) return "unknown"

    let date: Date
    if (typeof sessionDate === "string") {
      date = new Date(sessionDate)
      if (isNaN(date.getTime())) return "unknown"
    } else if (sessionDate instanceof Date) {
      date = sessionDate
      if (isNaN(date.getTime())) return "unknown"
    } else {
      return "unknown"
    }

    const currentDate = TESTING_DATE || new Date()

    if (currentDate.toDateString() === date.toDateString()) {
      return "today"
    }
    if (currentDate.getTime() > date.getTime()) {
      return "overdue"
    }
    if (currentDate.getTime() < date.getTime()) {
      return "future"
    }
    return "unknown"
  }

  useEffect(() => {
    if (course.id && isUserEnrolled && course.courseType === "self-study") {
      fetch_studyProgress(course.id)
    }
  }, [course.id, isUserEnrolled, course.courseType])

  useEffect(() => {
    if (
      studyProgress &&
      studyProgress.progress &&
      Array.isArray(studyProgress.progress)
    ) {
      const progressMap: Record<string, any> = {}
      studyProgress.progress.forEach((p: any) => {
        if (p.self_study_session_id) {
          if (p.employee_id === currentUserId) {
            progressMap[p.self_study_session_id.toString()] = { ...p, id: p.id }
          } else {
            const compositeKey = `${p.self_study_session_id}-${p.employee_id}`
            progressMap[compositeKey] = { ...p, id: p.id }
          }
        }
      })
      setSavedProgress(progressMap)
    }
  }, [studyProgress, currentUserId])

  useEffect(() => {
    const initialInputs: Record<string, any> = {}
    const sessions =
      course.self_study_sessions?.length > 0
        ? course.self_study_sessions
        : course.sessions || []

    sessions.forEach((session) => {
      const existingProgress = savedProgress[session.id?.toString()]
      if (existingProgress) {
        initialInputs[session.id] = {
          kanjiCount: existingProgress.kanji_count || 0,
          vocabularyCount: existingProgress.vocabulary_count || 0,
          grammarCount: existingProgress.grammar_count || 0,
          readingMinutes: existingProgress.reading_minutes || 0,
          listeningMinutes: existingProgress.listening_minutes || 0,
        }
      } else {
        initialInputs[session.id] = {
          kanjiCount: 0,
          vocabularyCount: 0,
          grammarCount: 0,
          readingMinutes: 0,
          listeningMinutes: 0,
        }
      }
    })
    setSessionInputs(initialInputs)
  }, [course, savedProgress])

  const hasSavedProgress = (sessionId: string) => {
    return !!savedProgress[sessionId]
  }

  const isSessionCompleted = (sessionId: string) => {
    const progress = savedProgress[sessionId]
    return progress?.completion_status === "COMPLETED"
  }

  const handleSessionInputChange = (
    sessionId: string,
    field: string,
    value: string
  ) => {
    const numValue = parseInt(value) || 0
    const session = course.self_study_sessions?.find(
      (s) => String(s.id) === String(sessionId)
    )

    let maxValue = Infinity
    if (field === "kanjiCount") maxValue = session?.kanjiCount || 0
    else if (field === "vocabularyCount")
      maxValue = session?.vocabularyCount || 0
    else if (field === "grammarCount") maxValue = session?.grammarCount || 0
    else if (field === "readingMinutes") maxValue = session?.readingMinutes || 0
    else if (field === "listeningMinutes")
      maxValue = session?.listeningMinutes || 0

    const clampedValue = Math.min(numValue, maxValue)

    setSessionInputs((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: clampedValue,
      },
    }))
  }

  const handleSaveSession = async (sessionId: string) => {
    const values = sessionInputs[sessionId]

    const session = course.self_study_sessions?.find(
      (s) => String(s.id) === String(sessionId)
    )

    if (!session) {
      alert("Session not found")
      return
    }

    const existingProgress = savedProgress[sessionId]

    const progressData = {
      enrollment_id: currentUserEnrollment?.id,
      self_study_session_id: session.id,
      kanji_count: values.kanjiCount || 0,
      vocabulary_count: values.vocabularyCount || 0,
      grammar_count: values.grammarCount || 0,
      reading_minutes: values.readingMinutes || 0,
      listening_minutes: values.listeningMinutes || 0,
      completion_status: "IN_PROGRESS",
    }

    const allTargetsMet =
      (values.kanjiCount || 0) >= (session.kanjiCount || 0) &&
      (values.vocabularyCount || 0) >= (session.vocabularyCount || 0) &&
      (values.grammarCount || 0) >= (session.grammarCount || 0) &&
      (values.readingMinutes || 0) >= (session.readingMinutes || 0) &&
      (values.listeningMinutes || 0) >= (session.listeningMinutes || 0)

    if (allTargetsMet) {
      progressData.completion_status = "COMPLETED"
    }

    setSavingSessions((prev) => ({
      ...prev,
      [sessionId]: true,
    }))

    try {
      let result

      if (!existingProgress) {
        result = await add_studyProgress(course.id, progressData)
      } else {
        result = await update_studyProgress(
          course.id,
          existingProgress.id,
          progressData
        )
      }

      if (result.success) {
        await fetch_studyProgress(course.id)
        alert(
          `Progress saved successfully for Session ${
            session.session_no || session.sessionNo || ""
          }`
        )

        if (allTargetsMet) {
          alert("🎉 Congratulations! Session completed!")
        }
      } else {
        alert(result.message || "Failed to save progress")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred while saving progress")
    } finally {
      setSavingSessions((prev) => ({
        ...prev,
        [sessionId]: false,
      }))
    }
  }

  const firstFutureSessionIndex = React.useMemo(() => {
    const sessionsList =
      course.self_study_sessions?.length > 0
        ? course.self_study_sessions
        : course.sessions || []

    return sessionsList.findIndex((s) => {
      const progress = savedProgress[s.id?.toString()]
      const sessionDate = progress?.session_deadline
        ? new Date(progress.session_deadline)
        : s.date

      if (!sessionDate) return false
      const sessionStatus = getSessionStatus(sessionDate)
      return sessionStatus === "future"
    })
  }, [course.self_study_sessions, course.sessions, savedProgress])

  const sessionsList =
    course.self_study_sessions?.length > 0
      ? course.self_study_sessions
      : course.sessions || []

  const activeEmployees = enrollments.filter(
    (e) => e.enrollmentStatus !== "CANCELLED"
  )

  const filteredEmployees =
    isApprover && profile?.team
      ? activeEmployees.filter((employee) => employee.teamName === profile.team)
      : activeEmployees

  return (
    <TabsContent value="sessions" className="pt-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sessions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessionsList.map((session, index) => {
            const isJLPT = isJLPTType(course.selfStudyType as any)
            const sessionId = session.id
            const hasProgress = hasSavedProgress(sessionId)
            const isCompleted = isSessionCompleted(sessionId)
            const progress = savedProgress[sessionId]
            const sessionDate = progress?.session_deadline
              ? new Date(progress.session_deadline)
              : session.date
            const sessionStatus = getSessionStatus(sessionDate)
            const isFutureSession = sessionStatus === "future"
            const isOverdue = sessionStatus === "overdue"
            const isToday = sessionStatus === "today"
            const isPastOrToday =
              sessionStatus === "overdue" || sessionStatus === "today"

            const isEditable =
              isJLPT &&
              isUserEnrolled &&
              !isCompleted &&
              userRole === "learner" &&
              (sessionStatus === "today" ||
                (sessionStatus === "future" &&
                  index === firstFutureSessionIndex))

            const isLocked =
              isJLPT &&
              isUserEnrolled &&
              !isCompleted &&
              userRole === "learner" &&
              (sessionStatus === "overdue" ||
                (sessionStatus === "future" &&
                  index !== firstFutureSessionIndex))

            const overallProgress = hasProgress
              ? Math.round(
                  ((progress?.kanji_progress_percent || 0) +
                    (progress?.vocabulary_progress_percent || 0) +
                    (progress?.grammar_progress_percent || 0) +
                    (progress?.reading_progress_percent || 0) +
                    (progress?.listening_progress_percent || 0)) /
                    5
                )
              : 0

            let statusBadge = null
            if (isCompleted) {
              statusBadge = (
                <Badge className="bg-green-500 text-[10px] text-white">
                  <HugeiconsIcon
                    icon={CheckCircle}
                    strokeWidth={2}
                    className="mr-1 h-3 w-3"
                  />
                  Completed
                </Badge>
              )
            } else if (
              hasProgress &&
              overallProgress > 0 &&
              overallProgress < 100
            ) {
              statusBadge = (
                <Badge className="bg-blue-500 text-[10px] text-white">
                  Progress ({overallProgress}%)
                </Badge>
              )
            } else if (isOverdue && !isCompleted && sessionDate) {
              statusBadge = (
                <Badge className="bg-red-500 text-[10px] text-white">
                  Overdue by{" "}
                  {Math.ceil(
                    (TESTING_DATE.getTime() - new Date(sessionDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </Badge>
              )
            } else if (isFutureSession) {
              statusBadge = (
                <Badge variant="secondary" className="text-[10px]">
                  Upcoming
                </Badge>
              )
            } else if (!hasProgress && isPastOrToday) {
              statusBadge = (
                <Badge
                  variant="outline"
                  className="border-yellow-400 bg-yellow-50 text-[10px] text-yellow-600"
                >
                  Active
                </Badge>
              )
            }

            return (
              <Card
                key={sessionId || index}
                className={cn(
                  "flex flex-col overflow-hidden border-muted bg-muted/5 transition-colors",
                  isFutureSession &&
                    index !== firstFutureSessionIndex &&
                    "opacity-70",
                  isOverdue && !isCompleted && "border-red-200 bg-red-50/5"
                )}
              >
                <div className="flex h-full flex-col">
                  <div className="flex flex-col gap-2 bg-muted/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Session {index + 1}
                      </span>
                      {statusBadge}
                    </div>
                    {isFutureSession && index === firstFutureSessionIndex && (
                      <Badge className="self-start bg-purple-500 text-[10px] text-white">
                        Available Now
                      </Badge>
                    )}
                    {isToday && (
                      <Badge className="self-start bg-green-500 text-[10px] text-white">
                        Today
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      {isJLPT ? (
                        <>
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            strokeWidth={1.5}
                            className="h-4 w-4 text-muted-foreground"
                          />
                          <span
                            className={cn(
                              "font-medium",
                              isOverdue && !isCompleted
                                ? "text-red-500"
                                : "text-muted-foreground"
                            )}
                          >
                            {sessionDate
                              ? format(
                                  new Date(sessionDate),
                                  "MMM d, yyyy (EEE)"
                                )
                              : "Dynamic based on enrollment"}
                          </span>
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={ClockIcon}
                            strokeWidth={1.5}
                            className="h-4 w-4 text-muted-foreground"
                          />
                          <span className="font-medium text-muted-foreground">
                            Duration: {session.durationPerSession || 7} days
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isJLPT && (
                    <div className="bg-muted/5 p-3">
                      <p className="mb-2 text-xs text-muted-foreground">
                        🎯 Session Targets:
                      </p>
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-muted-foreground">Kanji:</span>
                          <span className="font-semibold text-primary">
                            {session.kanjiCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-muted-foreground">Vocab:</span>
                          <span className="font-semibold text-primary">
                            {session.vocabularyCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-muted-foreground">
                            Grammar:
                          </span>
                          <span className="font-semibold text-primary">
                            {session.grammarCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-muted-foreground">
                            Reading:
                          </span>
                          <span className="font-semibold text-primary">
                            {session.readingMinutes || 0}min
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-muted-foreground">
                            Listening:
                          </span>
                          <span className="font-semibold text-primary">
                            {session.listeningMinutes || 0}min
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isJLPT &&
                    isUserEnrolled &&
                    hasProgress &&
                    userRole === "learner" && (
                      <div className="flex-1 bg-muted/10 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            📊 Your Progress:
                          </p>
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <Badge className="bg-green-500 text-[10px] text-white">
                                <HugeiconsIcon
                                  icon={CheckCircle}
                                  strokeWidth={2}
                                  className="mr-1 h-3 w-3"
                                />
                                Completed
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500 text-[10px] text-white">
                                Progress ({overallProgress}%)
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">
                                Kanji
                              </span>
                              <span className="font-semibold text-primary">
                                {progress?.kanji_progress_percent || 0}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${Math.min(progress?.kanji_progress_percent || 0, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">
                                Vocab
                              </span>
                              <span className="font-semibold text-primary">
                                {progress?.vocabulary_progress_percent || 0}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${Math.min(progress?.vocabulary_progress_percent || 0, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">
                                Grammar
                              </span>
                              <span className="font-semibold text-primary">
                                {progress?.grammar_progress_percent || 0}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${Math.min(progress?.grammar_progress_percent || 0, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">
                                Reading
                              </span>
                              <span className="font-semibold text-primary">
                                {progress?.reading_progress_percent || 0}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${Math.min(progress?.reading_progress_percent || 0, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">
                                Listening
                              </span>
                              <span className="font-semibold text-primary">
                                {progress?.listening_progress_percent || 0}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${Math.min(progress?.listening_progress_percent || 0, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {isEditable && (
                    <div className="flex-1 bg-muted/10 p-3">
                      <p className="mb-2 text-xs text-muted-foreground">
                        📝 Enter Your Progress:
                        {isToday && (
                          <span className="ml-2 font-medium text-green-500">
                            (Today's session)
                          </span>
                        )}
                        {isFutureSession &&
                          index === firstFutureSessionIndex && (
                            <span className="ml-2 font-medium text-purple-500">
                              (Available now)
                            </span>
                          )}
                      </p>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Kanji Completed
                            </Label>
                            <Input
                              type="number"
                              value={
                                sessionInputs[sessionId]?.kanjiCount ??
                                progress?.kanji_count ??
                                0
                              }
                              onChange={(e) =>
                                handleSessionInputChange(
                                  sessionId,
                                  "kanjiCount",
                                  e.target.value
                                )
                              }
                              className="h-7 text-sm"
                              min={0}
                              placeholder="0"
                              disabled={savingSessions[sessionId]}
                            />
                            <p className="text-[9px] text-muted-foreground">
                              Target: {session.kanjiCount || 0}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Vocab Completed
                            </Label>
                            <Input
                              type="number"
                              value={
                                sessionInputs[sessionId]?.vocabularyCount ??
                                progress?.vocabulary_count ??
                                0
                              }
                              onChange={(e) =>
                                handleSessionInputChange(
                                  sessionId,
                                  "vocabularyCount",
                                  e.target.value
                                )
                              }
                              className="h-7 text-sm"
                              min={0}
                              placeholder="0"
                              disabled={savingSessions[sessionId]}
                            />
                            <p className="text-[9px] text-muted-foreground">
                              Target: {session.vocabularyCount || 0}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Grammar Completed
                            </Label>
                            <Input
                              type="number"
                              value={
                                sessionInputs[sessionId]?.grammarCount ??
                                progress?.grammar_count ??
                                0
                              }
                              onChange={(e) =>
                                handleSessionInputChange(
                                  sessionId,
                                  "grammarCount",
                                  e.target.value
                                )
                              }
                              className="h-7 text-sm"
                              min={0}
                              placeholder="0"
                              disabled={savingSessions[sessionId]}
                            />
                            <p className="text-[9px] text-muted-foreground">
                              Target: {session.grammarCount || 0}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Reading (min)
                            </Label>
                            <Input
                              type="number"
                              value={
                                sessionInputs[sessionId]?.readingMinutes ??
                                progress?.reading_minutes ??
                                0
                              }
                              onChange={(e) =>
                                handleSessionInputChange(
                                  sessionId,
                                  "readingMinutes",
                                  e.target.value
                                )
                              }
                              className="h-7 text-sm"
                              min={0}
                              placeholder="0"
                              disabled={savingSessions[sessionId]}
                            />
                            <p className="text-[9px] text-muted-foreground">
                              Target: {session.readingMinutes || 0}min
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2 space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Listening (min)
                            </Label>
                            <Input
                              type="number"
                              value={
                                sessionInputs[sessionId]?.listeningMinutes ??
                                progress?.listening_minutes ??
                                0
                              }
                              onChange={(e) =>
                                handleSessionInputChange(
                                  sessionId,
                                  "listeningMinutes",
                                  e.target.value
                                )
                              }
                              className="h-7 text-sm"
                              min={0}
                              placeholder="0"
                              disabled={savingSessions[sessionId]}
                            />
                            <p className="text-[9px] text-muted-foreground">
                              Target: {session.listeningMinutes || 0}min
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-3 w-full gap-2"
                        onClick={() => handleSaveSession(sessionId)}
                        disabled={savingSessions[sessionId]}
                      >
                        {savingSessions[sessionId] ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon
                              icon={SaveIcon}
                              strokeWidth={2}
                              className="h-4 w-4"
                            />
                            Save Progress
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {isLocked && (
                    <div className="border-t border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                      <p className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <HugeiconsIcon
                          icon={Alert01Icon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                        {isOverdue ? (
                          <>
                            ⚠️ This session is overdue. Progress submission is
                            disabled.
                          </>
                        ) : (
                          <>
                            📅 This session is not yet available. Please
                            complete the previous session first.
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {!isJLPT && session.link && (
                    <div className="mt-auto bg-muted/5 p-3">
                      <div className="flex items-center gap-2 text-[11px]">
                        <HugeiconsIcon
                          icon={Megaphone02Icon}
                          strokeWidth={1.5}
                          className="h-4 w-4 text-muted-foreground"
                        />
                        <a
                          href={session.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-[150px] truncate font-medium text-primary hover:underline"
                        >
                          Resources Link: {session.link}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Enrolled Employees */}
        {/* {filteredEmployees.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-lg font-semibold">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      strokeWidth={1.5}
                      className="h-5 w-5"
                    />
                    Enrolled Employees ({filteredEmployees.length})
                  </h4>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {
                        filteredEmployees.filter(
                          (e) => e.enrollmentStatus === "APPROVED"
                        ).length
                      }{" "}
                      Approved
                    </Badge>
                    {isApprover && profile?.team && (
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-[10px] text-blue-600"
                      >
                        Team: {profile.team}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={resolveUploadUrl(employee.profilePhotoPath)} />
                        <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                          {getInitials(employee.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium"
                          title={employee.employeeName}
                        >
                          {employee.employeeName}
                        </p>
                        <p
                          className="truncate text-xs text-muted-foreground"
                          title={`${employee.departmentName} • ${employee.teamName}`}
                        >
                          {truncateText(employee.departmentName, 25)}
                          {employee.teamName &&
                            ` • ${truncateText(employee.teamName, 20)}`}
                        </p>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {employee.enrollmentStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )} */}
      </div>
    </TabsContent>
  )
}
