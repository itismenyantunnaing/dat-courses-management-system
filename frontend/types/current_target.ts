export interface TargetDates {
  target_1_date: Date;
  target_2_date: Date;
}

export interface EmployeeJapaneseLevel {
  // Certified Levels
  jlpt_highest_level: string | null;
  other_japanese_level: string | null;
  preferred_learning_group: string | null;
  
  // Current Level
  current_communication_level: string | null;
  
  // Target 1 Levels
  target_1_jlpt_nat_level: string | null;
  target_1_communication_level: string | null;
  
  // Target 2 Levels
  target_2_jlpt_nat_level: string | null;
  target_2_communication_level: string | null;
  
  // Current Learning
  current_learning_level: string | null;
  learning_method: string | null;
  
  // JLPT Exam Target
  want_to_sit_exam: boolean;
  exam_target_level: string | null;
  confidence_level: string | null;
}
