import type { EmployeeProfile } from "@/types/employee";
import { EmployeeProfileStoreType } from "../types";

type StoreSet = (
  fn: (state: EmployeeProfileStoreType) => Partial<EmployeeProfileStoreType>
) => void;
type StoreGet = () => EmployeeProfileStoreType;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';


export const employeeProfileStore = (set: StoreSet, get: StoreGet): EmployeeProfileStoreType => ({
  profile: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  // Fetch employee profile
  fetch_EmployeeProfile: async (employeeId: string) => {
    if (!employeeId) {
      set(() => ({ profile: null, error: 'Employee ID is required' }));
      return;
    }

    set(() => ({ isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/employees/${employeeId}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Handle 403/401 specifically
        if (response.status === 403 || response.status === 401) {
          // Call logout server action
          const { logout } = await import('@/app/actions/auth');
          await logout(); // This will clear the session and redirect
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const profile: EmployeeProfile = data;

      set(() => ({ profile: profile, isLoading: false }));
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      set(() => ({
        profile: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      }));
    }
  },

  // Update employee profile with file upload (full update)
  update_EmployeeProfile: async (
    employeeId: string,
    formData: FormData
  ) => {
    if (!employeeId) {
      return 'Employee ID is required';
    }

    const previousProfile = get().profile;

    set(() => ({ isUpdating: true, error: null }));

    try {
      const response = await fetch(
        `${apiUrl}/api/employees/${employeeId}/profile/update`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const updatedProfile: EmployeeProfile = {
        employeeId: data.employeeId || employeeId,
        profilePhotoPath: data.profilePhotoPath || previousProfile?.profilePhotoPath || null,
        isCorePersonnel: data.employee?.is_core_personnel ?? previousProfile?.isCorePersonnel ?? false,
        hasJapanBusinessTrip: data.employee?.has_japan_business_trip ?? previousProfile?.hasJapanBusinessTrip ?? false,
        dob: data.employee?.dob || previousProfile?.dob || null,
      };

      set(() => ({
        profile: updatedProfile,
        isUpdating: false
      }));

      return data.message || 'Profile updated successfully';

    } catch (error) {
      console.error('Error updating employee profile:', error);

      set(() => ({
        profile: previousProfile,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      }));

      return `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Update employee profile fields (without file)
  update_EmployeeProfileFields: async (
    employeeId: string,
    fields: {
      isCorePersonnel?: boolean;
      hasJapanBusinessTrip?: boolean;
      dob?: string;
    }
  ) => {
    if (!employeeId) {
      return 'Employee ID is required';
    }

    const previousProfile = get().profile;

    set(() => ({ isUpdating: true, error: null }));

    try {
      const formData = new FormData();

      if (fields.isCorePersonnel !== undefined) {
        formData.append('isCorePersonnel', String(fields.isCorePersonnel));
      }
      if (fields.hasJapanBusinessTrip !== undefined) {
        formData.append('hasJapanBusinessTrip', String(fields.hasJapanBusinessTrip));
      }
      if (fields.dob) {
        formData.append('dob', fields.dob);
      }

      const response = await fetch(
        `${apiUrl}/api/employees/${employeeId}/profile/update`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const updatedProfile: EmployeeProfile = {
        employeeId: data.employeeId || employeeId,
        profilePhotoPath: data.profilePhotoPath || previousProfile?.profilePhotoPath || null,
        isCorePersonnel: data.employee?.is_core_personnel ?? fields.isCorePersonnel ?? previousProfile?.isCorePersonnel ?? false,
        hasJapanBusinessTrip: data.employee?.has_japan_business_trip ?? fields.hasJapanBusinessTrip ?? previousProfile?.hasJapanBusinessTrip ?? false,
        dob: data.employee?.dob || fields.dob || previousProfile?.dob || null,
      };

      set(() => ({
        profile: updatedProfile,
        isUpdating: false
      }));

      return data.message || 'Profile fields updated successfully';

    } catch (error) {
      console.error('Error updating employee profile fields:', error);

      set(() => ({
        profile: previousProfile,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      }));

      return `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Update profile image only
  update_ProfileImage: async (employeeId: string, file: File) => {
    if (!employeeId) {
      return 'Employee ID is required';
    }

    if (!file) {
      return 'File is required';
    }

    const previousProfile = get().profile;

    set(() => ({ isUpdating: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${apiUrl}/api/employees/${employeeId}/profile/update`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const updatedProfile: EmployeeProfile = {
        employeeId: data.employeeId || employeeId,
        profilePhotoPath: data.profilePhotoPath || null,
        isCorePersonnel: data.employee?.is_core_personnel ?? previousProfile?.isCorePersonnel ?? false,
        hasJapanBusinessTrip: data.employee?.has_japan_business_trip ?? previousProfile?.hasJapanBusinessTrip ?? false,
        dob: data.employee?.dob || previousProfile?.dob || null,
      };

      set(() => ({
        profile: updatedProfile,
        isUpdating: false
      }));

      return data.message || 'Profile image updated successfully';

    } catch (error) {
      console.error('Error updating profile image:', error);

      set(() => ({
        profile: previousProfile,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update profile image'
      }));

      return `Failed to update profile image: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete profile image and fetch updated profile
  delete_ProfileImage: async (employeeId: string) => {
    if (!employeeId) {
      return 'Employee ID is required';
    }

    const previousProfile = get().profile;

    set(() => ({ isUpdating: true, error: null }));

    try {
      const response = await fetch(
        `${apiUrl}/api/employees/${employeeId}/profile/image`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update local state with null photo path
      const updatedProfile: EmployeeProfile = {
        employeeId: data.employeeId || employeeId,
        profilePhotoPath: null,
        isCorePersonnel: previousProfile?.isCorePersonnel ?? false,
        hasJapanBusinessTrip: previousProfile?.hasJapanBusinessTrip ?? false,
        dob: previousProfile?.dob || null,
      };

      set(() => ({
        profile: updatedProfile,
        isUpdating: false
      }));

      // Fetch fresh profile data to ensure UI is in sync
      await get().fetch_EmployeeProfile(employeeId);

      return data.message || 'Profile image deleted successfully';

    } catch (error) {
      console.error('Error deleting profile image:', error);

      set(() => ({
        profile: previousProfile,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to delete profile image'
      }));

      return `Failed to delete profile image: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});