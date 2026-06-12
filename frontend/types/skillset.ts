// for technical ability
export interface Skill {
  id: number;
  skill_name: string;
}

export interface SkillSubCategory {
  id: number;
  sub_category_name: string;
  skills: Skill[];
}

export interface SkillCategory {
  id: number;
  category_name: string;
  skill_sub_categories: SkillSubCategory[];
}

export interface EmployeeSkill {
  employee_id: string;
  skill_id: number;
  skill_name: string;
  category_id: number;
  category_name: string;
  sub_category_id: number;
  sub_category_name: string;
  years_of_experience: number | null;
  experience_level: string | null;
}

// for development capability 
export interface DevelopmentCapability {
  id: number;
  development_type: string;
}

export interface EmployeeDevelopmentExperience {
  employee_id: string;
  development_type_id: number;
  development_type_name: string;  
  process_name: string | null;
  years_of_experience: number | null;
}

// for language skills
export interface LanguageSkill {
  employee_id: string;
  language_skill_level: number | null;
  jlpt_highest_level: string | null;
}

// for management ability
export interface ManagementScore {
  employee_id: string;
  management_experience_level: number | null;
  qcd_score: number | null;
  report_consult_score: number | null;
  education_score: number | null;
  total_level: number | null;
}