import {
  CourseStatsDTO,
  RiskResponseDTO,
  OverallCertificateStatisticsDTO,
  TeamCertificateStatisticsDTO,
  EmployeeCourseStatsResponseDTO,
  EmployeeProgressResponseDTO,
  EmployeeCourseSummaryResponseDTO,
  UpcomingSessionResponse,
  EmployeeTargetLevelDTO,
  type DepartmentDailyAttendanceDTO
} from "@/types/dashboard";
import type { DashboardData_StoreType } from "../types";

type StoreSet = (
  fn: (state: DashboardData_StoreType) => Partial<DashboardData_StoreType>
) => void;
type StoreGet = () => DashboardData_StoreType;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';


export const dashboardDataStore = (set: StoreSet, get: StoreGet) => ({
  // Initial state
  courseStats: [],
  riskData: null,
  overallCertificateStats: null,
  teamCertificateStats: null,
  employeeCourseStats: null,
  employeeProgress: null,
  employeeCourseSummary: [],
  employeeTargetLevel: null,
  upcomingAllSessionsData: [],
  upcomingSessionsData: [],
  isLoading: false,
  error: null,



  // for Admin and Approver dashboard

  fetchActiveLearnerCount: async () => {
    const currentState = get();
    const profile = get().profile

    // Don't fetch if already loading
    if (currentState.isLoading) return;
    

    set(() => ({ isLoading: true, error: null }));
    let response;
    try {
      if (profile.role.toLowerCase() === "approver" && profile.id) {
        response = await fetch(`${apiUrl}/api/course-stats/active-learners?employeeId=${profile.id}`);
      } else {
        response = await fetch(`${apiUrl}/api/course-stats/active-learners`);
      }

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
        activeLearnersCount: null,
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

      const data: DepartmentDailyAttendanceDTO[] = await response.json();
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

  // for learner dashboard

  // for top four parts in UI and  Overall Attendance section
  fetchEmployeeCourseStats: async (employeeId: string) => {
    const currentState = get();

    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/employee/${employeeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EmployeeCourseStatsResponseDTO = await response.json();
      set(() => ({
        employeeCourseStats: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching employee course stats:', error);
      set(() => ({
        employeeCourseStats: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employee course stats'
      }));
    }
  },

  // for Daily/Current Attendance
  fetchEmployeeAttendance: async (employeeId: string) => {
    const currentState = get();

    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/employee/progress/${employeeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EmployeeProgressResponseDTO = await response.json();
      set(() => ({
        employeeAttendance: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching employee progress:', error);
      set(() => ({
        employeeAttendance: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employee progress'
      }));
    }
  },


  fetchAllEmployeesCourseSummary: async () => {
    const currentState = get();

    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/employee-summary`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EmployeeCourseSummaryResponseDTO[] = await response.json();
      set(() => ({
        employeeCourseSummary: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching employee course summary:', error);
      set(() => ({
        employeeCourseSummary: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employee course summary'
      }));
    }
  },


  // all today and upcoming sessions
  fetchAllUpcomingSessions: async (employeeId: string) => {
    const currentState = get();
    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/upcoming-sessions/${employeeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UpcomingSessionResponse[] = await response.json();
      set(() => ({
        upcomingAllSessionsData: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      set(() => ({
        upcomingAllSessionsData: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming sessions'
      }));
    }
  },


  // today and only one upcoming session
  fetchUpcomingSessions: async (employeeId: string) => {
    const currentState = get();
    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/highlight-sessions/${employeeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UpcomingSessionResponse[] = await response.json();
      set(() => ({
        upcomingSessionsData: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      set(() => ({
        upcomingSessionsData: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming sessions'
      }));
    }
  },

  fetchEmployeeTargetLevel: async (employeeId: string) => {
    const currentState = get();
    if (currentState.isLoading) return;

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/course-stats/targetTerm/${employeeId}`);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // If response is 404 or other error, throw with status
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content before parsing JSON
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || !contentLength) {
        // Empty response - set to null
        set(() => ({
          employeeTargetLevel: null,
          isLoading: false
        }));
        return;
      }

      // Try to parse JSON
      const data: EmployeeTargetLevelDTO = await response.json();
      set(() => ({
        employeeTargetLevel: data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching employee target level:', error);
      set(() => ({
        employeeTargetLevel: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employee target level'
      }));
    }
  },


  reset: () => {
    set(() => ({
      courseStats: [],
      riskData: null,
      overallCertificateStats: null,
      teamCertificateStats: null,
      employeeCourseStats: null,
      employeeAttendance: null,
      employeeCourseSummary: [],
      employeeTargetLevel: null,
      upcomingSessionsData: [],
      isLoading: false,
      error: null
    }));
  }
});