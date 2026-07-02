import type { EmployeeJapaneseLevel, TargetDates } from "@/types/current_target";
import { CurrentTarget_StoreType } from "../types"

type StoreSet = (fn: (state: CurrentTarget_StoreType) => Partial<CurrentTarget_StoreType>) => void;
type StoreGet = () => CurrentTarget_StoreType;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085';

export const currentTargetStore = (set: StoreSet, get: StoreGet) => ({
  japaneseTargetDates_Data: [],
  employeeJapaneseLevel_Data: [],
  isLoading: false,
  error: null,

  // Fetch Target Dates
  fetch_TargetDates: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/target-terms`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      set(() => ({ japaneseTargetDates_Data: data }));

      return data;

    } catch (error) {
      console.error('Error fetching employee Japanese target dates:', error);
      set(() => ({ japaneseTargetDates_Data: [] }));
      return [];
    }
  },

  // Add/Create Target Dates
  add_TargetDates: async (data: TargetDates) => {
    try {
      const response = await fetch(`${apiUrl}/api/target-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const newTerm = await response.json();

      // Update the state with the new target dates
      const currentData = get().japaneseTargetDates_Data || [];
      set(() => ({
        japaneseTargetDates_Data: [...currentData, newTerm],
        isLoading: false
      }));

      console.log('✅ Successfully created target dates:', newTerm);

      return `Target dates created successfully`;

    } catch (error) {
      console.error('Error creating target dates:', error);
      return `Failed to create target dates: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Update Target Dates
  update_TargetDates: async (id: number, data: TargetDates) => {
    try {
      const response = await fetch(`${apiUrl}/api/target-terms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const updatedTerm = await response.json();

      const currentData = get().japaneseTargetDates_Data;
      const updatedData = currentData.map((item: TargetDates) =>
        item.id === id ? updatedTerm : item
      );

      set(() => ({
        japaneseTargetDates_Data: updatedData,
        isLoading: false
      }));


      return `Target dates updated successfully`;

    } catch (error) {
      console.error('Error updating target dates:', error);
      return `Failed to update target dates: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },



  fetch_EmployeeJapaneseLevel: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/employee-japanese-profiles`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      set(() => ({ employeeJapaneseLevel_Data: data }));
      return data;
    } catch (error) {
      console.error('Error fetching employee Japanese profiles:', error);
      set(() => ({
        employeeJapaneseLevel_Data: [],
      }));
      return [];
    }
  },

  // Add/Create Employee Japanese Profile
  add_EmployeeJapaneseLevel: async (data: EmployeeJapaneseLevel) => {
    const { employeeId } = data;

    try {
      const response = await fetch(`${apiUrl}/api/employee-japanese-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const newProfile = await response.json();

      // Update the state with the new profile
      const currentData = get().employeeJapaneseLevel_Data || [];
      set(() => ({
        employeeJapaneseLevel_Data: [...currentData, newProfile],
        isLoading: false
      }));

      return `Successfully created Japanese profile for employee "${employeeId}"`;

    } catch (error) {
      return `Failed to create Japanese profile for employee "${employeeId}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Edit/Update Employee Japanese Profile
  edit_EmployeeJapaneseLevel: async (id: number, data: EmployeeJapaneseLevel) => {
    const { employeeId } = data;

    try {
      const response = await fetch(`${apiUrl}/api/employee-japanese-profiles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const updatedProfile = await response.json();

      // Update the state with the updated profile
      const currentData = get().employeeJapaneseLevel_Data || [];
      const updatedData = currentData.map((item: EmployeeJapaneseLevel) =>
        item.id === id ? updatedProfile : item
      );
      set(() => ({
        employeeJapaneseLevel_Data: updatedData,
        isLoading: false
      }));

      console.log('✅ Successfully updated Japanese profile:', updatedProfile);

      return `Successfully updated Japanese profile for employee "${employeeId}"`;

    } catch (error) {
      console.error('Error updating Japanese profile:', error);

      // Return error message instead of throwing
      return `Failed to update Japanese profile for employee "${employeeId}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete single profile by ID
  delete_singleJapaneseLevel: async (id: number) => {
    const previousData = get().employeeJapaneseLevel_Data || [];

    // Optimistically remove the deleted profile from the UI
    const optimisticData = previousData.filter((item: EmployeeJapaneseLevel) => item.id !== id);

    set(() => ({
      employeeJapaneseLevel_Data: optimisticData,
      isDeleting: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/employee-japanese-profiles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      set(() => ({
        employeeJapaneseLevel_Data: optimisticData,
        isDeleting: false
      }));

      console.log(`✅ Successfully deleted profile with ID: ${id}`);

      return `1 Japanese profile deleted successfully`;

    } catch (error) {
      console.error('Error deleting employee Japanese profile:', error);

      // Rollback to original state if the API fails
      set(() => ({
        employeeJapaneseLevel_Data: previousData,
        isDeleting: false
      }));

      return `Failed to delete Japanese profile: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete multiple profiles by IDs (Bulk Delete)
  delete_bulkJapaneseLevel: async (ids: number[]) => {
    const previousData = get().employeeJapaneseLevel_Data || [];
    const count = ids.length;

    // Optimistically remove the deleted profiles from the UI
    const idSet = new Set(ids);
    const optimisticData = previousData.filter((item: EmployeeJapaneseLevel) => !idSet.has(item.id));

    set(() => ({
      employeeJapaneseLevel_Data: optimisticData,
      isDeleting: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/employee-japanese-profiles`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ids),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      set(() => ({
        employeeJapaneseLevel_Data: optimisticData,
        isDeleting: false
      }));

      // Return success message based on count
      const customMessage = count === 1
        ? `1 Japanese profile deleted successfully`
        : `${count} Japanese profiles deleted successfully`;

      return customMessage;

    } catch (error) {
      console.error('Error deleting employee Japanese profiles:', error);

      // Rollback to original state if the API fails
      set(() => ({
        employeeJapaneseLevel_Data: previousData,
        isDeleting: false
      }));

      return `Failed to delete ${count === 1 ? 'Japanese profile' : 'Japanese profiles'}`;
    }
  },

  // Delete profile by Employee ID
  deleteEmployeeJapaneseProfileByEmployeeId: async (employeeId: string) => {
    const previousData = get().employeeJapaneseLevel_Data || [];

    // Optimistically remove the deleted profile from the UI
    const optimisticData = previousData.filter((item: EmployeeJapaneseLevel) => item.employeeId !== employeeId);

    set(() => ({
      employeeJapaneseLevel_Data: optimisticData,
      isDeleting: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/employee-japanese-profiles/employee/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      set(() => ({
        employeeJapaneseLevel_Data: optimisticData,
        isDeleting: false
      }));

      console.log(`✅ Successfully deleted profile for employee: ${employeeId}`);

      return `Japanese profile for employee "${employeeId}" deleted successfully`;

    } catch (error) {
      console.error('Error deleting employee Japanese profile by employee ID:', error);

      // Rollback to original state if the API fails
      set(() => ({
        employeeJapaneseLevel_Data: previousData,
        isDeleting: false
      }));

      return `Failed to delete Japanese profile for employee "${employeeId}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

// Bulk Import Japanese Profiles - Remove internal batching
bulkCreate_CurrentTargetData: async (data: EmployeeJapaneseLevel[]) => {
    console.log(`📦 Bulk importing ${data.length} Japanese profiles...`);

    if (!data || data.length === 0) {
        console.warn('⚠️ No data to import');
        return 'No data to import';
    }

    try {
        const mainStore = (window as any).mainStore?.getState?.();
        const token = mainStore?.getToken?.() || mainStore?.session?.token || null;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Single API call - no internal batching
        const response = await fetch(`${apiUrl}/api/employee-japanese-profiles/import`, {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify(data),
        });

        // Handle 403 - try individual records
        if (response.status === 403) {
            console.warn(`⚠️ 403 Forbidden - trying individual records`);
            let successCount = 0;
            for (const record of data) {
                try {
                    const indResponse = await fetch(`${apiUrl}/api/employee-japanese-profiles/import`, {
                        method: 'POST',
                        headers: headers,
                        credentials: 'include',
                        body: JSON.stringify([record]),
                    });
                    if (indResponse.ok) {
                        successCount++;
                    }
                } catch (e) {
                    console.error('❌ Failed to import record');
                }
            }
            // Refresh data
            try {
                await get().fetch_EmployeeJapaneseLevel();
            } catch (refreshError) {
                console.warn('⚠️ Could not refresh profiles:', refreshError);
            }
            return `${successCount} out of ${data.length} Japanese profiles imported successfully`;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        let importedBatch = [];
        try {
            importedBatch = await response.json();
        } catch (e) {
            console.warn('⚠️ Could not parse response');
            importedBatch = [];
        }

        // Refresh data
        try {
            await get().fetch_EmployeeJapaneseLevel();
        } catch (refreshError) {
            console.warn('⚠️ Could not refresh profiles:', refreshError);
        }

        return `${importedBatch.length || data.length} Japanese profiles imported successfully`;

    } catch (error: any) {
        console.error('❌ Error during bulk import:', error);
        throw error;
    }
},
});