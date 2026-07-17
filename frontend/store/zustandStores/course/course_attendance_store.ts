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

    // Fetch enrollments for a course group
    fetchCourseEnrollments: async (courseId: number, groupId: number) => {
        set((state: Course_StoreType) => ({ 
            ...state, 
            isLoading: true, 
            error: null,
            enrollments: [] 
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
            console.log('✅ Enrollments fetched:', data);

            set((state: Course_StoreType) => ({ 
                ...state, 
                enrollments: data,
                isLoading: false,
                error: null
            }));

            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch enrollments';
            console.error('❌ Error fetching enrollments:', errorMessage);
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                isLoading: false,
                error: errorMessage,
                enrollments: []
            }));
            
            throw error;
        }
    },

    // Fetch attendance for a course group
    fetchAttendance: async (courseId: number, groupId: number) => {
        set((state: Course_StoreType) => ({ 
            ...state, 
            isLoading: true, 
            error: null,
            attendances: [] 
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
            console.log('✅ Attendance fetched:', data);

            // Handle different response formats
            const attendanceData = data.attendance || data || [];
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                attendances: attendanceData,
                isLoading: false,
                error: null
            }));

            return attendanceData;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance';
            console.error('❌ Error fetching attendance:', errorMessage);
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                isLoading: false,
                error: errorMessage,
                attendances: []
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
            console.log('✅ Attendance created:', data);

            const attendanceData = data.attendance || data;
            const currentAttendances = get().attendances;
            
            set((state: Course_StoreType) => ({ 
                ...state, 
                attendances: [attendanceData, ...currentAttendances],
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
            console.log('✅ Attendance updated:', data);

            const updatedAttendance = data.attendance || data;
            const currentAttendances = get().attendances;
            
            // Update the attendance in the list
            const updatedAttendances = currentAttendances.map((att: AttendanceResponse) => 
                att.id === updatedAttendance.id ? updatedAttendance : att
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
    }
});