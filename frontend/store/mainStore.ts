// store/mainStore.ts
import { skillSetDataStore } from "./zustandStores/skillset_data_store"
import { create } from "zustand"
import { employeeDataStore } from "./zustandStores/employee_data_store"
import { Employee_StoreType, Holiday_StoreType, CurrentTarget_StoreType, SkillSet_StoreType, ExamProgressReport_StoreType, Certificates_StoreType, Session_StoreType, type Course_StoreType, type Feedback_StoreType, type DashboardData_StoreType, type AuditLog_StoreType, SystemConfig_StoreType, type NotificationStoreType, type EmployeeProfileStoreType } from "@/store/types"
import { holidayDataStore } from "./zustandStores/holiday_data_store"
import { currentTargetStore } from "./zustandStores/current_target_store"
import { examProgressReport_Store } from "./zustandStores/examProgress_report_store"
import { certificateDataStore } from "./zustandStores/certificate_store"
import type { SessionData } from "@/types/session"
import { dashboardDataStore } from "./zustandStores/dashboard_store"
import { courseStore } from "./zustandStores/course_store"
import { FeedbackDataStore } from "./zustandStores/feedback_store"
import { auditLogStore } from "./zustandStores/audtiLog_store"
import { systemConfigStore } from "./zustandStores/system_config_store"
import { notificationStore } from "./zustandStores/notification_store"
import { employeeProfileStore } from "./zustandStores/employeeProfile_store"
import { AnnouncementDataStore } from "./zustandStores/announcement_store"

// Combine all store types
type combineTypes = Employee_StoreType & SkillSet_StoreType & CurrentTarget_StoreType & Holiday_StoreType & ExamProgressReport_StoreType & Certificates_StoreType & Session_StoreType & Course_StoreType & Feedback_StoreType & DashboardData_StoreType & AuditLog_StoreType & SystemConfig_StoreType & NotificationStoreType & EmployeeProfileStoreType

type StoreSet = (
  fn: (state: any) => Partial<any>
) => void
type StoreGet = () => any



// Create session store
const sessionStore = (set: StoreSet, get: StoreGet) => ({
  session: null,
  isAuthenticated: false,      

  setSession: (session: SessionData | null) => {
    set((state: any) => ({
      session,
      isAuthenticated: !!session
    }))
  },

  clearSession: () => {
    set((state: any) => ({
      session: null,
      isAuthenticated: false
    }))
  },

  getToken: () => {
    const state = get()
    return state.session?.token || null
  },

  getUserId: () => {
    const state = get()
    return state.session?.userId || null
  },
})

// Main store combining all stores
export const mainStore = create<combineTypes>((set, get) => ({
  ...employeeDataStore(set, get),
  ...skillSetDataStore(set, get),
  ...currentTargetStore(set, get),
  ...holidayDataStore(set, get),
  ...examProgressReport_Store(set, get),
  ...certificateDataStore(set, get),
  ...sessionStore(set, get),
  ...dashboardDataStore(set, get),
  ...courseStore(set, get),
  ...FeedbackDataStore(set, get),
  ...AnnouncementDataStore(set, get),
  ...auditLogStore(set, get),
  ...systemConfigStore(set, get),
  ...notificationStore(set, get),
  ...employeeProfileStore(set, get)
}))

// Helper function to get token from store (can be used outside React components)
export const getAuthToken = () => {
  const state = mainStore.getState();
  return state.getToken();
};

// Helper function to set session (can be used outside React components)
export const setAuthSession = (session: SessionData) => {
  mainStore.getState().setSession(session);
};