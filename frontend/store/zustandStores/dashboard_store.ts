import { CourseStatsDTO, DepartmentMonthlyAttendanceDTO, RiskResponseDTO} from "@/types/dashboard";

type StoreSet = (
  fn: (state: CourseStatsStoreType) => Partial<CourseStatsStoreType>
) => void;
type StoreGet = () => CourseStatsStoreType;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface CourseStatsStoreType {
  courseStats: CourseStatsDTO[];
  monthlyAttendance: DepartmentMonthlyAttendanceDTO[];
  riskData: RiskResponseDTO | null;
  isLoading: boolean;
  error: string | null;

  fetchCourseStats: () => Promise<void>;
  fetchMonthlyAttendance: () => Promise<void>;
  fetchRiskData: () => Promise<void>;
  reset: () => void;
}

export const dashboardDataStore= (set: StoreSet, get: StoreGet): CourseStatsStoreType => ({
  courseStats: [],
  monthlyAttendance: [],
  riskData: null,
  isLoading: false,
  error: null,

  fetchCourseStats: async () => {
    const currentState = get();
    
    // Don't fetch if already loading
    if (currentState.isLoading) return;
    
    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CourseStatsDTO[] = await response.json();
      set(() => ({ 
        courseStats: data,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error fetching course stats:', error);
      set(() => ({ 
        courseStats: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch course stats'
      }));
    }
  },

  fetchMonthlyAttendance: async () => {
    const currentState = get();
    
    if (currentState.isLoading) return;
    
    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/monthly-attendance`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DepartmentMonthlyAttendanceDTO[] = await response.json();
      set(() => ({ 
        monthlyAttendance: data,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      set(() => ({ 
        monthlyAttendance: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch monthly attendance'
      }));
    }
  },

  fetchRiskData: async () => {
    const currentState = get();
    
    if (currentState.isLoading) return;
    
    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/risk`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RiskResponseDTO = await response.json();
      set(() => ({ 
        riskData: data,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error fetching risk data:', error);
      set(() => ({ 
        riskData: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch risk data'
      }));
    }
  },

  reset: () => {
    set(() => ({
      courseStats: [],
      monthlyAttendance: [],
      riskData: null,
      isLoading: false,
      error: null
    }));
  }
});