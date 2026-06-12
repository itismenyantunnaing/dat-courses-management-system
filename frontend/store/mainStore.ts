import { skillSetDataStore } from './zustandStores/skillset_data_store';
import {create} from "zustand";
import { employeeDataStore } from "./zustandStores/employee_data_store";
import { Employee_StoreType, SkillSet_StoreType } from "@/store/types";

type combineTypes = Employee_StoreType & SkillSet_StoreType;

export const mainStore = create<combineTypes>((set, get) => ({
    ...employeeDataStore(set, get),
    ...skillSetDataStore(set, get)
}))