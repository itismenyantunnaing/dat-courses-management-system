import {
  CourseStatsDTO,
  DepartmentMonthlyAttendanceDTO,
  RiskResponseDTO,
  OverallCertificateStatisticsDTO,
  TeamCertificateStatisticsDTO
} from "@/types/dashboard";

type StoreSet = (
  fn: (state: CourseStatsStoreType) => Partial<CourseStatsStoreType>
) => void;
type StoreGet = () => CourseStatsStoreType;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface CourseStatsStoreType {
  courseStats: CourseStatsDTO[];
  monthlyAttendance: DepartmentMonthlyAttendanceDTO[];
  riskData: RiskResponseDTO | null;
  overallCertificateStats: OverallCertificateStatisticsDTO | null;
  teamCertificateStats: TeamCertificateStatisticsDTO | null;
  activeLearnerCount: [];
  isLoading: boolean;
  error: string | null;

  fetchCourseStats: () => Promise<void>;
  fetchDailyAttendance: () => Promise<void>;
  fetchRiskData: () => Promise<void>;
  fetchOverallCertificateStats: () => Promise<void>;
  fetchTeamCertificateStats: () => Promise<void>;
  fetchActiverLearnerCount: () => Promise<void>;
  reset: () => void;
}

export const dashboardDataStore = (set: StoreSet, get: StoreGet): CourseStatsStoreType => ({
  activeLearnerCount: [],
  courseStats: [],
  monthlyAttendance: [],
  riskData: null,
  overallCertificateStats: null,
  teamCertificateStats: null,
  isLoading: false,
  error: null,

  fetchActiverLearnerCount: async () => {
    const currentState = get();

    // Don't fetch if already loading
    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/active-learners`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      set(() => ({
        activeLearnersCount: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching course stats:', error);
      set(() => ({
        activeLearnersCount: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch course stats'
      }));
    }
  },

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

  fetchDailyAttendance: async () => {
    const currentState = get();

    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/daily-attendance`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DepartmentMonthlyAttendanceDTO[] = await response.json();
      set(() => ({
        dailyAttendance: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      set(() => ({
        dailyAttendance: [],
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

  fetchOverallCertificateStats: async () => {
    const currentState = get();

    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/certificate-statistics/overall`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OverallCertificateStatisticsDTO = await response.json();
      set(() => ({
        overallCertificateStats: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching overall certificate statistics:', error);
      set(() => ({
        overallCertificateStats: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch overall certificate statistics'
      }));
    }
  },

  fetchTeamCertificateStats: async () => {
    const currentState = get();

    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/certificate-statistics/teams`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TeamCertificateStatisticsDTO = await response.json();
      set(() => ({
        teamCertificateStats: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching team certificate statistics:', error);
      set(() => ({
        teamCertificateStats: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch team certificate statistics'
      }));
    }
  },

  reset: () => {
    set(() => ({
      courseStats: [],
      monthlyAttendance: [],
      riskData: null,
      overallCertificateStats: null,
      teamCertificateStats: null,
      isLoading: false,
      error: null
    }));
  }
});