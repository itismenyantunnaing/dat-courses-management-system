"use client"

import React, { useState, useRef, useEffect, forwardRef, useMemo, useCallback } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  ArrowRight01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CourseGroup,
  CourseSession,
  CourseFormData,
  CourseFormProps,
  COURSE_TYPE_LABELS,
  CourseCategory,
  isJLPTType,
  MentionedLearner,
  CategoryItem,
} from "@/types/course"
import { cn } from "@/lib/utils"
import { CategoryDrawer } from "../category-drawer"
import { mainStore } from "@/store/mainStore"
import { ImageUploadArea } from "../image-upload"
import { TrainerSection } from "./trainer-management-section"
import { Self_Study_Section } from "./self-study-management-section"
import { formatGroupsForAPI } from "./trainer-management-section"
import { formatSelfStudySessionsForAPI } from "./self-study-management-section"
import { EnrollEmployeesSection } from "./EnrollEmployeesSection"
import { compressFile } from "@/lib/compressImage"

// Add this helper function near the top of the file, after the imports
const safelyCompareDates = (date1: Date | string | undefined, date2: Date | string | undefined): boolean => {
  // If both are null/undefined, they're equal
  if (!date1 && !date2) return true;
  // If one is null/undefined and the other isn't, they're different
  if (!date1 || !date2) return false;
  
  // Convert strings to Date objects if needed
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  // Check if both are valid dates
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  
  return d1.getTime() === d2.getTime();
};

// Default session days constant
const DEFAULT_SESSION_DAYS = [4, 5] // Thursday, Friday

// ========== DATE HELPER FUNCTIONS ==========
// Create a date that preserves the local date without timezone offset
const createLocalDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Get today's date as local date
const getTodayLocal = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Format a date for display using date-fns
const formatLocalDateDisplay = (date: Date): string => {
  if (!date) return '';
  return format(date, 'PPP');
};

//Helper for imageUrl
const getImageUrl = (url?: string | null) => {
  if (!url) return null

  return url.startsWith("http")
      ? url
      : `${process.env.NEXT_PUBLIC_API_URL}${url}`
}

// Helper function to convert Employee to MentionedLearner
const convertEmployeeToMentionedLearner = (employee: any): MentionedLearner => ({
  id: employee.id,
  name: employee.name || employee.full_name || '',
  email: employee.email || '',
  avatar: employee.profile_photo_path || employee.avatar || '',
  department: employee.dept_dat || employee.department || '',
  team: employee.team || '',
  status: (employee.status || employee.emp_status || 'active') as 'active' | 'pending' | 'completed' | 'inactive',
  addedAt: new Date(),
})

