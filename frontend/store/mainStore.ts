// store/mainStore.ts
import { skillSetDataStore } from "./zustandStores/skillset_data_store"
import { create } from "zustand"
import { employeeDataStore } from "./zustandStores/employee_data_store"
import { Employee_StoreType, Holiday_StoreType, CurrentTarget_StoreType, SkillSet_StoreType, ExamProgressReport_StoreType,  Certificates_StoreType, Session_StoreType } from "@/store/types"
import { holidayDataStore } from "./zustandStores/holiday_data_store"
import { currentTargetStore } from "./zustandStores/current_target_store"
import { examProgressReport_Store } from "./zustandStores/examProgress_report_store"
import { certificateDataStore } from "./zustandStores/certificate_store"
import type { SessionData } from "@/types/session"


// Combine all store types
type combineTypes = Employee_StoreType & SkillSet_StoreType & CurrentTarget_StoreType & Holiday_StoreType & ExamProgressReport_StoreType & Certificates_StoreType & Session_StoreType

type StoreSet = (
  fn: (state: Session_StoreType) => Partial<Session_StoreType>
) => void
type StoreGet = () => Session_StoreType

// Create session store
const sessionStore = (set: StoreSet, get: StoreGet) => ({
  session: null,
  isAuthenticated: false,

  setSession: (session: SessionData | null) => {
    set(() => ({ 
      session, 
      isAuthenticated: !!session 
    }))
  },

  clearSession: () => {
    set(() => ({ 
      session: null, 
      isAuthenticated: false 
    }))
  },

  getToken: () => {
    const state = get()
    return state.session?.token || null
  },

  getUserRole: () => {
    const state = get()
    return state.session?.role || null
  },

  getUserName: () => {
    const state = get()
    return state.session?.name || null
  },

  getUserEmail: () => {
    const state = get()
    return state.session?.email || null
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
}))