import type { DevelopmentCapability, LanguageSkill, ManagementScore } from "@/types/skillset";
import { SkillSet_StoreType } from "../types"
import type { TechnicalSkillData } from "@/components/drawers/skillset/skillsetForm";


type StoreSet = (fn: (state: SkillSet_StoreType) => Partial<SkillSet_StoreType>) => void;
type StoreGet = () => SkillSet_StoreType;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const skillSetDataStore = (set: StoreSet, get: StoreGet) => ({
  managementScores_Data: [],
  skillData: [],
  skill_headers: [],
  devCap_headers: [],
  devCap_data: [],
  languageSkill_data: [],

  // ========== SKILL HEADERS (TECHNICAL CATEGORIES) CRUD ==========

  // GET - Fetch all skill categories with structure
  fetch_SkillHeaders: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/technical/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set(() => ({ skill_headers: data }));
    } catch (error) {
      console.error('Error fetching skill headers:', error);
      set(() => ({ skill_headers: [] }));
    }
  },

  // UPDATE - Update a single category with skills (requires id)
  update_SkillCategory: async (data: {
    id: number;  // Required for update
    categoryName: string;
    skillSubCategories?: Array<{
      id?: number;
      subCategoryName: string;
      skills?: Array<{
        id?: number;
        skillName: string;
      }>;
    }>;
  }) => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/technical/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      await get().fetch_SkillHeaders();
      return result;
    } catch (error) {
      console.error('Error updating skill category:', error);
      throw error;
    }
  },

  // CREATE - Create multiple categories with skills (bulk create, no ids)
  add_BulkSkillCategories: async (data: Array<{
    categoryName: string;
    skillSubCategories?: Array<{
      subCategoryName: string;
      skills?: Array<{
        skillName: string;
      }>;
    }>;
  }>) => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/technical/categories/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      await get().fetch_SkillHeaders();
      return result;
    } catch (error) {
      console.error('Error creating bulk skill categories:', error);
      throw error;
    }
  },

  // ========== SKILL DATA (EMPLOYEE SKILLS) CRUD ==========

  // GET - Fetch all employee skills
  fetch_SkillData: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/technical`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set(() => ({ skillData: data }));
    } catch (error) {
      console.error('Error fetching skill data:', error);
      set(() => ({ skillData: [] }));
    }
  },

  // POST - Create a new employee skill
  add_SkillData: async (data: {
    employeeId: string;
    skillName: string;
    categoryName?: string;
    subCategoryName?: string;
    yearsOfExperience: number;
    experienceLevel: string;
  }) => {
    try {

      const response = await fetch(`${apiUrl}/api/skills/technical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh data
      await get().fetch_SkillData();

      return result;
    } catch (error) {
      console.error('Error creating employee skill:', error);
      throw error;
    }
  },

  // PUT - Update an employee skill
  update_SkillData: async (id: number, data: {
    employeeId: string;
    skillName: string;
    categoryName?: string;
    subCategoryName?: string;
    yearsOfExperience: number;
    experienceLevel: string;
  }) => {
    try {

      const response = await fetch(`${apiUrl}/api/skills/technical/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh data
      await get().fetch_SkillData();

      return result;
    } catch (error) {
      console.error('Error updating employee skill:', error);
      throw error;
    }
  },

  // ========== MANAGEMENT SCORES CRUD ==========

  // GET - Fetch all management scores
  fetch_managementScoreData: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/management`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set(() => ({ managementScores_Data: data }));
    } catch (error) {
      console.error('Error fetching management score data:', error);
      set(() => ({ managementScores_Data: [] }));
    }
  },

  // POST - Create a new management score
  add_managementScoreData: async (data: {
    employeeId: string;
    managementExperienceLevel: number;
    qcdScore: number;
    reportConsultScore: number;
    educationScore: number;
  }) => {
    try {
      const managementExperienceLevel = Math.max(1, Math.min(5, Number(data.managementExperienceLevel) || 1));

      const validateScore = (value: number, fieldName: string) => {
        const numValue = Number(value);
        if (numValue < 1 || numValue > 4) {
          throw new Error(`${fieldName} must be between 1 and 4`);
        }
        return numValue;
      };

      const qcdScore = validateScore(data.qcdScore, 'QCD Score');
      const reportConsultScore = validateScore(data.reportConsultScore, 'Report/Consult Score');
      const educationScore = validateScore(data.educationScore, 'Education Score');


      const response = await fetch(`${apiUrl}/api/skills/management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          managementExperienceLevel: managementExperienceLevel,
          qcdScore: qcdScore,
          reportConsultScore: reportConsultScore,
          educationScore: educationScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      await get().fetch_managementScoreData();

      return result;
    } catch (error) {
      console.error('Error creating management score:', error);
      throw error;
    }
  },

  // PUT - Update a management score
  update_managementScoreData: async (id: number, data: {
    employeeId: string;
    managementExperienceLevel: number;
    qcdScore: number;
    reportConsultScore: number;
    educationScore: number;
  }) => {
    try {
      const managementExperienceLevel = Math.max(1, Math.min(5, Number(data.managementExperienceLevel) || 1));

      const validateScore = (value: number, fieldName: string) => {
        const numValue = Number(value);
        if (numValue < 1 || numValue > 4) {
          throw new Error(`${fieldName} must be between 1 and 4`);
        }
        return numValue;
      };

      const qcdScore = validateScore(data.qcdScore, 'QCD Score');
      const reportConsultScore = validateScore(data.reportConsultScore, 'Report/Consult Score');
      const educationScore = validateScore(data.educationScore, 'Education Score');


      const response = await fetch(`${apiUrl}/api/skills/management/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          managementExperienceLevel: managementExperienceLevel,
          qcdScore: qcdScore,
          reportConsultScore: reportConsultScore,
          educationScore: educationScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      await get().fetch_managementScoreData();

      return result;
    } catch (error) {
      console.error('Error updating management score:', error);
      throw error;
    }
  },

  // ========== LANGUAGE SKILLS CRUD ==========

  // GET - Fetch all language skills
  fetch_languageSkillData: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/language`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set(() => ({ languageSkill_data: data }));
    } catch (error) {
      console.error('Error fetching language skill data:', error);
      set(() => ({ languageSkill_data: [] }));
    }
  },

  // POST - Create a new language skill
  add_japaneseLevel: async (data: {
    employeeId: string;
    languageSkillLevel: number;
  }) => {
    try {
      const languageSkillLevel = Math.max(1, Math.min(5, Number(data.languageSkillLevel) || 1));

      const response = await fetch(`${apiUrl}/api/skills/language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          languageSkillLevel: languageSkillLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      await get().fetch_languageSkillData();

      return result;
    } catch (error) {
      console.error('Error creating language skill:', error);
      throw error;
    }
  },

  // PUT - Update a language skill
  update_japaneseLevel: async (id: number, data: {
    employeeId: string;
    languageSkillLevel: number;
  }) => {
    try {
      const languageSkillLevel = Math.max(1, Math.min(5, Number(data.languageSkillLevel) || 1));


      const response = await fetch(`${apiUrl}/api/skills/language/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          languageSkillLevel: languageSkillLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      await get().fetch_languageSkillData();

      return result;
    } catch (error) {
      console.error('Error updating language skill:', error);
      throw error;
    }
  },

  // ========== DEVELOPMENT CRUD ==========

  // GET - Fetch all development skills
  fetch_devCapData: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/development`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set(() => ({ devCap_data: data }));
    } catch (error) {
      console.error('Error fetching development data:', error);
      set(() => ({ devCap_data: [] }));
    }
  },

  // GET - Fetch development headers (types)
  fetch_devCapHeaders: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/development/types/active`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set(() => ({ devCap_headers: data }));
    } catch (error) {
      console.error('Error fetching development headers:', error);
      set(() => ({ devCap_headers: [] }));
    }
  },

  // POST - Create multiple development types (bulk)
  add_devCapHeaders: async (typeNames: string[]) => {
    try {
      const uniqueTypes = [...new Set(typeNames.filter(name => name.trim() !== ''))];

      if (uniqueTypes.length === 0) {
        throw new Error('No valid development types provided');
      }

      const requests = uniqueTypes.map(name => ({
        developmentTypeName: name.trim()
      }));


      const response = await fetch(`${apiUrl}/api/skills/development/types/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requests),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      await get().fetch_devCapHeaders();
      await get().fetch_devCapData();

      return result;
    } catch (error) {
      console.error('Error creating development types:', error);
      throw error;
    }
  },

  // POST - Create a new development skill
  add_devCapData: async (data: {
    employeeId: string;
    developmentTypeName: string;
    processName: string;
    yearsOfExperience: number;
  }) => {
    try {
      const yearsOfExperience = Math.max(0, Math.min(99.9, Number(data.yearsOfExperience) || 0));


      const response = await fetch(`${apiUrl}/api/skills/development`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          developmentTypeName: data.developmentTypeName.trim(),
          processName: data.processName.trim(),
          yearsOfExperience: yearsOfExperience,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      await get().fetch_devCapData();

      return result;
    } catch (error) {
      console.error('Error creating development skill:', error);
      throw error;
    }
  },

  // PUT - Update a development skill
  update_devCapData: async (id: number, data: {
    employeeId: string;
    developmentTypeName: string;
    processName: string;
    yearsOfExperience: number;
  }) => {
    try {
      const yearsOfExperience = Math.max(0, Math.min(99.9, Number(data.yearsOfExperience) || 0));


      const response = await fetch(`${apiUrl}/api/skills/development/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          developmentTypeName: data.developmentTypeName.trim(),
          processName: data.processName.trim(),
          yearsOfExperience: yearsOfExperience,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      await get().fetch_devCapData();

      return result;
    } catch (error) {
      console.error('Error updating development skill:', error);
      throw error;
    }
  },

  // ========== BULK DATA OPERATIONS ==========

  add_BulkLanguageSkills: async (data: LanguageSkill[]) => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/language/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Bulk language creation failed: ${response.status}`);
      await get().fetch_languageSkillData();
      return await response.json();
    } catch (error) {
      console.error('Error in bulk language creation:', error);
      throw error;
    }
  },

  add_BulkManagementSkills: async (data: ManagementScore[]) => {
    try {
      const response = await fetch(`${apiUrl}/api/skills/management/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Bulk management creation failed: ${response.status}`);
      await get().fetch_managementScoreData();
      return await response.json();
    } catch (error) {
      console.error('Error in bulk management creation:', error);
      throw error;
    }
  },

  add_BulkDevelopmentSkills: async (data: DevelopmentCapability[]) => {
    try {
      // The backend expects the data in the correct format for DevelopmentSkillDto
      // Make sure each item has the required fields
      const formattedData = data.map(item => ({
        employeeId: item.employeeId,
        developmentTypeName: item.developmentTypeName,
        processName: item.processName,
        yearsOfExperience: item.yearsOfExperience || 0,
      }));

      console.log('📤 Sending Bulk Development Data:', JSON.stringify(formattedData, null, 2));

      const response = await fetch(`${apiUrl}/api/skills/development/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Bulk Development API Error:', response.status, errorText);
        throw new Error(`Bulk development creation failed: ${response.status} - ${errorText}`);
      }

      await get().fetch_devCapData();
      return await response.json();
    } catch (error) {
      console.error('❌ Error in bulk development creation:', error);
      throw error;
    }
  },

add_BulkTechnicalSkills: async (data: TechnicalSkillData[]) => {
  try {
    // Remove skillId - backend doesn't need it
    const formattedData = data.map(item => ({
      employeeId: item.employeeId,
      skillName: item.skillName,  // ← ONLY required field!
      yearsOfExperience: item.yearsOfExperience || 0,
      experienceLevel: item.experienceLevel || "",
      // NO categoryName, NO subCategoryName, NO skillId!
    }));


    const response = await fetch(`${apiUrl}/api/skills/technical/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Bulk Technical API Error:', response.status, errorText);
      throw new Error(`Bulk technical creation failed: ${response.status} - ${errorText}`);
    }
    
    await get().fetch_SkillData();
    return await response.json();
  } catch (error) {
    console.error('Error in bulk technical creation:', error);
    throw error;
  }
},
});