export const Trainer_CourseForm = forwardRef<HTMLFormElement, CourseFormProps>(
  (
    {
      initialData,
      initialImage,
      mode,
      onSubmit,
      onCancel,
      onDelete,
      isSubmitting = false,
      onChanges,
       disableSubmit = false, 
    },
    ref
  ) => {
    // Get employee data and course categories from store
    const {
      employee_data,
      fetch_EmployeeData,
      courseCategory_data,
      fetch_courseCategories,
      fetch_courseEnrollments,
      getCategoryByValue,
      getAllCategories,
      isLoading: categoriesLoading,
      // Add these from the store
      adminChangeGroup,
      isAdminChangingGroup,
      groupChangeError,
      groupChangeSuccess,
      clearGroupChangeState,
      fetch_HolidayData,
      holiday_data
    } = mainStore()

    // Fetch employees on mount if not already loaded
    useEffect(() => {
      if (employee_data.length === 0) {
        fetch_EmployeeData()
      }
      if (holiday_data.length === 0) {
        fetch_HolidayData()
      }
    }, [employee_data.length, fetch_EmployeeData])

    // Fetch categories on mount if not already loaded
    useEffect(() => {
      if (courseCategory_data.trainer.length === 0 &&
        courseCategory_data.selfStudy.length === 0) {
        fetch_courseCategories()
      }
    }, [courseCategory_data.trainer.length, courseCategory_data.selfStudy.length, fetch_courseCategories])

    // Clean up group change state when component unmounts
    useEffect(() => {
      return () => {
        clearGroupChangeState?.()
      }
    }, [clearGroupChangeState])



    const defaultGroup = useMemo(
      () => ({
        id: `g${Date.now()}`,
        name: "Group 1",
        capacity: undefined,
        startDate: getTodayLocal(), // Use local date
        sessionsPerWeek: DEFAULT_SESSION_DAYS,
        startTime: "09:00",
        endTime: "10:00",
        sessions: [] as CourseSession[],
        registeredCount: 0,
      }),
      []
    )

    const [formData, setFormData] = useState<CourseFormData>({
      title: initialData?.title || "",
      trainerName: initialData?.trainerName || "",
      imageUrl: initialData?.imageUrl || undefined,
      courseType: initialData?.courseType || "",
      category: initialData?.category || "",
      categoryId: initialData?.categoryId || undefined,
      registrationDeadline: initialData?.registrationDeadline || undefined,
      groups: initialData?.groups?.length ? initialData.groups : [defaultGroup],
      sessions: initialData?.sessions?.length ? initialData.sessions : (initialData?.self_study_sessions || []),
      selfStudyType: initialData?.selfStudyType || "other",
      daysPerSession: initialData?.daysPerSession,
      mentionedLearners: initialData?.mentionedLearners || [],
      totalKanji: initialData?.totalKanji || 0,
      totalVocabulary: initialData?.totalVocabulary || 0,
      totalGrammar: initialData?.totalGrammar || 0,
      totalReadingMinutes: initialData?.totalReadingMinutes || 0,
      totalListeningMinutes: initialData?.totalListeningMinutes || 0,
      status: initialData?.status || "draft",
    })

    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(
        getImageUrl(initialImage)
    )
    const [isDragging, setIsDragging] = useState(false)
    const [activeGroupTab, setActiveGroupTab] = useState<string>(
      initialData?.groups?.[0]?.id || `g${Date.now()}`
    )
    const [sessionPage, setSessionPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(6)
    const [trainerSessionPage, setTrainerSessionPage] = useState(1)
    const [trainerItemsPerPage, setTrainerItemsPerPage] = useState(8)
    const [learnersPage, setLearnersPage] = useState(1)
    const [learnersItemsPerPage, setLearnersItemsPerPage] = useState(6)
    const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [learnersCommandOpen, setLearnersCommandOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const initialFormDataRef = useRef<CourseFormData | null>(null)
    const [groupErrors, setGroupErrors] = useState<{ [key: string]: string }>(
      {}
    )
    // Store the base date for self-study sessions
    const [selfStudyBaseDate, setSelfStudyBaseDate] = useState<Date | null>(
      null
    )
    const [submitted, setSubmitted] = useState(false)
    const [mainDurationPerSession, setMainDurationPerSession] = useState<number>(
      initialData?.mainDurationPerSession ||
      initialData?.sessions?.[0]?.durationPerSession ||
      7
    )


    // Check if self-study type is JLPT
    const isJLPT = useMemo(() => {
      return isJLPTType(formData.selfStudyType)
    }, [formData.selfStudyType])

    // Convert employees from store to MentionedLearners
    const employeeLearners = useMemo(() => {
      return employee_data.map(convertEmployeeToMentionedLearner)
    }, [employee_data])

    const availableLearners = useMemo(() => {
      const mentionedIds = new Set(
        (formData.mentionedLearners || []).map((l) => l.id)
      )
      return employeeLearners.filter((learner) => !mentionedIds.has(learner.id))
    }, [employeeLearners, formData.mentionedLearners])

    const isTrainer = formData.courseType === "trainer"

    // Sync main duration when sessions change
    useEffect(() => {
      if (formData.sessions.length > 0) {
        const firstDuration = formData.sessions[0]?.durationPerSession
        const allSame = formData.sessions.every(
          s => s.durationPerSession === firstDuration
        )
        if (allSame && firstDuration !== undefined && firstDuration > 0) {
          setMainDurationPerSession(firstDuration)
        }
      }
    }, [formData.sessions])

    // Update formData when initialData changes (for edit mode)
    useEffect(() => {
      if (mode === "edit" && initialData) {
        const category = getCategoryByValue(initialData.category)

        // Build ONE normalized snapshot and reuse it for both formData and
        // the change-detection ref, so the two are guaranteed to start
        // identical (previously they used slightly different fallback
        // logic, which made the form look "dirty" immediately on load).
        const normalized: CourseFormData = {
          title: initialData.title || "",
          trainerName: initialData.trainerName || "",
          imageUrl: initialData.imageUrl || undefined,
          courseType: initialData.courseType || "",
          category: initialData.category || "",
          categoryId: category?.id || undefined,
          registrationDeadline: initialData.registrationDeadline || undefined,
          groups: initialData.groups?.length ? initialData.groups : [defaultGroup],
          sessions: initialData.sessions?.length ? initialData.sessions : (initialData.self_study_sessions || []),
          selfStudyType: initialData.selfStudyType || "other",
          daysPerSession: initialData.daysPerSession,
          mentionedLearners: initialData.mentionedLearners || [],
          totalKanji: initialData.totalKanji || 0,
          totalVocabulary: initialData.totalVocabulary || 0,
          totalGrammar: initialData.totalGrammar || 0,
          totalReadingMinutes: initialData.totalReadingMinutes || 0,
          totalListeningMinutes: initialData.totalListeningMinutes || 0,
          status: initialData.status || "draft",
        }

        setFormData(normalized)

        if (initialData.groups?.length > 0) {
          setActiveGroupTab(initialData.groups[0].id)
        }

        // Snapshot the SAME normalized values (deep-cloned) that were just
        // put into formData — not the raw initialData — so the very first
        // comparison in the "has changes" effect below evaluates to false.
        initialFormDataRef.current = JSON.parse(JSON.stringify({
          title: normalized.title,
          imageUrl: normalized.imageUrl,
          courseType: normalized.courseType,
          category: normalized.category,
          categoryId: normalized.categoryId,
          registrationDeadline: normalized.registrationDeadline,
          groups: normalized.groups,
          sessions: normalized.sessions,
          selfStudyType: normalized.selfStudyType,
          daysPerSession: normalized.daysPerSession,
          mentionedLearners: normalized.mentionedLearners,
          totalKanji: normalized.totalKanji,
          totalVocabulary: normalized.totalVocabulary,
          totalGrammar: normalized.totalGrammar,
          totalReadingMinutes: normalized.totalReadingMinutes,
          totalListeningMinutes: normalized.totalListeningMinutes,
          status: normalized.status,
        }))
      }
    }, [initialData, mode, defaultGroup, getCategoryByValue])

  // Check for changes in edit mode
useEffect(() => {
  if (
    mode === "edit" &&
    initialData &&
    onChanges &&
    initialFormDataRef.current
  ) {
    const hasFormChanges =
      formData.title !== initialFormDataRef.current.title ||
      formData.courseType !== initialFormDataRef.current.courseType ||
      formData.category !== initialFormDataRef.current.category ||
      formData.categoryId !== initialFormDataRef.current.categoryId ||
      // ✅ FIX: Use safe date comparison instead of direct .getTime()
      !safelyCompareDates(
        formData.registrationDeadline,
        initialFormDataRef.current.registrationDeadline
      ) ||
      formData.selfStudyType !== initialFormDataRef.current.selfStudyType ||
      formData.daysPerSession !==
      initialFormDataRef.current.daysPerSession ||
      JSON.stringify(formData.groups) !==
      JSON.stringify(initialFormDataRef.current.groups) ||
      JSON.stringify(formData.sessions) !==
      JSON.stringify(initialFormDataRef.current.sessions) ||
      JSON.stringify(formData.mentionedLearners) !==
      JSON.stringify(initialFormDataRef.current.mentionedLearners) ||
      formData.totalKanji !== initialFormDataRef.current.totalKanji ||
      formData.totalVocabulary !==
      initialFormDataRef.current.totalVocabulary ||
      formData.totalGrammar !== initialFormDataRef.current.totalGrammar ||
      formData.totalReadingMinutes !==
      initialFormDataRef.current.totalReadingMinutes ||
      formData.totalListeningMinutes !==
      initialFormDataRef.current.totalListeningMinutes ||
      formData.status !== initialFormDataRef.current.status

    const hasImageChanges = selectedImage !== null

    const changed = hasFormChanges || hasImageChanges
    onChanges(changed)
  }
}, [formData, selectedImage, initialData, mode, onChanges])

    // Handle delete
    const handleDelete = () => {
      setIsDeleting(true)
      try {
        onDelete?.()
        onCancel()
      } catch (error) {
        console.error("Failed to delete course:", error)
      } finally {
        setIsDeleting(false)
        setDeleteDialogOpen(false)
      }
    }

    // Image upload handlers with compression
    const handleImageChange = async (file: File | null) => {
      if (file) {
        try {
          const compressedFile = await compressFile(file)
          setSelectedImage(compressedFile)

          // Create preview from compressed file
          const reader = new FileReader()
          reader.onloadend = () => {
            setImagePreview(reader.result as string)
          }
          reader.readAsDataURL(compressedFile)
        } catch (error) {
          console.error("❌ Failed to compress image:", error)
          // Fallback: use original file if compression fails
          setSelectedImage(file)
          const reader = new FileReader()
          reader.onloadend = () => {
            setImagePreview(reader.result as string)
          }
          reader.readAsDataURL(file)
        }
      } else {
        setSelectedImage(null)
        setImagePreview(initialImage || null)
      }
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageChange(e.dataTransfer.files[0])
      }
    }

    const isFormValid = () => {
      if (!formData.title || !formData.courseType || !formData.category)
        return false

      if (formData.courseType === "trainer") {
        if (formData.groups.length === 0) return false
        const groupValid = formData.groups.every((group) => {
          const hasSessions = group.sessions.length > 0
          const hasValidTimes =
            !group.startTime || !group.endTime || group.startTime < group.endTime

          const hasValidDates =
            !group.endDate ||
            (group.startDate && group.endDate >= group.startDate)

          const sessionsValid = group.sessions.every(
            (session) => {
              if (!session.date) return false;
              return true;
            }
          )

          return (
            hasSessions &&
            hasValidTimes &&
            hasValidDates &&
            sessionsValid
          )
        })
        return groupValid
      }

      return formData.sessions.length > 0
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitted(true)

      if (isTrainer && !formData.registrationDeadline) {
        return
      }

      if (!formData.category) return
      if (formData.courseType === "trainer" && formData.groups.length === 0) return

      let hasError = false
      const errors: { [key: string]: string } = {}

      if (formData.courseType === "trainer") {
        // Check for empty group names
        const groupsWithEmptyNames = formData.groups.filter(
          group => !group.name || group.name.trim() === ''
        )

        if (groupsWithEmptyNames.length > 0) {
          groupsWithEmptyNames.forEach(group => {
            errors[group.id] = "Group name is required"
          })
          hasError = true
        }

        // ADD CAPACITY VALIDATION FOR MULTIPLE GROUPS
        if (formData.groups.length > 1) {
          const groupsWithoutCapacity = formData.groups.filter(
            group => group.capacity === undefined || group.capacity === null
          )
          if (groupsWithoutCapacity.length > 0) {
            groupsWithoutCapacity.forEach(group => {
              errors[group.id] = "Capacity is required when multiple groups exist"
            })
            hasError = true
          }
        }

        // Check for sessions and other validations
        formData.groups.forEach((group) => {
          if (group.sessions.length === 0) {
            errors[group.id] = "At least one session is required"
            hasError = true
          }
          if (
            group.startTime &&
            group.endTime &&
            group.startTime >= group.endTime
          ) {
            errors[group.id] = "Start time must be before end time"
            hasError = true
          }
          if (
            group.endDate &&
            group.startDate &&
            group.endDate < group.startDate
          ) {
            errors[group.id] = "End date must be after start date"
            hasError = true
          }
          group.sessions.forEach((session) => {
            if (group.endDate && session.date > group.endDate) {
              errors[group.id] =
                "All sessions must be on or before the end date"
              hasError = true
            }
            if (session.date < group.startDate) {
              errors[group.id] =
                "All sessions must be on or after the start date"
              hasError = true
            }
          })
        })
      }

      if (hasError) {
        setGroupErrors(errors)

        // Show appropriate alert message
        const firstErrorKey = Object.keys(errors)[0]
        const firstError = errors[firstErrorKey]

        if (firstError === "Group name is required") {
          alert(`Please provide names for all ${formData.groups.length} groups before submitting.`)
        } else if (firstError === "Capacity is required when multiple groups exist") {
          alert(`Please set capacities for all  groups before submitting.`)
        } else {
          alert(firstError)
        }
        return
      }

      if (!formData.title || !formData.courseType) return

      const submitData = {
        title: formData.title,
        trainerName: formData.trainerName,
        imageUrl: imagePreview || undefined,
        courseType: formData.courseType as "trainer" | "self-study",
        category: formData.category,
        course_category_id: formData.categoryId,
        registrationDeadline: formData.courseType === "trainer" ? formData.registrationDeadline : undefined,
        groups: formData.groups,
        sessions: formData.sessions,
        selfStudyType: formData.selfStudyType,
        daysPerSession: formData.daysPerSession,
        mentionedLearners: formData.mentionedLearners || [],
        totalKanji: formData.totalKanji,
        totalVocabulary: formData.totalVocabulary,
        totalGrammar: formData.totalGrammar,
        totalReadingMinutes: formData.totalReadingMinutes,
        totalListeningMinutes: formData.totalListeningMinutes,
        status: formData.status || "draft",
        formattedGroups: formData.courseType === "trainer" ? formatGroupsForAPI(formData.groups) : undefined,
        formattedSessions: formData.courseType === "self-study" ? formatSelfStudySessionsForAPI(formData.sessions, isJLPT) : undefined,
      }

      onSubmit(submitData)
    }

    // Handler for admin group change
    const handleAdminChangeGroup = async (enrollmentId: number, newGroupId: number) => {
      if (!initialData?.id) {
        console.error('Course ID is required for group change');
        alert('Course ID is required for group change');
        return;
      }

      try {
        // Extract the course ID from initialData
        const courseId = typeof initialData.id === 'string' ? parseInt(initialData.id) : initialData.id;

        // Call the adminChangeGroup function from the store
        const result = await adminChangeGroup(enrollmentId, newGroupId);

        if (result.success) {
          // Refresh the enrollments to reflect the change
          await fetch_courseEnrollments(courseId);

          // Show success toast
          alert('Group changed successfully!');
        } else {
          alert(result.message || 'Failed to change group');
        }
      } catch (error) {
        console.error('Failed to change group:', error);
        alert(error instanceof Error ? error.message : 'Failed to change group');
      }
    };

    // Handler functions for TrainerSection
    const handleUpdateGroups = React.useCallback((groups: CourseGroup[]) => {
      setFormData((prev) => ({ ...prev, groups }))
    }, [])

    const handleUpdateMentionedLearners = React.useCallback((learners: MentionedLearner[]) => {
      setFormData((prev) => ({ ...prev, mentionedLearners: learners }))
    }, [])

    const handleAddLearner = React.useCallback((learner: MentionedLearner) => {
      setFormData((prev) => ({
        ...prev,
        mentionedLearners: [...(prev.mentionedLearners || []), learner],
      }))
    }, [])

    const handleRemoveLearner = React.useCallback((learnerId: string) => {
      setFormData((prev) => ({
        ...prev,
        mentionedLearners: (prev.mentionedLearners || []).filter(
          (l) => l.id !== learnerId
        ),
      }))
    }, [])

    // Handler functions for Self_Study_Section
    const handleUpdateSessions = React.useCallback((sessions: CourseSession[]) => {
      setFormData((prev) => ({ ...prev, sessions }))
    }, [])

    const handleUpdateSelfStudyType = React.useCallback((type: string) => {
      setFormData((prev) => ({ ...prev, selfStudyType: type }))
    }, [])

    const handleUpdateDaysPerSession = React.useCallback((days: number | undefined) => {
      setFormData((prev) => ({ ...prev, daysPerSession: days }))
    }, [])

    const handleUpdateTotals = React.useCallback((totals: {
      totalKanji: number
      totalVocabulary: number
      totalGrammar: number
      totalReadingMinutes: number
      totalListeningMinutes: number
    }) => {
      setFormData((prev) => ({ ...prev, ...totals }))
    }, [])

    // Helper function to get category by ID
    const getCategoryById = (categoryId?: number) => {
      if (!categoryId) return undefined
      const allCategories = getAllCategories()
      return allCategories.find(cat => cat.id === categoryId)
    }

    // Helper function to get category label by ID
    const getCategoryLabelById = (categoryId?: number) => {
      if (!categoryId) return ""
      const category = getCategoryById(categoryId)
      return category?.label || ""
    }

    // Helper function to check if category is trainer type by ID
    const isTrainerCategoryById = (categoryId?: number) => {
      const category = getCategoryById(categoryId)
      return category?.type === 'trainer'
    }

    // Helper function to check if category is self-study type by ID
    const isSelfStudyCategoryById = (categoryId?: number) => {
      const category = getCategoryById(categoryId)
      return category?.type === 'self-study'
    }


    const handleGroupAdded = useCallback(async (group: CourseGroup, allGroups: CourseGroup[]) => {
      // Update the form data
      setFormData((prev) => ({
        ...prev,
        groups: allGroups
      }));

      // The redistribution will be triggered by the EnrollEmployeesSection
      // when it detects the groups prop has changed
      setActiveGroupTab(group.id);
    }, [setFormData, setActiveGroupTab]);

    const handleGroupRemoved = useCallback(async (groupId: string, remainingGroups: CourseGroup[]) => {
      // Update the form data
      setFormData((prev) => ({
        ...prev,
        groups: remainingGroups
      }));

      if (remainingGroups.length > 0) {
        setActiveGroupTab(remainingGroups[0].id);
      }
    }, [setFormData, setActiveGroupTab]);



    return (
      <>
        <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
          {/* ===================== COURSE INFORMATION SECTION ===================== */}
          <div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Course Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter course title"
                  required
                />
              </div>

              {isTrainer && (
                <div className="space-y-2">
                  <Label htmlFor="trainerName">
                    Trainer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="trainerName"
                    value={formData.trainerName || ""}
                    onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
                    placeholder="Enter trainer name"
                    required={isTrainer}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Course Category <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-between"
                    onClick={() => setCategoryDrawerOpen(true)}
                    disabled={categoriesLoading || initialData}
                  >
                    {formData.categoryId ? (
                      <span>
                        {getCategoryLabelById(formData.categoryId)}
                        {formData.courseType === "self-study" && formData.selfStudyType && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({formData.selfStudyType === "jlpt" ? "JLPT" : "Other"})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {categoriesLoading ? "Loading..." : "Select a category"}
                      </span>
                    )}
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </Button>
                </div>
                {formData.categoryId && (
                  <p className="text-xs text-muted-foreground">
                    {
                      COURSE_TYPE_LABELS[
                      isTrainerCategoryById(formData.categoryId) ? "trainer" : "self-study"
                      ]
                    }
                    {formData.courseType === "self-study" && formData.selfStudyType && (
                      <span>
                        {" • "}
                        {formData.selfStudyType === "jlpt" ? "JLPT Preparation" : "Other Self-Study"}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* ===== STATUS FIELD ===== */}
              <div className="space-y-2">
                <Label>
                  Course Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status || "draft"}
                  onValueChange={(value: "active" | "upcoming" | "completed" | "draft") => {
                    setFormData({ ...formData, status: value })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      {/* <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem> */}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {/* <p className="text-xs text-muted-foreground">
                  {formData.status === "draft" && "📝 Course is being created, not visible to learners"}
                  {formData.status === "active" && "✅ Course is open for enrollment"}
                  {formData.status === "upcoming" && "📅 Course is scheduled but not yet open"}
                  {formData.status === "completed" && "🏁 Course has finished"}
                </p> */}
              </div>

              {isTrainer && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Registration Deadline
                    <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={`w-full justify-between text-left font-normal ${submitted && !formData.registrationDeadline
                          ? "border-destructive"
                          : ""
                          }`}
                      >
                        {formData.registrationDeadline ? (
                          formatLocalDateDisplay(formData.registrationDeadline)
                        ) : (
                          <span className="text-muted-foreground">Pick a date</span>
                        )}
                        <HugeiconsIcon
                          icon={Calendar03Icon}
                          strokeWidth={1.5}
                          className="h-4 w-4 opacity-50"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.registrationDeadline}
                        onSelect={(date) => {
                          if (date) {
                            // IMPORTANT: Create a local date without timezone offset
                            setFormData({
                              ...formData,
                              registrationDeadline: createLocalDate(date),
                            })
                          } else {
                            setFormData({
                              ...formData,
                              registrationDeadline: undefined,
                            })
                          }
                        }}
                        defaultMonth={formData.registrationDeadline || new Date()}
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                  {submitted && !formData.registrationDeadline && (
                    <p className="text-xs text-destructive">
                      Registration deadline is required
                    </p>
                  )}
                  {/* {formData.registrationDeadline && (
                    <p className="text-xs text-muted-foreground">
                      Registration will close on{" "}
                      {formatLocalDateDisplay(formData.registrationDeadline)}
                    </p>
                  )} */}
                </div>
              )}

              {!isTrainer && <div />}
            </div>
          </div>

          {/* ===================== TRAINER COURSE SECTION ===================== */}
          {isTrainer && (
            <TrainerSection
              groups={formData.groups}
              mentionedLearners={formData.mentionedLearners || []}
              availableLearners={availableLearners}
              allEmployees={employeeLearners}
              onUpdateGroups={handleUpdateGroups}
              onUpdateMentionedLearners={handleUpdateMentionedLearners}
              onAddLearner={handleAddLearner}
              onRemoveLearner={handleRemoveLearner}
              groupErrors={groupErrors}
              onSetGroupErrors={setGroupErrors}
              activeGroupTab={activeGroupTab}
              onSetActiveGroupTab={setActiveGroupTab}
              trainerSessionPage={trainerSessionPage}
              onSetTrainerSessionPage={setTrainerSessionPage}
              trainerItemsPerPage={trainerItemsPerPage}
              onSetTrainerItemsPerPage={setTrainerItemsPerPage}
              learnersPage={learnersPage}
              onSetLearnersPage={setLearnersPage}
              learnersItemsPerPage={learnersItemsPerPage}
              onSetLearnersItemsPerPage={setLearnersItemsPerPage}
              learnersCommandOpen={learnersCommandOpen}
              onSetLearnersCommandOpen={setLearnersCommandOpen}
              defaultGroup={defaultGroup}
              isSubmitting={isSubmitting}
              mode={mode}
              courseId={initialData?.id}
              // Pass the admin group change props
              onAdminChangeGroup={handleAdminChangeGroup}
              isChangingGroup={isAdminChangingGroup}
              groupChangeError={groupChangeError}
              groupChangeSuccess={groupChangeSuccess}
              onGroupAdded={handleGroupAdded}
              onGroupRemoved={handleGroupRemoved}
              registrationDeadline={formData.registrationDeadline}
              holidays={holiday_data}
            />
          )}

          {/* ===================== SELF-STUDY / LEARNER COURSE SECTION ===================== */}
          {formData.courseType === "self-study" && (
            <Self_Study_Section
              sessions={formData.sessions}
              selfStudyType={formData.selfStudyType}
              totalKanji={formData.totalKanji}
              totalVocabulary={formData.totalVocabulary}
              totalGrammar={formData.totalGrammar}
              totalReadingMinutes={formData.totalReadingMinutes}
              totalListeningMinutes={formData.totalListeningMinutes}
              onUpdateSessions={handleUpdateSessions}
              onUpdateSelfStudyType={handleUpdateSelfStudyType}
              onUpdateTotals={handleUpdateTotals}
              sessionPage={sessionPage}
              onSetSessionPage={setSessionPage}
              itemsPerPage={itemsPerPage}
              onSetItemsPerPage={setItemsPerPage}
              selfStudyBaseDate={selfStudyBaseDate}
              onSetSelfStudyBaseDate={setSelfStudyBaseDate}
              courseId={initialData?.id}
              mode={mode}
              mainDurationPerSession={mainDurationPerSession}
              onUpdateMainDurationPerSession={setMainDurationPerSession}
            />
          )}

          {/* ===================== ENROLLMENT SECTION (for ALL course types) ===================== */}
          {/* {formData.courseType && mode === "edit" && (
            <div className="border-t pt-6 mt-6">
              <EnrollEmployeesSection
                allEmployees={employeeLearners}
                courseId={initialData?.id}
                onRefreshEnrollments={async () => {
                  if (initialData?.id) {
                    await fetch_courseEnrollments(initialData.id)
                  }
                }}
                onAdminChangeGroup={handleAdminChangeGroup}
                isChangingGroup={isAdminChangingGroup}
                groupChangeError={groupChangeError}
                groupChangeSuccess={groupChangeSuccess}
                isSubmitting={isSubmitting}
                groups={formData.groups}
                activeGroupTab={activeGroupTab}
                isTrainer={formData.courseType === "trainer"}
              />
            </div>
          )} */}

          {/* ===================== COURSE IMAGE ===================== */}
          <div className="space-y-2">
            <Label>Course Image (Optional)</Label>
            <ImageUploadArea
              imagePreview={imagePreview}
              selectedImage={selectedImage}
              isDragging={isDragging}
              onImageChange={handleImageChange}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          </div>

          {/* ===================== ACTION BUTTONS ===================== */}
          <div className="flex items-center justify-between border-t py-6">
            {mode === "edit" && onDelete && (
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2"
                    disabled={isSubmitting}
                  >
                    <HugeiconsIcon
                      icon={Alert01Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Delete Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Are you sure you want to delete this course?
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete
                      the course "{formData.title}" and all associated data
                      including groups and sessions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">
                      <span className="font-semibold">Warning:</span> All data
                      related to this course will be permanently removed from
                      the system.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete Course"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid() || isSubmitting || disableSubmit}>
                {isSubmitting
                  ? "Saving..."
                  : mode === "add"
                    ? "Create Course"
                    : "Update Course"}
              </Button>
            </div>
          </div>
        </form>

        {/* ===================== CATEGORY DRAWER ===================== */}
        <CategoryDrawer
          open={categoryDrawerOpen}
          onOpenChange={setCategoryDrawerOpen}
          selectedCategory={formData}
          selectedSelfStudyType={formData.selfStudyType}
          onSelectCategory={(categoryValue, categoryType, selfStudyType, categoryId) => {
            let courseType: "trainer" | "self-study" | "" = ""
            if (categoryType === "trainer") courseType = "trainer"
            else if (categoryType === "self-study") courseType = "self-study"

            let newSelfStudyType: "jlpt" | "other" | undefined = undefined
            if (courseType === "self-study") {
              if (selfStudyType) {
                newSelfStudyType = selfStudyType
              } else {
                // Find the exact category by ID
                const categoryData = getAllCategories().find(cat => cat.id === categoryId)
                newSelfStudyType = categoryData?.selfStudyType || "other"
              }
            }

            setFormData({
              ...formData,
              category: categoryValue,
              categoryId: categoryId,  // Store the ID
              courseType: courseType,
              registrationDeadline:
                courseType === "trainer"
                  ? formData.registrationDeadline
                  : undefined,
              groups: courseType === "trainer" ? [defaultGroup] : [],
              sessions: courseType === "self-study" ? [] : [],
              selfStudyType: newSelfStudyType,
              daysPerSession:
                courseType === "self-study" ? undefined : undefined,
              mentionedLearners: [],
              totalKanji: 0,
              totalVocabulary: 0,
              totalGrammar: 0,
              totalReadingMinutes: 0,
              totalListeningMinutes: 0,
            })
            setGroupErrors({})
            setSessionPage(1)
            setTrainerSessionPage(1)
            setSelfStudyBaseDate(null)
          }}
        />
      </>
    )
  }
)

Trainer_CourseForm.displayName = "CourseForm"