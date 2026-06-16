import { currentTarget_StoreType } from "../types"


const targetDate = [
  {
    target_1_date: new Date("2026-09-01T00:00:00.000Z"),
    target_2_date: new Date("2027-03-01T00:00:00.000Z")
  }
];

const japanese_levels = [
  {
    "jlpt_highest_level": "N2",
    "other_japanese_level": null,
    "preferred_learning_group": "Group A",
    "current_communication_level": "Intermediate",
    "target_1_jlpt_nat_level": "N1",
    "target_1_communication_level": "Advanced",
    "target_2_jlpt_nat_level": "N1",
    "target_2_communication_level": "Fluent",
    "current_learning_level": "N2",
    "learning_method": "Online/Zoom",
    "want_to_sit_exam": true,
    "exam_target_level": "N1",
    "confidence_level": "High"
  },
  {
    "jlpt_highest_level": "N3",
    "other_japanese_level": "Business Japanese",
    "preferred_learning_group": "Group B",
    "current_communication_level": "Beginner",
    "target_1_jlpt_nat_level": "N2",
    "target_1_communication_level": "Intermediate",
    "target_2_jlpt_nat_level": "N1",
    "target_2_communication_level": "Advanced",
    "current_learning_level": "N3",
    "learning_method": "In-person",
    "want_to_sit_exam": true,
    "exam_target_level": "N2",
    "confidence_level": "Medium"
  },
  {
    "jlpt_highest_level": null,
    "other_japanese_level": null,
    "preferred_learning_group": "Group C",
    "current_communication_level": "None",
    "target_1_jlpt_nat_level": "N5",
    "target_1_communication_level": "Beginner",
    "target_2_jlpt_nat_level": "N4",
    "target_2_communication_level": "Beginner",
    "current_learning_level": null,
    "learning_method": "Mobile App",
    "want_to_sit_exam": false,
    "exam_target_level": null,
    "confidence_level": null
  }
]



type StoreSet = (fn: (state: currentTarget_StoreType) => Partial<currentTarget_StoreType>) => void;
type StoreGet = () => currentTarget_StoreType;


export const currentTargetStore = (set: StoreSet, get: StoreGet) => ({
  fetch_TargetDates: async () => {
    set(() => ({ japaneseTargetDates_Data: targetDate }));
  },

  fetch_EmployeeJapaneseLevel: async () => {
    set(() => ({ employeeJapaneseLevel_Data: japanese_levels }));
  }
});