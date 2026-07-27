import type { Holiday } from "@/types/holiday"
import { Holiday_StoreType } from "../types"


type StoreSet = (
  fn: (state: Holiday_StoreType) => Partial<Holiday_StoreType>
) => void
type StoreGet = () => Holiday_StoreType
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const holidayDataStore = (set: StoreSet, get: StoreGet) => ({
  holiday_data: [],
  isCreating: false,

  fetch_HolidayData: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/holidays`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const holidayData = await response.json();
      set(() => ({ holiday_data: holidayData }));
    } catch (error) {
      console.error('Error fetching holiday data:', error);
      set(() => ({ holiday_data: [] }));
    }
  },

  add_HolidayData: async (newHoliday: Holiday) => {
    const previousData = get().holiday_data;

    // Check if a holiday with the same date already exists
    const existingHoliday = previousData.find(
      h => h.holidayDate === newHoliday.holidayDate
    );

    if (existingHoliday) {
      return `Holiday with date ${newHoliday.holidayDate} already exists.`;
    }

    // Create a copy with a generated temporary ID string so the UI doesn't crash
    const optimisticHoliday = {
      ...newHoliday,
      id: -Date.now()
    };

    // Immediately push the holiday with its temporary ID to the UI
    set(() => ({
      holiday_data: [...previousData, optimisticHoliday],
      isCreating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHoliday),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh to get the real ID from the server
      await get().fetch_HolidayData();

      return `Holiday created successfully`;

    } catch (error) {
      console.error('Error posting holiday data:', error);

      // Rollback to original state if the API fails
      set(() => ({
        holiday_data: previousData,
        isCreating: false
      }));

      return `Failed to create holiday: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete holiday 
  delete_HolidayData: async (holidayIds: number | number[]) => {
    const previousData = get().holiday_data;

    // Normalize input to always be an array of numbers
    const idsToDelete = Array.isArray(holidayIds) ? holidayIds : [holidayIds];
    const count = idsToDelete.length;

    // Optimistically filter out the deleted holidays immediately from the UI
    set(() => ({
      holiday_data: previousData.filter(h => h.id !== undefined && !idsToDelete.includes(h.id)),
    }));

    try {
      const idsPath = idsToDelete.join(',');

      const response = await fetch(`${apiUrl}/api/holidays/${idsPath}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response}`);
      }

      await response.json();

      const customMessage = count === 1
        ? `1 Holiday deleted successfully`
        : `${count} Holidays deleted successfully`;

      return customMessage;

    } catch (error) {
      console.error('Error deleting holiday data:', error);

      // Rollback to original state if the API completely fails
      set(() => ({
        holiday_data: previousData
      }));

      return `Failed to delete ${count === 1 ? 'holiday' : 'holidays'}`;
    }
  },

  // Update holiday
  update_HolidayData: async (id: number, updatedHoliday: Holiday) => {
    const previousData = get().holiday_data;

    // Check if holiday exists
    const existingHoliday = previousData.find(h => h.id === id);

    if (!existingHoliday) {
      return `Holiday with ID "${id}" not found.`;
    }

    // Check for duplicate date (if date is being changed)
    if (updatedHoliday.holidayDate && updatedHoliday.holidayDate !== existingHoliday.holidayDate) {
      const duplicateDate = previousData.find(
        h => h.holidayDate === updatedHoliday.holidayDate && h.id !== id
      );
      if (duplicateDate) {
        return `Holiday with date "${updatedHoliday.holidayDate}" already exists.`;
      }
    }

    // Optimistically update the holiday in the UI
    const updatedData = previousData.map((h) =>
      h.id === id ? { ...h, ...updatedHoliday } : h
    );

    set(() => ({
      holiday_data: updatedData,
      isUpdating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/holidays/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHoliday),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      await response.json();

      // Refresh to get the updated data from the server
      await get().fetch_HolidayData();

      return `Holiday "${existingHoliday.holidayName}" updated successfully.`;

    } catch (error) {
      console.error('Error updating holiday:', error);

      // Rollback to original state if the API fails
      set(() => ({
        holiday_data: previousData,
        isUpdating: false
      }));

      return `Failed to update holiday: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  bulkCreate_HolidayData: async (holidays: { holidayName: string; holidayDate: string }[]) => {
    const previousData = get().holiday_data;

    // Check if there are any existing holidays
    if (previousData.length > 0) {

      // Get all existing holiday IDs
      const existingIds = previousData
        .map(h => h.id)
        .filter((id): id is number => id !== undefined && id > 0);

      if (existingIds.length > 0) {
        try {
          // Wait a moment for the deletion to complete on the server
          await new Promise(resolve => setTimeout(resolve, 100));

          // Refresh data to ensure we have the latest state
          await get().fetch_HolidayData();
        } catch (deleteError) {
          console.error('❌ Error deleting existing holidays:', deleteError);
          throw new Error(`Failed to clear existing holidays: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`);
        }
      }
    }

    // Now proceed with bulk creation
    // Create optimistic items with temporary IDs
    const optimisticHolidays = holidays.map((h, index) => ({
      id: -Date.now() - index,
      holidayName: h.holidayName,
      holidayDate: h.holidayDate,
    }));

    // Optimistically add all holidays to the UI
    set(() => ({
      holiday_data: [...get().holiday_data, ...optimisticHolidays]
    }));

    try {
      const response = await fetch(`${apiUrl}/api/holidays/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(holidays),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      // Refresh the holiday data to get the actual IDs from the database
      await get().fetch_HolidayData();

      return `Successfully imported ${holidays.length} holidays`;

    } catch (error) {
      console.error('❌ Error bulk creating holidays:', error);

      // Rollback to original state if the API fails
      set(() => ({
        holiday_data: previousData
      }));

      throw error;
    }
  },
})