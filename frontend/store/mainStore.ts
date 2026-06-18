import { skillSetDataStore } from "./zustandStores/skillset_data_store"
import { create } from "zustand"
import { employeeDataStore } from "./zustandStores/employee_data_store"
import { Employee_StoreType, Holiday_StoreType, CurrentTarget_StoreType, SkillSet_StoreType, ExamProgressReport_StoreType } from "@/store/types"
import { holidayDataStore } from "./zustandStores/holiday_data_store"
import { currentTargetStore } from "./zustandStores/current_target_store"
import { examProgressReport_Store } from "./zustandStores/examProgress_report_store"

type combineTypes = Employee_StoreType & SkillSet_StoreType & CurrentTarget_StoreType & Holiday_StoreType & ExamProgressReport_StoreType

export const mainStore = create<combineTypes>((set, get) => ({
  ...employeeDataStore(set, get),
  ...skillSetDataStore(set, get),
  ...currentTargetStore(set, get),
  ...holidayDataStore(set, get),
  ...examProgressReport_Store(set, get)
}))
