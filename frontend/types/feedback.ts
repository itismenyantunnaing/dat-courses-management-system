export interface FeedbackSuggestionDto {
  id?: number;
  employeeId: string;
  subject: string;
  description: string;
  status?: string;
  employeeName?: string;
  department?: string;
  team?: string;
  profilePhotoPath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: FeedbackSuggestionDto;
  errors?: Record<string, string>;
}