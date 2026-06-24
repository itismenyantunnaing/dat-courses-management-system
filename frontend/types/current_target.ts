// types/current_target.ts

export interface TargetDates {
  id?: number;
  target1Date: Date | string;
  target2Date: Date | string;
  examDate?: Date | string;
  isActive?: boolean;
}

export interface EmployeeJapaneseLevel {
  id: number;
  employeeId?: string;
  employee_id?: string;

  // Certified Levels
  jlptHighestLevel: string | null;
  otherJapaneseLevel: string | null;
  preferredLearningGroup: string | null;

  // Current Level
  currentCommunicationLevel: string | null;

  // Target 1 Levels
  target1JlptNatLevel: string | null;
  target1CommunicationLevel: string | null;

  // Target 2 Levels
  target2JlptNatLevel: string | null;
  target2CommunicationLevel: string | null;

  // Current Learning
  currentLearningLevel: string | null;
  learningMethod: string | null;

  // JLPT Exam Target
  wantToSitExam: boolean;
  examTargetLevel: string | null;
  jlptNatTest: string | null;
  confidenceLevel: string | null;
}