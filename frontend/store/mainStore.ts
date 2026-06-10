import { skillDataStore } from './zustandStores/skill_data_store';
import {create} from "zustand";
import { tableHeaderStore } from "./tableHeaderStore";
import { employeeDataStore } from "./zustandStores/employee_data_store";


export const mainStore = create<any>((set, get) => ({
    ...employeeDataStore(set, get),
    ...skillDataStore(set, get)
}))