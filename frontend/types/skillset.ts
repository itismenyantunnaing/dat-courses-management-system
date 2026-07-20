// for technical ability
export interface Skill {
  id: number;
  skillName: string;
}

export interface SkillSubCategory {
  id: number;
  subCategoryName: string;
  skills: Skill[];
}

export interface SkillCategory {
  id: number;
  categoryName: string;
  skillSubCategories: SkillSubCategory[];
}

export interface EmployeeSkill {
  employeeId: string;
  id: number;
  skillName: string;
  category_id: number;
  category_name: string;
  sub_category_id: number;
  sub_category_name: string;
  yearsOfExperience: number | null;
  experienceLevel: string | null;
}

// for development capability 
export interface DevelopmentCapability {
  id?: number;
  employeeId: string;
  developmentTypeName: string;
  processName: string;
  yearsOfExperience: number
}

export interface EmployeeDevelopmentExperience {
  employeeId: string;
  development_type_id: number;
  development_type_name: string;
  process_name: string | null;
  years_of_experience: number | null;
}

// for language skills
export interface LanguageSkill {
  employeeId: string;
  languageSkillLevel: string | number | null;
  jlpt_highest_level: string | null;
}

// for management ability
export interface ManagementScore {
  employeeId: string;
  management_experience_level: number | null;
  qcd_score: number | null;
  report_consult_score: number | null;
  education_score: number | null;
  total_level: number | null;
}

export interface dictionary {
  id: number,
  japaneseText: string,
  englishText: string
}