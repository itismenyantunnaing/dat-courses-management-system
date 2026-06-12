import { Employee } from "@/types/employee";
import { SkillCategory, EmployeeSkill, DevelopmentCapability, EmployeeDevelopmentExperience, LanguageSkill, ManagementScore} from '@/types/skillset';


export interface Employee_StoreType {
  employee_data: Employee[];
  fetch_EmployeeData: () => Promise<void>;
}

export interface SkillSet_StoreType {
  skillData?: EmployeeSkill[];
  skill_headers?: SkillCategory[];
  devCap_headers?: DevelopmentCapability[];
  devCap_data?: EmployeeDevelopmentExperience[];
  languageSkill_data?: LanguageSkill[];
  managementScores_Data?: ManagementScore[]; 
  fetch_SkillData: () => Promise<void>;
  fetch_SkillHeaders: () => Promise<void>;
  fetch_devCapHeaders: () => Promise<void>;
  fetch_devCapData: () => Promise<void>;
  fetch_languageSkillData: () => Promise<void>;
  fetch_managementScoreData: () => Promise<void>; 
}