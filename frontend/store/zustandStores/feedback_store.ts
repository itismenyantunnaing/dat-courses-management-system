import type { FeedbackSuggestionDto } from "@/types/feedback"
import { Feedback_StoreType } from "../types"

type StoreSet = (
  fn: (state: Feedback_StoreType) => Partial<Feedback_StoreType>
) => void
type StoreGet = () => Feedback_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const FeedbackDataStore = (set: StoreSet, get: StoreGet) => ({
  feedback: [],
  isCreating: false,
  isUpdating: false,
  isLoading: false,
  profile: [],

  // Helper method to refresh feedback based on user role
  refreshFeedbackData: async () => {
    const currentProfile = get().profile;
    const userRole = currentProfile?.role?.toLowerCase() || '';

    if (userRole === 'learner' && currentProfile?.id) {
      // Learner: fetch only their feedback
      await get().fetch_FeedbackByEmployeeId(currentProfile.id);
    } else {
      // Admin/Approver or any other role: fetch all feedback
      await get().fetch_FeedbackData();
    }
  },

  // Fetch all feedback
  fetch_FeedbackData: async () => {
    set(() => ({ isLoading: true }));
    try {
      const response = await fetch(`${apiUrl}/api/feedback`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const feedbackData = await response.json();
      set(() => ({ feedback: feedbackData, isLoading: false }));
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      set(() => ({ feedback: [], isLoading: false }));
    }
  },

  // Fetch feedback by employee ID
  fetch_FeedbackByEmployeeId: async (employeeId: string) => {
    set(() => ({ isLoading: true }));
    try {
      const response = await fetch(`${apiUrl}/api/feedback/employee/${employeeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const feedbackData = await response.json();
      set(() => ({ feedback: feedbackData, isLoading: false }));
    } catch (error) {
      console.error('Error fetching feedback by employee ID:', error);
      set(() => ({ feedback: [], isLoading: false }));
      return `Failed to fetch feedback for employee: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Add new feedback
  add_FeedbackData: async (newFeedback: FeedbackSuggestionDto) => {
    const previousData = get().feedback;

    // Validate required fields
    if (!newFeedback.employeeId || !newFeedback.category || !newFeedback.description) {
      return 'Employee ID, Category, and Description are required fields.';
    }

    // Create a copy with a generated temporary ID for optimistic UI
    const optimisticFeedback = {
      ...newFeedback,
      id: -Date.now()
    };

    // Immediately push the feedback with its temporary ID to the UI
    set(() => ({
      feedback: [...previousData, optimisticFeedback],
      isCreating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFeedback),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create feedback');
      }

      // ✅ Refresh based on user role
      await get().refreshFeedbackData();

      set(() => ({ isCreating: false }));
      return result.message || 'Feedback created successfully';

    } catch (error) {
      console.error('Error posting feedback data:', error);

      // Rollback to original state if the API fails
      set(() => ({
        feedback: previousData,
        isCreating: false
      }));

      return `Failed to create feedback: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Update feedback
  update_FeedbackData: async (id: number, updatedFeedback: FeedbackSuggestionDto) => {
    const previousData = get().feedback;

    // Check if feedback exists
    const existingFeedback = previousData.find(f => f.id === id);

    if (!existingFeedback) {
      return `Feedback with ID "${id}" not found.`;
    }

    // Validate required fields
    if (!updatedFeedback.employeeId || !updatedFeedback.category || !updatedFeedback.description) {
      return 'Employee ID, Category, and Description are required fields.';
    }

    // Optimistically update the feedback in the UI
    const updatedData = previousData.map((f) =>
      f.id === id ? { ...f, ...updatedFeedback } : f
    );

    set(() => ({
      feedback: updatedData,
      isUpdating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFeedback),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update feedback');
      }

      // ✅ Refresh based on user role
      await get().refreshFeedbackData();

      set(() => ({ isUpdating: false }));
      return result.message || `Feedback updated successfully.`;

    } catch (error) {
      console.error('Error updating feedback:', error);

      // Rollback to original state if the API fails
      set(() => ({
        feedback: previousData,
        isUpdating: false
      }));

      return `Failed to update feedback: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete feedback
  delete_FeedbackData: async (feedbackIds: number | number[]) => {
    const previousData = get().feedback;

    // Normalize input to always be an array of numbers
    const idsToDelete = Array.isArray(feedbackIds) ? feedbackIds : [feedbackIds];
    const count = idsToDelete.length;

    // Optimistically filter out the deleted feedback immediately from the UI
    set(() => ({
      feedback: previousData.filter(f => f.id !== undefined && !idsToDelete.includes(f.id)),
    }));

    try {
      // Delete one by one since the backend endpoint expects single ID
      const deletePromises = idsToDelete.map(id =>
        fetch(`${apiUrl}/api/feedback/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      );

      const responses = await Promise.all(deletePromises);

      // Check if any deletion failed
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        throw new Error(`Failed to delete ${failedResponses.length} feedback entries`);
      }

      // ✅ Refresh based on user role
      await get().refreshFeedbackData();

      const customMessage = count === 1
        ? `1 Feedback deleted successfully`
        : `${count} Feedback entries deleted successfully`;

      return customMessage;

    } catch (error) {
      console.error('Error deleting feedback data:', error);

      // Rollback to original state if the API fails
      set(() => ({
        feedback: previousData
      }));

      return `Failed to delete ${count === 1 ? 'feedback' : 'feedbacks'}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },



  // Set profile in store (call this when profile is loaded)
  setProfile: (profile: any) => {
    set(() => ({ profile }));
  },

  // Clear feedback data (useful for cleanup)
  clear_FeedbackData: () => {
    set(() => ({
      feedback: [],
      isCreating: false,
      isUpdating: false,
      isLoading: false
    }));
  }
});