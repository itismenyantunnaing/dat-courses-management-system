"use client"

import React, { useState, useMemo, useCallback, useDeferredValue, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    PlusSignIcon,
    Delete02Icon,
    UserGroupIcon,
    Add01Icon,
    ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from "@/components/ui/command"
import { format } from "date-fns"
import { mainStore } from "@/store/mainStore"
import { MentionedLearner } from "@/types/course"
import { cn } from "@/lib/utils"

interface EnrollEmployeesSectionProps {
    allEmployees: MentionedLearner[]
    courseId?: number | string
    onRefreshEnrollments?: () => Promise<void>
    isSubmitting?: boolean
    groups?: any[]
    activeGroupTab?: string
    isTrainer?: boolean
}

const statusColors: Record<string, string> = {
    APPROVED: "bg-green-500",
    PENDING: "bg-yellow-500",
    CANCELLED: "bg-gray-500",
    COMPLETED: "bg-blue-500",
}

const statusLabels: Record<string, string> = {
    APPROVED: "Approved",
    PENDING: "Pending",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
}

const AVAILABLE_LEARNERS_PER_PAGE = 10

export const EnrollEmployeesSection: React.FC<EnrollEmployeesSectionProps> = ({
    allEmployees,
    courseId,
    onRefreshEnrollments,
    isSubmitting,
    groups = [],
    activeGroupTab = "",
    isTrainer = false,
}) => {
    const { enrollments, fetch_courseEnrollments, enrollEmployee, unenrollEmployee } = mainStore()
    
    // Local state to store enrollments with smooth transitions
    const [displayEnrollments, setDisplayEnrollments] = useState<any[]>([])
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [visibleLearnersCount, setVisibleLearnersCount] = useState(AVAILABLE_LEARNERS_PER_PAGE)
    const [searchQuery, setSearchQuery] = useState("")
    const [isEnrollingEmployee, setIsEnrollingEmployee] = useState(false)
    const [isUnenrollingEmployee, setIsUnenrollingEmployee] = useState<number | null>(null)
    const [learnersCommandOpen, setLearnersCommandOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    
    const transitionTimerRef = useRef<NodeJS.Timeout | null>(null)
    const deferredSearchQuery = useDeferredValue(searchQuery)
    
    // Store enrollments with smooth transition
    useEffect(() => {
        if (!enrollments) return
        
        // If it's the first load, just set the data
        if (isLoading) {
            setDisplayEnrollments(enrollments)
            setIsLoading(false)
            return
        }
        
        // Check if data actually changed
        const currentIds = displayEnrollments.map((e: any) => e.id).sort()
        const newIds = enrollments.map((e: any) => e.id).sort()
        
        if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
            // Show transition state
            setIsTransitioning(true)
            
            // Clear any existing timer
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current)
            }
            
            // Update the data after a short delay to show transition
            transitionTimerRef.current = setTimeout(() => {
                setDisplayEnrollments(enrollments)
                setIsTransitioning(false)
                transitionTimerRef.current = null
            }, 150) // Short delay for smooth transition
        }
    }, [enrollments, isLoading, displayEnrollments])
    
    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current)
            }
        }
    }, [])
    
    //  Memoize enrolled employee IDs based on display enrollments
    const enrolledIds = useMemo(() => {
        return new Set(
            displayEnrollments
                .filter((e: any) => e.enrollmentStatus !== 'CANCELLED')
                .map((e: any) => e.employeeId)
        )
    }, [displayEnrollments])
    
    //  Memoize current group enrolled IDs (for trainer courses)
    const currentGroupEnrolledIds = useMemo(() => {
        if (!isTrainer) return new Set()
        
        const activeGroup = groups.find(g => g.id === activeGroupTab)
        if (!activeGroup) return new Set()
        
        const groupId = parseInt(activeGroup.id.replace('g', ''))
        return new Set(
            displayEnrollments
                .filter((e: any) => e.courseGroupId === groupId && e.enrollmentStatus !== 'CANCELLED')
                .map((e: any) => e.employeeId)
        )
    }, [displayEnrollments, isTrainer, groups, activeGroupTab])
    
    //  Memoize available employees
    const allAvailableEmployees = useMemo(() => {
        if (isTrainer) {
            return allEmployees.filter(learner => !currentGroupEnrolledIds.has(learner.id))
        }
        return allEmployees.filter(learner => !enrolledIds.has(learner.id))
    }, [allEmployees, isTrainer, currentGroupEnrolledIds, enrolledIds])
    
    //  Memoize displayed learners with search
    const displayedLearners = useMemo(() => {
        if (!deferredSearchQuery.trim()) {
            return allAvailableEmployees
        }
        const query = deferredSearchQuery.toLowerCase().trim()
        return allAvailableEmployees.filter((learner) => {
            const searchableFields = [
                learner.name || '',
                learner.email || '',
                learner.department || '',
                learner.team || ''
            ]
            return searchableFields.some(field =>
                field.toLowerCase().includes(query)
            )
        })
    }, [allAvailableEmployees, deferredSearchQuery])
    
    //  Memoize visible learners (paginated)
    const visibleLearners = useMemo(() => {
        return displayedLearners.slice(0, visibleLearnersCount)
    }, [displayedLearners, visibleLearnersCount])
    
    const hasMoreLearners = visibleLearnersCount < displayedLearners.length
    
    const handleSeeMore = useCallback(() => {
        setVisibleLearnersCount(prev => prev + AVAILABLE_LEARNERS_PER_PAGE)
    }, [])
    
    //  Memoize enrolled employees list from display enrollments
    const enrolledEmployees = useMemo(() => {
        if (!displayEnrollments || displayEnrollments.length === 0) return []
        return displayEnrollments.filter((e: any) => e.enrollmentStatus !== 'CANCELLED')
    }, [displayEnrollments])
    
    //  Reset search when dialog closes
    useEffect(() => {
        if (!learnersCommandOpen) {
            setSearchQuery("")
            setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
        }
    }, [learnersCommandOpen])
    
    // Handler to enroll an employee
    const handleEnrollEmployee = useCallback(async (employee: MentionedLearner) => {
        if (!courseId) {
            alert('Course ID is required to enroll')
            return
        }
        
        let groupId = 1
        
        if (isTrainer) {
            const activeGroup = groups.find(g => g.id === activeGroupTab)
            if (activeGroup) {
                groupId = parseInt(activeGroup.id.replace('g', ''))
            }
        }
        
        const isAlreadyEnrolled = isTrainer 
            ? currentGroupEnrolledIds.has(employee.id)
            : enrolledIds.has(employee.id)
        
        if (isAlreadyEnrolled) {
            alert(`${employee.name} is already enrolled in this course`)
            return
        }
        
        if (!confirm(`Are you sure you want to enroll ${employee.name} in this course?`)) {
            return
        }
        
        setIsEnrollingEmployee(true)
        try {
            const result = await enrollEmployee(courseId, groupId, employee.id)
            
            if (result.success) {
                alert(`✅ ${employee.name} enrolled successfully!`)
                setSearchQuery("")
                setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
                setLearnersCommandOpen(false)
                
                // Fetch fresh data (will trigger the transition effect)
                await fetch_courseEnrollments(courseId)
                if (onRefreshEnrollments) {
                    await onRefreshEnrollments()
                }
            } else {
                alert(result.message || 'Failed to enroll employee')
            }
        } catch (error) {
            console.error('Error enrolling employee:', error)
            alert('An error occurred while enrolling')
        } finally {
            setIsEnrollingEmployee(false)
        }
    }, [courseId, isTrainer, groups, activeGroupTab, currentGroupEnrolledIds, enrolledIds, enrollEmployee, fetch_courseEnrollments, onRefreshEnrollments])
    
    // Handler to unenroll an employee
    const handleUnenrollEmployee = useCallback(async (enrollmentId: number, employeeName: string) => {
        if (!courseId) {
            alert('Course ID is required to unenroll')
            return
        }
        
        if (!confirm(`Are you sure you want to unenroll ${employeeName} from this course?`)) {
            return
        }
        
        setIsUnenrollingEmployee(enrollmentId)
        try {
            const result = await unenrollEmployee(courseId, enrollmentId)
            
            if (result.success) {
                alert(`✅ ${employeeName} unenrolled successfully!`)
                
                // Fetch fresh data (will trigger the transition effect)
                await fetch_courseEnrollments(courseId)
                if (onRefreshEnrollments) {
                    await onRefreshEnrollments()
                }
            } else {
                alert(result.message || 'Failed to unenroll employee')
            }
        } catch (error) {
            console.error('Error unenrolling employee:', error)
            alert('An error occurred while unenrolling')
        } finally {
            setIsUnenrollingEmployee(null)
        }
    }, [courseId, unenrollEmployee, fetch_courseEnrollments, onRefreshEnrollments])
    
    // Helper function to get initials from name
    const getInitials = useCallback((name: string) => {
        if (!name) return "??"
        const parts = name.split(" ")
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }, [])
    
    //  Memoize the command items to prevent re-renders
    const commandItems = useMemo(() => {
        return visibleLearners.map((learner) => (
            <CommandItem
                key={learner.id}
                onSelect={() => {
                    handleEnrollEmployee(learner)
                    setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
                    setSearchQuery("")
                }}
                className="flex items-center justify-between"
                disabled={isEnrollingEmployee}
            >
                <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={learner.avatar} alt={learner.name} />
                    <AvatarFallback className="rounded-lg">
                        {getInitials(learner.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{learner.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{learner.department} • {learner.team}</span>
                </div>
                <CommandShortcut>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="h-4 w-4" />
                    </Button>
                </CommandShortcut>
            </CommandItem>
        ))
    }, [visibleLearners, isEnrollingEmployee, handleEnrollEmployee, getInitials])
    
    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="h-4 w-4" />
                    Enrolled Employees
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                        ({enrolledEmployees.length})
                        {isTransitioning && (
                            <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        )}
                    </span>
                </Label>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLearnersCommandOpen(true)}
                    className="gap-2"
                    disabled={isSubmitting || isTransitioning}
                >
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="h-4 w-4" />
                    Add Employee
                </Button>
            </div>
            
            {enrolledEmployees.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed py-8 text-center text-sm text-muted-foreground">
                    No employees enrolled in this course yet
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {enrolledEmployees.map((employee: any) => {
                        const isUnenrolling = isUnenrollingEmployee === employee.id;
                        
                        return (
                            <div key={employee.id} className="flex items-center gap-3 rounded-lg border bg-muted/5 p-3 transition-colors hover:bg-muted/10">
                                <Avatar className="h-10 w-10 rounded-lg shrink-0">
                                    <AvatarImage src={employee.pfImage || ""} />
                                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-medium">
                                        {getInitials(employee.employeeName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-medium">{employee.employeeName}</span>
                                        <Badge variant="outline" className={cn("h-4 px-1.5 py-0 text-[10px]", statusColors[employee.enrollmentStatus], "bg-opacity-10")}>
                                            {statusLabels[employee.enrollmentStatus] || employee.enrollmentStatus}
                                        </Badge>
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">{employee.email}</div>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span className="truncate">{employee.departmentName}</span>
                                        {employee.departmentName && employee.teamName && <span>•</span>}
                                        {employee.teamName && <span className="truncate">{employee.teamName}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(employee.enrolledAt), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleUnenrollEmployee(employee.id, employee.employeeName)}
                                    disabled={isUnenrolling || isTransitioning}
                                >
                                    {isUnenrolling || isTransitioning ? (
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                                    ) : (
                                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Command Dialog for Adding Employees */}
            <CommandDialog open={learnersCommandOpen} onOpenChange={setLearnersCommandOpen}>
                <Command className="gap-3" shouldFilter={false}>
                    <CommandInput
                        placeholder="Search employees by name, email, department..."
                        value={searchQuery}
                        onValueChange={(value) => {
                            setSearchQuery(value)
                            setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {searchQuery && displayedLearners.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No employees found matching "{searchQuery}"
                                </div>
                            ) : displayedLearners.length === 0 && !searchQuery ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    All available employees are already enrolled
                                </div>
                            ) : null}
                        </CommandEmpty>
                        <CommandGroup className="gap-2">
                            {commandItems}
                        </CommandGroup>
                        
                        {hasMoreLearners && (
                            <div className="border-t p-3">
                                <div className="flex flex-col items-center gap-2">
                                    <Button type="button" variant="outline" size="default" onClick={handleSeeMore} className="w-full gap-2">
                                        <span>See More</span>
                                        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        Showing {visibleLearners.length} of {displayedLearners.length} employees
                                    </span>
                                </div>
                            </div>
                        )}
                    </CommandList>
                </Command>
            </CommandDialog>
        </div>
    )
}