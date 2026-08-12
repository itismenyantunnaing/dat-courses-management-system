import type { Course_StoreType } from "../../types"

type StoreSet = (
    fn: (state: Course_StoreType) => Partial<Course_StoreType>
) => void
type StoreGet = () => Course_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Types
export interface AttendanceResponse {
    id: number;
    enrollmentId: number;
    employeeId: string;
    employeeName: string;
    courseSessionId: number;
    sessionNo: number;
    sessionDate: string;
    attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    registeredAt: string;
    groupId?: number; // Add groupId to track which group the attendance belongs to
}

export interface AttendanceRequest {
    enrollmentId: number;
    courseSessionId: number;
    attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface Enrollment {
    id: number;
    courseGroupId: number;
    courseGroupName: string;
    employeeId: string;
    employeeName: string;
    email: string;
    enrollmentStatus: string;
    enrolledAt: string;
    departmentId: number;
    departmentName: string;
    teamId: number;
    teamName: string;
    position: string;
}

// Helper to get auth token
const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
    };
};

export const courseAttendanceStore = (set: StoreSet, get: StoreGet) => ({
    // State
    attendances: [] as AttendanceResponse[],
    enrollments: [] as Enrollment[],
    isLoading: false,
    error: null as string | null,
    success: false,

    // Fetch enrollments for a course group - MERGE instead of REPLACE
    fetchCourseEnrollments: async (courseId: number, groupId: number) => {
        set((state: Course_StoreType) => ({ 
            ...state, 
            isLoading: true, 
            error: null
        }));
        
        try {
            const response = await fetch(
                `${apiUrl}/api/courses/${courseId}/groups/${groupId}/enrollments`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const enrollmentsData = data.enrollments || data || [];

            // MERGE: Keep existing enrollments and add/update new ones
            const currentEnrollments = get().enrollments || [];
            
            // Create a map of existing enrollments by id for deduplication
            const enrollmentMap = new Map();
            currentEnrollments.forEach((enrollment: Enrollment) => {
                enrollmentMap.set(enrollment.id, enrollment);
            });
            
            // Add/update new enrollments
            enrollmentsData.forEach((enrollment: Enrollment) => {
                enrollmentMap.set(enrollment.id, enrollment);
            });
            
            const mergedEnrollments = Array.from(enrollmentMap.values());
            
            console.log(`📊 Enrollments merged: ${mergedEnrollments.length} total (${enrollmentsData.length} new from group ${groupId})`);

            set((state: Course_StoreType) => ({ 
                ...state, 
                enrollments: mergedEnrollments,
                isLoading: false,
                error: null
            }));

            return mergedEnrollments;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch enrollments';
            console.error('❌ Error fetching enrollments:', errorMessage);
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                isLoading: false,
                error: errorMessage
            }));
            
            throw error;
        }
    },

    // Fetch attendance for a course group - MERGE instead of REPLACE
    fetchAttendance: async (courseId: number, groupId: number) => {
        set((state: Course_StoreType) => ({ 
            ...state, 
            isLoading: true, 
            error: null
        }));
        
        try {
            const response = await fetch(
                `${apiUrl}/api/courses/${courseId}/groups/${groupId}/attendance`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const attendanceData = data.attendance || data || [];

            // Add groupId to each attendance record for tracking
            const attendanceWithGroupId = attendanceData.map((attendance: AttendanceResponse) => ({
                ...attendance,
                groupId: groupId // Add groupId to track which group this belongs to
            }));

            // MERGE: Keep existing attendances and add/update new ones
            const currentAttendances = get().attendances || [];
            
            // Create a map of existing attendances by id for deduplication
            const attendanceMap = new Map();
            currentAttendances.forEach((attendance: AttendanceResponse) => {
                attendanceMap.set(attendance.id, attendance);
            });
            
            // Add/update new attendances
            attendanceWithGroupId.forEach((attendance: AttendanceResponse) => {
                attendanceMap.set(attendance.id, attendance);
            });
            
            const mergedAttendances = Array.from(attendanceMap.values());
            
            console.log(`📊 Attendance merged: ${mergedAttendances.length} total (${attendanceData.length} new from group ${groupId})`);
            console.log(`📊 Attendance by group:`, mergedAttendances.reduce((acc: any, att: AttendanceResponse) => {
                const gId = att.groupId || 'unknown';
                acc[gId] = (acc[gId] || 0) + 1;
                return acc;
            }, {}));

            set((state: Course_StoreType) => ({ 
                ...state, 
                attendances: mergedAttendances,
                isLoading: false,
                error: null
            }));

            return mergedAttendances;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance';
            console.error('❌ Error fetching attendance:', errorMessage);
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                isLoading: false,
                error: errorMessage
            }));
            
            throw error;
        }
    },

    // Create attendance record
    createAttendance: async (courseId: number, groupId: number, request: AttendanceRequest) => {
        set((state: Course_StoreType) => ({ 
            ...state, 
            isLoading: true, 
            error: null,
            success: false
        }));
        
        try {
            const response = await fetch(
                `${apiUrl}/api/courses/${courseId}/groups/${groupId}/attendance`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(request)
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const attendanceData = data.attendance || data;
            
            // Add groupId to the new attendance record
            const attendanceWithGroupId = {
                ...attendanceData,
                groupId: groupId
            };

            const currentAttendances = get().attendances;
            
            // Check if attendance already exists (update instead of add)
            const existingIndex = currentAttendances.findIndex(
                (att: AttendanceResponse) => att.id === attendanceWithGroupId.id
            );
            
            let updatedAttendances;
            if (existingIndex >= 0) {
                // Update existing
                updatedAttendances = [...currentAttendances];
                updatedAttendances[existingIndex] = attendanceWithGroupId;
            } else {
                // Add new
                updatedAttendances = [attendanceWithGroupId, ...currentAttendances];
            }
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                attendances: updatedAttendances,
                isLoading: false,
                error: null,
                success: true
            }));

            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create attendance';
            console.error('❌ Error creating attendance:', errorMessage);
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                isLoading: false,
                error: errorMessage,
                success: false
            }));
            
            throw error;
        }
    },

    // Update attendance record
    updateAttendance: async (courseId: number, groupId: number, attendanceId: number, request: AttendanceRequest) => {
        set((state: Course_StoreType) => ({ 
            ...state, 
            isLoading: true, 
            error: null,
            success: false
        }));
        
        try {
            const response = await fetch(
                `${apiUrl}/api/courses/${courseId}/groups/${groupId}/attendance/${attendanceId}`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(request)
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const updatedAttendance = data.attendance || data;
            
            // Preserve groupId
            const updatedAttendanceWithGroupId = {
                ...updatedAttendance,
                groupId: groupId
            };
            
            const currentAttendances = get().attendances;
            
            // Update the attendance in the list
            const updatedAttendances = currentAttendances.map((att: AttendanceResponse) => 
                att.id === updatedAttendanceWithGroupId.id ? updatedAttendanceWithGroupId : att
            );
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                attendances: updatedAttendances,
                isLoading: false,
                error: null,
                success: true
            }));

            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update attendance';
            console.error('❌ Error updating attendance:', errorMessage);
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                isLoading: false,
                error: errorMessage,
                success: false
            }));
            
            throw error;
        }
    },

    // Reset state
    reset: () => {
        set((state: Course_StoreType) => ({ 
            ...state, 
            attendances: [],
            enrollments: [],
            isLoading: false,
            error: null,
            success: false
        }));
    },

    // Clear error
    clearError: () => {
        set((state: Course_StoreType) => ({ 
            ...state, 
            error: null 
        }));
    },

    // Clear attendance for a specific group (useful when refreshing)
    clearAttendanceForGroup: (groupId: number) => {
        const currentAttendances = get().attendances || [];
        const filteredAttendances = currentAttendances.filter(
            (att: AttendanceResponse) => att.groupId !== groupId
        );
        
        set((state: Course_StoreType) => ({ 
            ...state, 
            attendances: filteredAttendances
        }));
    },

    // Clear enrollments for a specific group
    clearEnrollmentsForGroup: (groupId: number) => {
        // Note: Enrollments don't have groupId in the current type
        // You might want to filter by courseGroupId instead
        const currentEnrollments = get().enrollments || [];
        const filteredEnrollments = currentEnrollments.filter(
            (enrollment: Enrollment) => enrollment.courseGroupId !== groupId
        );
        
        set((state: Course_StoreType) => ({ 
            ...state, 
            enrollments: filteredEnrollments
        }));
    }
});