"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Field, FieldLabel } from "@/components/ui/field"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlusSignIcon,
  Delete02Icon,
  Link02Icon,
} from "@hugeicons/core-free-icons"
import { format, addDays } from "date-fns"
import { CourseSession } from "@/types/course"
import { isJLPTType } from "@/types/course"

// Helper to format self-study sessions for API
export const formatSelfStudySessionsForAPI = (sessions: CourseSession[], isJLPT: boolean) => {
  return sessions.map(session => ({
    session_date: session.date?.toISOString().split('T')[0],
    link: isJLPT ? null : (session.link || null),
    kanji_count: isJLPT ? (session.kanjiCount || 0) : 0,
    vocabulary_count: isJLPT ? (session.vocabularyCount || 0) : 0,
    grammar_count: isJLPT ? (session.grammarCount || 0) : 0,
    reading_minutes: isJLPT ? (session.readingMinutes || 0) : 0,
    listening_minutes: isJLPT ? (session.listeningMinutes || 0) : 0,
  }))
}

interface LearnerSectionProps {
  sessions: CourseSession[]
  selfStudyType: string
  daysPerSession?: number
  totalKanji: number
  totalVocabulary: number
  totalGrammar: number
  totalReadingMinutes: number
  totalListeningMinutes: number
  onUpdateSessions: (sessions: CourseSession[]) => void
  onUpdateSelfStudyType: (type: string) => void
  onUpdateDaysPerSession: (days: number | undefined) => void
  onUpdateTotals: (totals: {
    totalKanji: number
    totalVocabulary: number
    totalGrammar: number
    totalReadingMinutes: number
    totalListeningMinutes: number
  }) => void
  sessionPage: number
  onSetSessionPage: (page: number) => void
  itemsPerPage: number
  onSetItemsPerPage: (items: number) => void
  selfStudyBaseDate: Date | null
  onSetSelfStudyBaseDate: (date: Date | null) => void
}

