import type { AnnouncementDto } from "@/types/announcement"

type StoreSet = (fn: (state: any) => Partial<any>) => void
type StoreGet = () => any

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const AnnouncementDataStore = (set: StoreSet, get: StoreGet) => ({
  announcements: [],
  isCreating: false,
  isUpdating: false,
  isLoading: false,

  // Fetch all announcements
  fetch_AnnouncementData: async () => {
    set(() => ({ isLoading: true }));
    try {
      const response = await fetch(`${apiUrl}/api/announcements`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const announcementData = await response.json();
      set(() => ({ announcements: announcementData, isLoading: false }));
      return announcementData;
    } catch (error) {
      console.error('Error fetching announcement data:', error);
      set(() => ({ announcements: [], isLoading: false }));
      return [];
    }
  },

  // Add new announcement
  add_AnnouncementData: async (newAnnouncement: AnnouncementDto) => {
    const previousData = get().announcements;
    const currentProfile = get().profile;
    const employeeName = currentProfile?.name || 'Unknown User';

    // ✅ Set createdBy from profile
    const announcementWithCreator = {
      ...newAnnouncement,
      createdBy: employeeName,
    };

    // Validate required fields
    if (!announcementWithCreator.title || !announcementWithCreator.text || !announcementWithCreator.category) {
      return 'Title, Text, and Category are required fields.';
    }

    // Create a copy with a generated temporary ID for optimistic UI
    const optimisticAnnouncement = {
      ...announcementWithCreator,
      id: -Date.now()
    };

    set(() => ({
      announcements: [...previousData, optimisticAnnouncement],
      isCreating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementWithCreator),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create announcement');
      }

      // Refresh data
      await get().fetch_AnnouncementData();

      set(() => ({ isCreating: false }));
      return result.message || 'Announcement created successfully';

    } catch (error) {
      console.error('Error posting announcement data:', error);

      set(() => ({
        announcements: previousData,
        isCreating: false
      }));

      return `Failed to create announcement: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete announcement
  delete_AnnouncementData: async (announcementIds: number | number[]) => {
    const previousData = get().announcements;

    const idsToDelete = Array.isArray(announcementIds) ? announcementIds : [announcementIds];
    const count = idsToDelete.length;

    set(() => ({
      announcements: previousData.filter((a: any) => a.id !== undefined && !idsToDelete.includes(a.id)),
    }));

    try {
      const deletePromises = idsToDelete.map(id => 
        fetch(`${apiUrl}/api/announcements/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      );

      const responses = await Promise.all(deletePromises);
      
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        throw new Error(`Failed to delete ${failedResponses.length} announcement entries`);
      }

      await get().fetch_AnnouncementData();

      return `${count} Announcement${count > 1 ? 's' : ''} deleted successfully`;

    } catch (error) {
      console.error('Error deleting announcement data:', error);

      set(() => ({
        announcements: previousData
      }));

      return `Failed to delete announcement: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Update announcement
  update_AnnouncementData: async (id: number, updatedAnnouncement: AnnouncementDto) => {
    const previousData = get().announcements;

    const existingAnnouncement = previousData.find((a: any) => a.id === id);

    if (!existingAnnouncement) {
      return `Announcement with ID "${id}" not found.`;
    }

    if (!updatedAnnouncement.title || !updatedAnnouncement.text || !updatedAnnouncement.category) {
      return 'Title, Text, and Category are required fields.';
    }

    const updatedData = previousData.map((a: any) =>
      a.id === id ? { ...a, ...updatedAnnouncement } : a
    );

    set(() => ({
      announcements: updatedData,
      isUpdating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAnnouncement),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update announcement');
      }

      await get().fetch_AnnouncementData();

      set(() => ({ isUpdating: false }));
      return result.message || `Announcement updated successfully.`;

    } catch (error) {
      console.error('Error updating announcement:', error);

      set(() => ({
        announcements: previousData,
        isUpdating: false
      }));

      return `Failed to update announcement: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  clear_AnnouncementData: () => {
    set(() => ({
      announcements: [],
      isCreating: false,
      isUpdating: false,
      isLoading: false
    }));
  }
});