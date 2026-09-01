import type {
  DevelopmentCapability,
  EmployeeSkill,
  LanguageSkill,
  ManagementScore,
  SkillCategory,
} from "@/types/skillset"
import { SkillSet_StoreType } from "../types"
import type { TechnicalSkillData } from "@/components/drawers/skillset/skillsetForm"
import { getAuthToken } from "../mainStore"

type StoreSet = (
  fn: (state: SkillSet_StoreType) => Partial<SkillSet_StoreType>
) => void
type StoreGet = () => SkillSet_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const skillSetDataStore = (set: StoreSet, get: StoreGet) => ({
  dictionary: [],
  managementScores_Data: [],
  skillData: [],
  skill_headers: [],
  devCap_headers: [],
  devCap_data: [],
  languageSkill_data: [],

  // japanese dictionary
  fetch_dictionary: async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/japanese_dictionary`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      set(() => ({ dictionary: data }))
    } catch (error) {
      console.error("Error fetching dictionary data:", error)
      set(() => ({ dictionary: [] }))
    }
  },

  add_dictionary: async (entry: {
    japaneseText: string
    englishText: string
  }) => {
    try {
      if (!entry.japaneseText || !entry.englishText) {
        throw new Error("Both japaneseText and englishText are required")
      }

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/japanese_dictionary`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          japaneseText: entry.japaneseText.trim(),
          englishText: entry.englishText.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_dictionary()
      return result
    } catch (error) {
      console.error("Error creating dictionary entry:", error)
      throw error
    }
  },

  update_dictionary: async (
    id: number,
    entry: { japaneseText: string; englishText: string }
  ) => {
    try {
      if (!entry.japaneseText || !entry.englishText) {
        throw new Error("Both japaneseText and englishText are required")
      }

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/japanese_dictionary/${id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          japaneseText: entry.japaneseText.trim(),
          englishText: entry.englishText.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        if (response.status === 404) {
          throw new Error(`Dictionary entry with id ${id} not found`)
        }
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_dictionary()
      return result
    } catch (error) {
      console.error("Error updating dictionary entry:", error)
      throw error
    }
  },

  delete_dictionary: async (id: number) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/japanese_dictionary/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        if (response.status === 404) {
          throw new Error(`Dictionary entry with id ${id} not found`)
        }
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_dictionary()
      return result
    } catch (error) {
      console.error("Error deleting dictionary entry:", error)
      throw error
    }
  },

  // ========== SKILL HEADERS (TECHNICAL CATEGORIES) CRUD ==========

  fetch_SkillHeaders: async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(
        `${apiUrl}/api/skills/technical/categories`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      set(() => ({ skill_headers: data }))
    } catch (error) {
      console.error("Error fetching skill headers:", error)
      set(() => ({ skill_headers: [] }))
    }
  },

  update_SkillCategory: async (data: {
    id: number
    categoryName: string
    skillSubCategories?: Array<{
      id?: number
      subCategoryName: string
      skills?: Array<{
        id?: number
        skillName: string
      }>
    }>
  }): Promise<SkillCategory> => {
    try {
      const token = getAuthToken()
      const response = await fetch(
        `${apiUrl}/api/skills/technical/categories`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_SkillHeaders()
      return result as SkillCategory
    } catch (error) {
      console.error("Error updating skill category:", error)
      throw error
    }
  },

  add_BulkSkillCategories: async (
    data: Array<{
      categoryName: string
      skillSubCategories?: Array<{
        subCategoryName: string
        skills?: Array<{
          skillName: string
        }>
      }>
    }>
  ): Promise<SkillCategory[]> => {
    try {
      const token = getAuthToken()
      const response = await fetch(
        `${apiUrl}/api/skills/technical/categories/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_SkillHeaders()
      return result as SkillCategory[]
    } catch (error) {
      console.error("Error creating bulk skill categories:", error)
      throw error
    }
  },

  // ========== SKILL DATA (EMPLOYEE SKILLS) CRUD ==========

  fetch_SkillData: async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/technical`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      set(() => ({ skillData: data }))
    } catch (error) {
      console.error("Error fetching skill data:", error)
      set(() => ({ skillData: [] }))
    }
  },

  add_SkillData: async (data: {
    employeeId: string
    skillName: string
    categoryName?: string
    subCategoryName?: string
    yearsOfExperience: number
    experienceLevel: string
  }): Promise<EmployeeSkill> => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/technical`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_SkillData()
      return result as EmployeeSkill
    } catch (error) {
      console.error("Error creating employee skill:", error)
      throw error
    }
  },

  update_SkillData: async (
    id: number,
    data: {
      employeeId: string
      skillName: string
      categoryName?: string
      subCategoryName?: string
      yearsOfExperience: number
      experienceLevel: string
    }
  ): Promise<EmployeeSkill> => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/technical/${id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_SkillData()
      return result as EmployeeSkill
    } catch (error) {
      console.error("Error updating employee skill:", error)
      throw error
    }
  },

  // ========== MANAGEMENT SCORES CRUD ==========

  fetch_managementScoreData: async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/management`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      set(() => ({ managementScores_Data: data }))
    } catch (error) {
      console.error("Error fetching management score data:", error)
      set(() => ({ managementScores_Data: [] }))
    }
  },

  add_managementScoreData: async (data: {
    employeeId: string
    managementExperienceLevel: number
    qcdScore: number
    reportConsultScore: number
    educationScore: number
  }): Promise<ManagementScore> => {
    try {
      const managementExperienceLevel = Math.max(
        1,
        Math.min(5, Number(data.managementExperienceLevel) || 1)
      )

      const validateScore = (value: number, fieldName: string) => {
        const numValue = Number(value)
        if (numValue < 1 || numValue > 4) {
          throw new Error(`${fieldName} must be between 1 and 4`)
        }
        return numValue
      }

      const qcdScore = validateScore(data.qcdScore, "QCD Score")
      const reportConsultScore = validateScore(
        data.reportConsultScore,
        "Report/Consult Score"
      )
      const educationScore = validateScore(
        data.educationScore,
        "Education Score"
      )

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/management`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          managementExperienceLevel: managementExperienceLevel,
          qcdScore: qcdScore,
          reportConsultScore: reportConsultScore,
          educationScore: educationScore,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_managementScoreData()
      return result as ManagementScore
    } catch (error) {
      console.error("Error creating management score:", error)
      throw error
    }
  },

  update_managementScoreData: async (
    id: number,
    data: {
      employeeId: string
      managementExperienceLevel: number
      qcdScore: number
      reportConsultScore: number
      educationScore: number
    }
  ): Promise<ManagementScore> => {
    try {
      const managementExperienceLevel = Math.max(
        1,
        Math.min(5, Number(data.managementExperienceLevel) || 1)
      )

      const validateScore = (value: number, fieldName: string) => {
        const numValue = Number(value)
        if (numValue < 1 || numValue > 4) {
          throw new Error(`${fieldName} must be between 1 and 4`)
        }
        return numValue
      }

      const qcdScore = validateScore(data.qcdScore, "QCD Score")
      const reportConsultScore = validateScore(
        data.reportConsultScore,
        "Report/Consult Score"
      )
      const educationScore = validateScore(
        data.educationScore,
        "Education Score"
      )

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/management/${id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          managementExperienceLevel: managementExperienceLevel,
          qcdScore: qcdScore,
          reportConsultScore: reportConsultScore,
          educationScore: educationScore,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_managementScoreData()
      return result as ManagementScore
    } catch (error) {
      console.error("Error updating management score:", error)
      throw error
    }
  },

  // ========== LANGUAGE SKILLS CRUD ==========

  fetch_languageSkillData: async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/language`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      set(() => ({ languageSkill_data: data }))
    } catch (error) {
      console.error("Error fetching language skill data:", error)
      set(() => ({ languageSkill_data: [] }))
    }
  },

  add_japaneseLevel: async (data: {
    employeeId: string
    languageSkillLevel: number
  }): Promise<LanguageSkill> => {
    try {
      const languageSkillLevel = Math.max(
        1,
        Math.min(5, Number(data.languageSkillLevel) || 1)
      )

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/language`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          languageSkillLevel: languageSkillLevel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_languageSkillData()
      return result as LanguageSkill
    } catch (error) {
      console.error("Error creating language skill:", error)
      throw error
    }
  },

  update_japaneseLevel: async (
    id: number,
    data: {
      employeeId: string
      languageSkillLevel: number
    }
  ): Promise<LanguageSkill> => {
    try {
      const languageSkillLevel = Math.max(
        1,
        Math.min(5, Number(data.languageSkillLevel) || 1)
      )

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/language/${id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          languageSkillLevel: languageSkillLevel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_languageSkillData()
      return result as LanguageSkill
    } catch (error) {
      console.error("Error updating language skill:", error)
      throw error
    }
  },

  // ========== DEVELOPMENT CRUD ==========

  fetch_devCapData: async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/development`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      set(() => ({ devCap_data: data }))
    } catch (error) {
      console.error("Error fetching development data:", error)
      set(() => ({ devCap_data: [] }))
    }
  },

  fetch_devCapHeaders: async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(
        `${apiUrl}/api/skills/development/types/active`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      set(() => ({ devCap_headers: data }))
    } catch (error) {
      console.error("Error fetching development headers:", error)
      set(() => ({ devCap_headers: [] }))
    }
  },

  add_devCapHeaders: async (
    typeNames: string[]
  ): Promise<DevelopmentCapability[]> => {
    try {
      const uniqueTypes = [
        ...new Set(typeNames.filter((name) => name.trim() !== "")),
      ]

      if (uniqueTypes.length === 0) {
        throw new Error("No valid development types provided")
      }

      const requests = uniqueTypes.map((name) => ({
        developmentTypeName: name.trim(),
      }))

      const token = getAuthToken()
      const response = await fetch(
        `${apiUrl}/api/skills/development/types/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requests),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_devCapHeaders()
      await get().fetch_devCapData()
      return result as DevelopmentCapability[]
    } catch (error) {
      console.error("Error creating development types:", error)
      throw error
    }
  },

  add_devCapData: async (data: {
    employeeId: string
    developmentTypeName: string
    processName: string
    yearsOfExperience: number
  }): Promise<DevelopmentCapability> => {
    try {
      const yearsOfExperience = Math.max(
        0,
        Math.min(99.9, Number(data.yearsOfExperience) || 0)
      )

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/development`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          developmentTypeName: data.developmentTypeName.trim(),
          processName: data.processName.trim(),
          yearsOfExperience: yearsOfExperience,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_devCapData()
      return result as DevelopmentCapability
    } catch (error) {
      console.error("Error creating development skill:", error)
      throw error
    }
  },

  update_devCapData: async (
    id: number,
    data: {
      employeeId: string
      developmentTypeName: string
      processName: string
      yearsOfExperience: number
    }
  ): Promise<DevelopmentCapability> => {
    try {
      const yearsOfExperience = Math.max(
        0,
        Math.min(99.9, Number(data.yearsOfExperience) || 0)
      )

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/development/${id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: data.employeeId.trim(),
          developmentTypeName: data.developmentTypeName.trim(),
          processName: data.processName.trim(),
          yearsOfExperience: yearsOfExperience,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const result = await response.json()
      await get().fetch_devCapData()
      return result as DevelopmentCapability
    } catch (error) {
      console.error("Error updating development skill:", error)
      throw error
    }
  },

  // ========== BULK DATA OPERATIONS ==========

  add_BulkLanguageSkills: async (
    data: LanguageSkill[]
  ): Promise<LanguageSkill[]> => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/language/bulk`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok)
        throw new Error(`Bulk language creation failed: ${response.status}`)
      await get().fetch_languageSkillData()
      return (await response.json()) as LanguageSkill[]
    } catch (error) {
      console.error("Error in bulk language creation:", error)
      throw error
    }
  },

  add_BulkManagementSkills: async (
    data: ManagementScore[]
  ): Promise<ManagementScore[]> => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/management/bulk`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok)
        throw new Error(`Bulk management creation failed: ${response.status}`)
      await get().fetch_managementScoreData()
      return (await response.json()) as ManagementScore[]
    } catch (error) {
      console.error("Error in bulk management creation:", error)
      throw error
    }
  },

  add_BulkDevelopmentSkills: async (
    data: DevelopmentCapability[]
  ): Promise<DevelopmentCapability[]> => {
    try {
      const formattedData = data.map((item) => ({
        employeeId: item.employeeId,
        developmentTypeName: item.developmentTypeName,
        processName: item.processName,
        yearsOfExperience: item.yearsOfExperience || 0,
      }))

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/development/bulk`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          " Bulk Development API Error:",
          response.status,
          errorText
        )
        throw new Error(
          `Bulk development creation failed: ${response.status} - ${errorText}`
        )
      }

      await get().fetch_devCapData()
      return (await response.json()) as DevelopmentCapability[]
    } catch (error) {
      console.error(" Error in bulk development creation:", error)
      throw error
    }
  },

  add_BulkTechnicalSkills: async (
    data: TechnicalSkillData[]
  ): Promise<EmployeeSkill[]> => {
    try {
      const formattedData = data.map((item) => ({
        employeeId: item.employeeId,
        skillId: item.skillId,
        skillName: item.skillName,
        yearsOfExperience: item.yearsOfExperience || 0,
        experienceLevel: item.experienceLevel || "",
        categoryName: item.categoryName,
        subCategoryName: item.subCategoryName,
      }))

      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/skills/technical/bulk`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(" Bulk Technical API Error:", response.status, errorText)
        throw new Error(
          `Bulk technical creation failed: ${response.status} - ${errorText}`
        )
      }

      await get().fetch_SkillData()
      return (await response.json()) as EmployeeSkill[]
    } catch (error) {
      console.error("Error in bulk technical creation:", error)
      throw error
    }
  },
})