export const Self_Study_Section: React.FC<LearnerSectionProps> = ({
  sessions,
  selfStudyType,
  daysPerSession,
  totalKanji,
  totalVocabulary,
  totalGrammar,
  totalReadingMinutes,
  totalListeningMinutes,
  onUpdateSessions,
  onUpdateSelfStudyType,
  onUpdateDaysPerSession,
  onUpdateTotals,
  sessionPage,
  onSetSessionPage,
  itemsPerPage,
  onSetItemsPerPage,
  selfStudyBaseDate,
  onSetSelfStudyBaseDate,
}) => {
  const isJLPT = isJLPTType(selfStudyType)

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    onSetItemsPerPage(newItemsPerPage)
    onSetSessionPage(1)
  }
  

  const addSelfStudySession = () => {
    const baseDate = selfStudyBaseDate || sessions[0]?.date || new Date()
    const newIndex = sessions.length
    const daysPerSessionValue = daysPerSession || 1 // Fallback to 1 day if not specified

    const newSession: CourseSession = {
      id: `s${Date.now()}`,
      date: addDays(baseDate, newIndex * daysPerSessionValue),
      kanjiCount: isJLPT ? 0 : undefined,
      vocabularyCount: isJLPT ? 0 : undefined,
      grammarCount: isJLPT ? 0 : undefined,
      readingMinutes: isJLPT ? 0 : undefined,
      listeningMinutes: isJLPT ? 0 : undefined,
      link: !isJLPT ? "" : undefined,
    }
    
    // Disable the auto-calculation useEffect for this specific manual add
    // by ensuring the signature will definitely change
    lastUpdateRef.current = ""
    
    onUpdateSessions([...sessions, newSession])
    const totalPages = Math.ceil((sessions.length + 1) / itemsPerPage)
    onSetSessionPage(totalPages)
  }

  const removeSelfStudySession = (sessionId: string) => {
    onUpdateSessions(sessions.filter((s) => s.id !== sessionId))
  }

  const updateSelfStudySession = (
    sessionId: string,
    field: string,
    value: any
  ) => {
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId)

    if (field === "date" && sessionIndex === 0) {
      onSetSelfStudyBaseDate(value)
    }

    onUpdateSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, [field]: value } : s
      )
    )
  }

  // Ref to track last update to avoid infinite loops
  const lastUpdateRef = React.useRef<string>("")

  // Auto-calculate self-study session values from totals
  useEffect(() => {
    if (sessions.length > 0 && isJLPT) {
      const sessionCount = sessions.length
      const daysPerSessionValue = daysPerSession

      if (!daysPerSessionValue) return

      const avgKanji = Math.floor((totalKanji || 0) / sessionCount)
      const avgVocab = Math.floor((totalVocabulary || 0) / sessionCount)
      const avgGrammar = Math.floor((totalGrammar || 0) / sessionCount)
      const avgReading = Math.floor((totalReadingMinutes || 0) / sessionCount)
      const avgListening = Math.floor((totalListeningMinutes || 0) / sessionCount)

      const extraKanji = (totalKanji || 0) % sessionCount
      const extraVocab = (totalVocabulary || 0) % sessionCount
      const extraGrammar = (totalGrammar || 0) % sessionCount
      const extraReading = (totalReadingMinutes || 0) % sessionCount
      const extraListening = (totalListeningMinutes || 0) % sessionCount

      const baseDate = selfStudyBaseDate || sessions[0]?.date || new Date()

      const updatedSessions = sessions.map((session, index) => ({
        ...session,
        date: addDays(baseDate, index * daysPerSessionValue),
        kanjiCount: avgKanji + (index < extraKanji ? 1 : 0),
        vocabularyCount: avgVocab + (index < extraVocab ? 1 : 0),
        grammarCount: avgGrammar + (index < extraGrammar ? 1 : 0),
        readingMinutes: avgReading + (index < extraReading ? 1 : 0),
        listeningMinutes: avgListening + (index < extraListening ? 1 : 0),
      }))

      // Create a signature of the change to avoid unnecessary updates
      const updateSignature = JSON.stringify({
        totalKanji, totalVocabulary, totalGrammar,
        totalReadingMinutes, totalListeningMinutes,
        sessionsLength: sessions.length,
        isJLPT,
        daysPerSession,
        baseDate: baseDate.getTime()
      })

      if (lastUpdateRef.current !== updateSignature) {
        lastUpdateRef.current = updateSignature
        onUpdateSessions(updatedSessions)
      }
    }
  }, [totalKanji, totalVocabulary, totalGrammar, totalReadingMinutes, totalListeningMinutes, sessions.length, isJLPT, daysPerSession, sessions, selfStudyBaseDate, onUpdateSessions])

  // Update dates for non-JLPT self-study when daysPerSession changes
  useEffect(() => {
    if (sessions.length > 0 && !isJLPT) {
      const daysPerSessionValue = daysPerSession

      if (!daysPerSessionValue) return

      const baseDate = selfStudyBaseDate || sessions[0]?.date || new Date()

      const updatedSessions = sessions.map((session, index) => ({
        ...session,
        date: addDays(baseDate, index * daysPerSessionValue),
      }))

      // Create a signature of the change to avoid unnecessary updates
      const updateSignature = JSON.stringify({
        sessionsLength: sessions.length,
        isJLPT,
        daysPerSession,
        baseDate: baseDate.getTime(),
        type: 'non-jlpt-dates'
      })

      if (lastUpdateRef.current !== updateSignature) {
        lastUpdateRef.current = updateSignature
        onUpdateSessions(updatedSessions)
      }
    }
  }, [daysPerSession, sessions.length, selfStudyBaseDate, isJLPT, onUpdateSessions, sessions])

  const totalSessionPages = Math.ceil(sessions.length / itemsPerPage)
  const paginatedSessions = sessions.slice(
    (sessionPage - 1) * itemsPerPage,
    sessionPage * itemsPerPage
  )

  const goToSessionPage = (page: number) => {
    if (page >= 1 && page <= totalSessionPages) {
      onSetSessionPage(page)
    }
  }

  return (
    <>
      {/* JLPT fields - show when selfStudyType is "jlpt" */}
      {isJLPT && (
        <>
          {/* Total Kanji, Vocabulary, Grammar */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Total Kanji</Label>
              <Input
                type="number"
                value={totalKanji ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji: parseInt(e.target.value) || 0,
                      totalVocabulary,
                      totalGrammar,
                      totalReadingMinutes,
                      totalListeningMinutes,
                    },
                  })
                }
                placeholder="Total kanji"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Vocabulary</Label>
              <Input
                type="number"
                value={totalVocabulary ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji,
                      totalVocabulary: parseInt(e.target.value) || 0,
                      totalGrammar,
                      totalReadingMinutes,
                      totalListeningMinutes,
                    },
                  })
                }
                placeholder="Total vocabulary"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Grammar</Label>
              <Input
                type="number"
                value={totalGrammar ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji,
                      totalVocabulary,
                      totalGrammar: parseInt(e.target.value) || 0,
                      totalReadingMinutes,
                      totalListeningMinutes,
                    },
                  })
                }
                placeholder="Total grammar"
                min={0}
              />
            </div>
          </div>

          {/* Total Reading & Listening */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Total Reading (minutes)</Label>
              <Input
                type="number"
                value={totalReadingMinutes ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji,
                      totalVocabulary,
                      totalGrammar,
                      totalReadingMinutes: parseInt(e.target.value) || 0,
                      totalListeningMinutes,
                    },
                  })
                }
                placeholder="Total reading minutes"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Listening (minutes)</Label>
              <Input
                type="number"
                value={totalListeningMinutes ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji,
                      totalVocabulary,
                      totalGrammar,
                      totalReadingMinutes,
                      totalListeningMinutes: parseInt(e.target.value) || 0,
                    },
                  })
                }
                placeholder="Total listening minutes"
                min={0}
              />
            </div>
          </div>
        </>
      )}

      {/* Total Sessions & Days Per Session */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Total Sessions <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={sessions.length || ""}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0
              const baseDate = selfStudyBaseDate || sessions[0]?.date || new Date()
              const daysPerSessionValue = daysPerSession || 1

              const newSessions: CourseSession[] = Array.from(
                { length: value },
                (_, i) => ({
                  id: `s${Date.now()}-${i}`,
                  date: addDays(baseDate, i * daysPerSessionValue),
                  kanjiCount: isJLPT ? 0 : undefined,
                  vocabularyCount: isJLPT ? 0 : undefined,
                  grammarCount: isJLPT ? 0 : undefined,
                  readingMinutes: isJLPT ? 0 : undefined,
                  listeningMinutes: isJLPT ? 0 : undefined,
                  link: !isJLPT ? "" : undefined,
                  status: 'PLANNED'
                })
              )
              
              lastUpdateRef.current = ""
              onUpdateSessions(newSessions)
              onSetSessionPage(1)
            }}
            placeholder="Enter total sessions"
            min={1}
            required
          />
          {sessions.length > 0 && (
            <p className="text-xs text-green-600">
              ✓ {sessions.length} sessions configured
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>
            Days Per Session <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={daysPerSession ?? ""}
            onChange={(e) => {
              const value = parseInt(e.target.value)
              onUpdateDaysPerSession(isNaN(value) ? undefined : value)
            }}
            placeholder="Enter days between sessions"
            min={1}
            required
          />
          <p className="text-xs text-muted-foreground">
            Number of days between each session (e.g., 7 for weekly)
          </p>
        </div>
      </div>

      {/* Self-Study Sessions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Sessions</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addSelfStudySession}
            className="gap-1"
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="h-4 w-4"
            />
            Add Session
          </Button>
        </div>
        {sessions.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-4 text-center text-sm text-muted-foreground">
            No sessions added yet. Enter "Total Sessions" above or click
            "Add Session" to create one.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedSessions.map((session, idx) => {
                const globalIndex = (sessionPage - 1) * itemsPerPage + idx
                return (
                  <div
                    key={session.id}
                    className="space-y-1 rounded-lg border bg-muted/5 p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        Session #{globalIndex + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeSelfStudySession(session.id)}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          strokeWidth={2}
                          className="h-3 w-3"
                        />
                      </Button>
                    </div>

                    {/* Show date as display only (no picker) */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Date:
                      </span>
                      <span className="text-xs font-medium">
                        {session.date
                          ? format(session.date, "MMM d, yyyy (EEE)")
                          : "Not set"}
                      </span>
                    </div>

                    {/* JLPT Self-Study - Show metrics fields */}
                    {isJLPT ? (
                      <div className="grid grid-cols-5 gap-1">
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Kanji
                          </Label>
                          <Input
                            type="number"
                            value={session.kanjiCount ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "kanjiCount",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Vocab
                          </Label>
                          <Input
                            type="number"
                            value={session.vocabularyCount ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "vocabularyCount",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Grammar
                          </Label>
                          <Input
                            type="number"
                            value={session.grammarCount ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "grammarCount",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Reading
                          </Label>
                          <Input
                            type="number"
                            value={session.readingMinutes ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "readingMinutes",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Listening
                          </Label>
                          <Input
                            type="number"
                            value={session.listeningMinutes ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "listeningMinutes",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Non-JLPT Self-Study - Show link field */
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">
                          Link
                        </Label>
                        <div className="relative">
                          <HugeiconsIcon
                            icon={Link02Icon}
                            strokeWidth={1.5}
                            className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
                          />
                          <Input
                            type="url"
                            value={session.link ?? ""}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "link",
                                e.target.value
                              )
                            }
                            className="h-7 pl-6 text-xs"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {totalSessionPages > 1 && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <Field orientation="horizontal" className="w-fit">
                  <FieldLabel
                    htmlFor="select-rows-per-page"
                    className="text-sm whitespace-nowrap text-foreground"
                  >
                    Rows per page
                  </FieldLabel>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger
                      className="w-15"
                      id="select-rows-per-page"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (sessionPage > 1)
                            goToSessionPage(sessionPage - 1)
                        }}
                        className={
                          sessionPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: totalSessionPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            goToSessionPage(page)
                          }}
                          isActive={sessionPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (sessionPage < totalSessionPages) {
                            goToSessionPage(sessionPage + 1)
                          }
                        }}
                        className={
                          sessionPage === totalSessionPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}