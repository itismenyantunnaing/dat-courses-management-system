// components/course/tabs/InformationTab.tsx
"use client"

import React from "react"
import { TabsContent } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TeacherFreeIcons,
  Calendar03Icon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  Calendar05Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { Course } from "@/types/course"
import { format } from "date-fns"

interface InformationTabProps {
  course: Course
}

export function InformationTab({ course }: InformationTabProps) {
  const getTotalSessions = () => {
    if (course.courseType === "trainer") {
      return (
        course.groups?.reduce(
          (total, group) => total + group.sessions.length,
          0
        ) || 0
      )
    }
    return course.self_study_sessions?.length || course.sessions?.length || 0
  }

  const getTotalCapacity = () => {
    if (course.courseType === "trainer") {
      const capacities = course.groups?.map((g) => g.capacity) || []
      const hasUnlimited = capacities.some((c) => c === undefined)
      if (hasUnlimited) return undefined
      const total = capacities.reduce(
        (sum, c) => sum + (typeof c === "number" ? c : 0),
        0
      )
      return total.toString()
    }
    return "N/A"
  }

  const getGroupCount = () => {
    if (course.courseType === "trainer") {
      return course.groups?.length || 0
    }
    return 0
  }

  const getStartDate = () => {
    if (course.courseType === "trainer" && course.groups?.length > 0) {
      const dates = course.groups.map((g) => g.startDate).filter((d) => d)
      if (dates.length === 0) return null
      return new Date(Math.min(...dates.map((d) => d.getTime())))
    }
    return null
  }

  const getEndDate = () => {
    if (course.courseType === "trainer" && course.groups?.length > 0) {
      const dates = course.groups.map((g) => g.endDate).filter((d) => d)
      if (dates.length === 0) return null
      return new Date(Math.max(...dates.map((d) => d.getTime())))
    }
    return null
  }

  const totalSessions = getTotalSessions()
  const totalCapacity = getTotalCapacity()
  const groupCount = getGroupCount()
  const startDate = getStartDate()
  const endDate = getEndDate()

  return (
    <TabsContent value="information" className="pt-4">
      <div className="grid gap-6">
        {/* Course Description */}
        {course.description && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Description
            </h4>
            <p className="text-sm">{course.description}</p>
          </div>
        )}

        {/* Course Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-3">
            {course.courseType === "trainer" && (
              <div className="flex items-center gap-3 text-sm">
                <HugeiconsIcon
                  icon={TeacherFreeIcons}
                  strokeWidth={1.5}
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                />
                <div>
                  <p className="font-medium">Trainer Name</p>
                  <p className="text-muted-foreground">
                    {course.trainerName || "TBD"}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={1.5}
                className="h-5 w-5 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-muted-foreground">
                  {startDate
                    ? format(startDate, "MMM d, yyyy")
                    : course.courseType === "self-study"
                      ? "Dynamic Schedule"
                      : "TBD"}
                  {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <HugeiconsIcon
                icon={BookOpenIcon}
                strokeWidth={1.5}
                className="h-5 w-5 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="font-medium">Category</p>
                <p className="text-muted-foreground capitalize">
                  {course.category}
                </p>
              </div>
            </div>

            {course.registrationDeadline && (
              <div className="flex items-center gap-3 text-sm">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={1.5}
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                />
                <div>
                  <p className="font-medium">Registration Deadline</p>
                  <p className="text-muted-foreground">
                    {format(course.registrationDeadline, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {course.courseType === "trainer" && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="font-medium">Total Capacity</p>
                    <p className="text-muted-foreground">
                      {totalCapacity || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon
                    icon={Calendar05Icon}
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="font-medium">Total Sessions</p>
                    <p className="text-muted-foreground">{totalSessions}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon
                    icon={UserIcon}
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="font-medium">Number of Groups</p>
                    <p className="text-muted-foreground">{groupCount}</p>
                  </div>
                </div>
              </>
            )}

            {course.courseType === "self-study" && (
              <>
                {course.selfStudyType && (
                  <div className="flex items-center gap-3 text-sm">
                    <HugeiconsIcon
                      icon={BookOpenIcon}
                      strokeWidth={1.5}
                      className="h-5 w-5 shrink-0 text-muted-foreground"
                    />
                    <div>
                      <p className="font-medium">Study Type</p>
                      <p className="text-muted-foreground capitalize">
                        {course.selfStudyType}
                      </p>
                    </div>
                  </div>
                )}
                {course.selfStudyType?.toLowerCase().trim() !== "other" && (
                  <>
                    {course.totalKanji && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Kanji</p>
                          <p className="text-muted-foreground">
                            {course.totalKanji}
                          </p>
                        </div>
                      </div>
                    )}

                    {course.totalVocabulary && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Vocabulary</p>
                          <p className="text-muted-foreground">
                            {course.totalVocabulary}
                          </p>
                        </div>
                      </div>
                    )}

                    {course.totalGrammar && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Grammar</p>
                          <p className="text-muted-foreground">
                            {course.totalGrammar}
                          </p>
                        </div>
                      </div>
                    )}

                    {course.totalReadingMinutes && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Reading Minutes</p>
                          <p className="text-muted-foreground">
                            {course.totalReadingMinutes}
                          </p>
                        </div>
                      </div>
                    )}

                    {course.totalListeningMinutes && (
                      <div className="flex items-center gap-3 text-sm">
                        <HugeiconsIcon
                          icon={ClockIcon}
                          strokeWidth={1.5}
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <div>
                          <p className="font-medium">Total Listening Minutes</p>
                          <p className="text-muted-foreground">
                            {course.totalListeningMinutes}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
