// store/employee_data_store.ts
import { Employee_StoreType } from "../types"
import { Employee } from "@/types/employee";
import { logout } from "@/app/actions/auth"


type StoreSet = (
  fn: (state: Employee_StoreType) => Partial<Employee_StoreType>
) => void
type StoreGet = () => Employee_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085';

export const employeeDataStore = (set: StoreSet, get: StoreGet) => ({
  profile: [],
  roles: [],
  divisions: [],
  dat_departments: [],
  teams: [],
  employee_data: [],
  isCreating: false,
  isDeleting: false,

  // Dynamic options that will be populated from employee data
  division_options: [],
  department_options: [],
  team_options: [],
  role_options: [],

  fetch_profile: async (userId?: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/employees/${userId}/profile`);

      if (!response.ok) {
        try {
          await logout()
        } catch (error) {
          console.error("Logout failed:", error)
        }
        return
      }

      const data = await response.json();
      set(() => ({ profile: data }))
    } catch (error) {
      console.error('Error fetching profile data:', error);
      set(() => ({ profile: [] }))
    }
  },

  fetch_roles: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/roles`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      set(() => ({ roles: data }))
    } catch (error) {
      console.error('Error fetching roles data:', error);
      set(() => ({ roles: [] }))
    }
  },

  fetch_divisions: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/divisions`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      set(() => ({ divisions: data }))
    } catch (error) {
      console.error('Error fetching division data:', error);
      set(() => ({ divisions: [] }));
    }
  },

  fetch_dat_departments: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/departments-dat`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      set(() => ({ dat_departments: data }))
    } catch (error) {
      console.error('Error fetching division data:', error);
      set(() => ({ dat_departments: [] }));
    }
  },


  fetch_teams: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/teams`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      set(() => ({ teams: data }))
    } catch (error) {
      console.error('Error fetching division data:', error);
      set(() => ({ teams: [] }));
    }
  },


  add_division: async (divisionName: string) => {

    try {
      const response = await fetch(`${apiUrl}/api/divisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ divisionName: divisionName.trim() }),
      });


      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      // Parse response if it's JSON
      const data = responseText ? JSON.parse(responseText) : null;

      // Refresh divisions list
      await get().fetch_divisions();
      return {
        success: true,
        data: data,
      };

    } catch (error) {
      console.error('❌ Error creating division:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create division'
      };
    }
  },


  add_dat_department: async (divisionId: number, deptName: string) => {
    console.log('📝 add_dat_department called with:', { divisionId, deptName });

    // Validate input
    if (!divisionId) {
      console.error('❌ Division ID is required');
      return {
        success: false,
        error: 'Division ID is required'
      };
    }

    if (!deptName || deptName.trim() === '') {
      console.error('❌ Department name is required');
      return {
        success: false,
        error: 'Department name is required'
      };
    }

    try {
      const response = await fetch(`${apiUrl}/api/departments-dat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          divisionId: divisionId,
          deptName: deptName.trim()
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      // Parse response if it's JSON
      const data = responseText ? JSON.parse(responseText) : null;
      console.log('✅ Department created successfully:', data);

      // Refresh departments list
      await get().fetch_dat_departments();

      return {
        success: true,
        data: data,
        message: `Department "${deptName.trim()}" created successfully`
      };

    } catch (error) {
      console.error('❌ Error creating department:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create department'
      };
    }
  },

  add_team: async (departmentDatId: number, teamName: string) => {
    console.log('📝 add_team called with:', { departmentDatId, teamName });

    // Validate input
    if (!departmentDatId) {
      console.error('❌ Department ID is required');
      return {
        success: false,
        error: 'Department ID is required'
      };
    }

    if (!teamName || teamName.trim() === '') {
      console.error('❌ Team name is required');
      return {
        success: false,
        error: 'Team name is required'
      };
    }

    try {
      const response = await fetch(`${apiUrl}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          departmentDatId: departmentDatId,
          teamName: teamName.trim()
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      // Parse response if it's JSON
      const data = responseText ? JSON.parse(responseText) : null;
      console.log('✅ Team created successfully:', data);

      // Refresh teams list
      await get().fetch_teams();

      return {
        success: true,
        data: data,
        message: `Team "${teamName.trim()}" created successfully`
      };

    } catch (error) {
      console.error('❌ Error creating team:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create team'
      };
    }
  },

  update_division: async (id: number, divisionName: string) => {
    console.log('📝 update_division called with:', { id, divisionName });

    // Validate input
    if (!id) {
      return {
        success: false,
        error: 'Division ID is required'
      };
    }

    if (!divisionName || divisionName.trim() === '') {
      return {
        success: false,
        error: 'Division name is required'
      };
    }

    try {
      const response = await fetch(`${apiUrl}/api/divisions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ divisionName: divisionName.trim() }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      // Parse response if it's JSON
      const data = responseText ? JSON.parse(responseText) : null;
      console.log('✅ Division updated successfully:', data);

      // Refresh divisions list
      await get().fetch_divisions();

      return {
        success: true,
        data: data,
        message: `Division updated successfully`
      };

    } catch (error) {
      console.error('❌ Error updating division:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update division'
      };
    }
  },

  update_department: async (id: number, divisionId: number, deptName: string) => {
    if (!id) {
      return { success: false, error: 'Department ID is required' };
    }
    if (!divisionId) {
      return { success: false, error: 'Division ID is required' };
    }
    if (!deptName || deptName.trim() === '') {
      return { success: false, error: 'Department name is required' };
    }

    try {
      const response = await fetch(`${apiUrl}/api/departments-dat/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisionId: divisionId,
          deptName: deptName.trim()
        }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      const data = responseText ? JSON.parse(responseText) : null;
      await get().fetch_dat_departments();

      return {
        success: true,
        data: data,
        message: `Department updated successfully`
      };
    } catch (error) {
      console.error('❌ Error updating department:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update department'
      };
    }
  },


  update_team: async (id: number, departmentDatId: number, teamName: string) => {
    if (!id) {
      return { success: false, error: 'Team ID is required' };
    }
    if (!departmentDatId) {
      return { success: false, error: 'Department ID is required' };
    }
    if (!teamName || teamName.trim() === '') {
      return { success: false, error: 'Team name is required' };
    }

    try {
      const response = await fetch(`${apiUrl}/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentDatId: departmentDatId,
          teamName: teamName.trim()
        }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      const data = responseText ? JSON.parse(responseText) : null;
      console.log('✅ Team updated successfully:', data);

      // Refresh teams list
      await get().fetch_teams();

      return {
        success: true,
        data: data,
        message: `Team updated successfully`
      };
    } catch (error) {
      console.error('❌ Error updating team:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update team'
      };
    }
  },

  fetch_EmployeeData: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/employees`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const employeeData = await response.json();
      set(() => ({ employee_data: employeeData }));

    } catch (error) {
      console.error('Error fetching employee data:', error);
      set(() => ({ employee_data: [] }));
    }
  },

  // Add employee 
  add_EmployeeData: async (newEmployee: Employee) => {
    const previousData = get().employee_data;

    // Check for duplicates
    const duplicateId = previousData.find(emp => emp.id === newEmployee.id);
    const duplicateEmail = previousData.find(emp => emp.email === newEmployee.email);
    const duplicateDoorlog = previousData.find(emp => emp.doorlog === newEmployee.doorlog);

    // Return appropriate error messages
    if (duplicateId) {
      return `Employee with ID "${newEmployee.id}" already exists.`;
    }

    if (duplicateEmail) {
      return `Employee with email "${newEmployee.email}" already exists.`;
    }

    if (duplicateDoorlog) {
      return `Employee with doorlog "${newEmployee.doorlog}" already exists.`;
    }

    // Create a copy with a generated temporary ID
    const optimisticEmployee = {
      ...newEmployee,
      id: `temp-${Date.now()}`
    };

    // Immediately push the employee with temporary ID to the UI
    set(() => ({
      employee_data: [...previousData, optimisticEmployee],
      isCreating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();

      // Optionally refresh to get the real ID from the server
      await get().fetch_EmployeeData();
      set(() => ({ isCreating: false }));

      return `Employee created successfully`;

    } catch (error) {

      // Rollback to original state if the API fails
      set(() => ({
        employee_data: previousData,
        isCreating: false
      }));

      return `Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  // Delete employees
  delete_EmployeeData: async (employeeIds: string | string[]) => {
    const previousData = get().employee_data;

    // Normalize input to always be an array
    const idsToDelete = Array.isArray(employeeIds) ? employeeIds : [employeeIds];
    const count = idsToDelete.length;

    // Optimistically filter out the deleted employees immediately from the UI
    set(() => ({
      employee_data: previousData.filter(emp => !idsToDelete.includes(emp.id)),
      isDeleting: true
    }));

    try {
      const idsPath = idsToDelete.join(',');

      const response = await fetch(`${apiUrl}/api/employees/${idsPath}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();

      // Update options after successful delete
      const updatedData = get().employee_data;
      const divisions = [...new Set(updatedData.map((emp: Employee) => emp.div_name).filter(Boolean))]
        .map((div) => ({ value: div, label: div }));
      const departments = [...new Set(updatedData.map((emp: Employee) => emp.dept_dat).filter(Boolean))]
        .map((dept) => ({ value: dept, label: dept }));
      const teams = [...new Set(updatedData.map((emp: Employee) => emp.team).filter(Boolean))]
        .map((team) => ({ value: team, label: team }));
      const roles = [...new Set(updatedData.map((emp: Employee) => emp.role).filter(Boolean))]
        .map((role) => ({ value: role, label: role }));

      set(() => ({
        division_options: divisions,
        department_options: departments,
        team_options: teams,
        role_options: roles,
        isDeleting: false
      }));

      // Return success message based on count
      const customMessage = count === 1
        ? `1 Employee deleted successfully`
        : `${count} Employees deleted successfully`;

      return customMessage;

    } catch (error) {
      console.error('Error deleting employee data:', error);

      // Rollback to original state if the API fails
      set(() => ({
        employee_data: previousData,
        isDeleting: false
      }));

      return `Failed to delete ${count === 1 ? 'employee' : 'employees'}`;
    }
  },

  // Update employee
  update_EmployeeData: async (id: string, updatedEmployee: Employee) => {
    console.log('🔍 update_EmployeeData called with:', { id, updatedEmployee });

    const previousData = get().employee_data;
    console.log('📊 Previous data count:', previousData.length);

    // Check if employee exists
    const existingEmployee = previousData.find(emp => emp.id === id);
    console.log('👤 Existing employee:', existingEmployee);

    if (!existingEmployee) {
      return `Employee with ID "${id}" not found.`;
    }

    // Check for duplicate email (if email is being changed)
    if (updatedEmployee.email && updatedEmployee.email !== existingEmployee.email) {
      const duplicateEmail = previousData.find(
        emp => emp.email === updatedEmployee.email && emp.id !== id
      );
      if (duplicateEmail) {
        return `Employee with email "${updatedEmployee.email}" already exists.`;
      }
    }

    // Check for duplicate doorlog (if doorlog is being changed)
    if (updatedEmployee.doorlog && updatedEmployee.doorlog !== existingEmployee.doorlog) {
      const duplicateDoorlog = previousData.find(
        emp => emp.doorlog === updatedEmployee.doorlog && emp.id !== id
      );
      if (duplicateDoorlog) {
        return `Employee with doorlog "${updatedEmployee.doorlog}" already exists.`;
      }
    }

    // Optimistically update the employee item in the UI state instantly
    const updatedData = previousData.map((emp) =>
      emp.id === id ? { ...emp, ...updatedEmployee } : emp
    );

    set(() => ({
      employee_data: updatedData,
      isUpdating: true
    }));

    try {
      const response = await fetch(`${apiUrl}/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEmployee),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseData = await response.json();

      // Update options after successful update
      const finalData = get().employee_data;
      const divisions = [...new Set(finalData.map((emp: Employee) => emp.div_name).filter(Boolean))]
        .map((div) => ({ value: div, label: div }));
      const departments = [...new Set(finalData.map((emp: Employee) => emp.dept_dat).filter(Boolean))]
        .map((dept) => ({ value: dept, label: dept }));
      const teams = [...new Set(finalData.map((emp: Employee) => emp.team).filter(Boolean))]
        .map((team) => ({ value: team, label: team }));
      const roles = [...new Set(finalData.map((emp: Employee) => emp.role).filter(Boolean))]
        .map((role) => ({ value: role, label: role }));

      set(() => ({
        division_options: divisions,
        department_options: departments,
        team_options: teams,
        role_options: roles,
        isUpdating: false
      }));

      return `Employee "${existingEmployee.name}" updated successfully.`;

    } catch (error) {
      console.error('❌ Error updating employee data:', error);

      // Rollback to original state if the API fails
      set(() => ({
        employee_data: previousData,
        isUpdating: false
      }));

      return `Failed to update employee: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },


  // Bulk delete employees
  bulkDelete_EmployeeData: async (employeeIds: string[]) => {
    const previousData = get().employee_data;

    // Optimistically filter out the deleted employees
    set(() => ({
      employee_data: previousData.filter(emp => !employeeIds.includes(emp.id)),
      isDeleting: true
    }));

    try {
      const idsPath = employeeIds.join(',');

      const response = await fetch(`${apiUrl}/api/employees/${idsPath}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update options after successful delete
      const updatedData = get().employee_data;
      const divisions = [...new Set(updatedData.map((emp: Employee) => emp.div_name).filter(Boolean))]
        .map((div) => ({ value: div, label: div }));
      const departments = [...new Set(updatedData.map((emp: Employee) => emp.dept_dat).filter(Boolean))]
        .map((dept) => ({ value: dept, label: dept }));
      const teams = [...new Set(updatedData.map((emp: Employee) => emp.team).filter(Boolean))]
        .map((team) => ({ value: team, label: team }));
      const roles = [...new Set(updatedData.map((emp: Employee) => emp.role).filter(Boolean))]
        .map((role) => ({ value: role, label: role }));

      set(() => ({
        division_options: divisions,
        department_options: departments,
        team_options: teams,
        role_options: roles,
        isDeleting: false
      }));

    } catch (error) {
      console.error('Error bulk deleting employee data:', error);

      // Rollback to original state if the API fails
      set(() => ({
        employee_data: previousData,
        isDeleting: false
      }));
    }
  },

  // bulk create employee
  bulkCreate_EmployeeData: async (employees: Employee[]) => {
    const previousData = get().employee_data;


    // Create optimistic items with temporary IDs
    const optimisticEmployees = employees.map((emp, index) => ({
      id: `temp-${Date.now()}-${index}`,
      name: emp.name || '',
      email: emp.email || '',
      doorlog: emp.doorlog || null,
      position: emp.position || '',
      emp_status: emp.emp_status || 'active',
      status: 'default',
      is_core_personnel: emp.is_core_personnel || false,
      has_japan_business_trip: emp.has_japan_business_trip || false,
      noti_setting: emp.noti_setting !== undefined ? emp.noti_setting : true,
      div_name: emp.div_name || emp.div_name || '',
      dept_dir: null,
      dept_dat: emp.dept_dat || emp.dept_dat || '',
      team: emp.team || '',
      role: emp.role || '',
      dob: emp.dob || '',
      profile_photo_path: emp.profile_photo_path || '',
    }));


    // Optimistically add all employees to the UI
    set(() => ({
      employee_data: [...previousData, ...optimisticEmployees]
    }));

    try {
      // Map to the exact Employee interface fields
      const apiEmployees = employees.map(emp => {
        // Generate a valid email if not provided
        let email = emp.email?.trim() || '';
        if (!email && emp.name) {
          email = emp.name.toLowerCase().replace(/\s/g, '.') + '@diracetechnology.com';
        } else if (!email) {
          email = `employee${Date.now()}@company.com`;
        }

        return {
          id: emp.id?.trim() || emp.id?.trim() || '',
          name: emp.name?.trim() || '',
          email: email,
          doorlog: emp.doorlog?.trim() || emp.doorlog?.trim() || null,
          position: emp.position?.trim() || '',
          emp_status: emp.emp_status?.trim() || 'active',
          status: 'default',
          is_core_personnel: emp.is_core_personnel || false,
          has_japan_business_trip: emp.has_japan_business_trip || false,
          noti_setting: emp.noti_setting !== undefined ? emp.noti_setting : true,
          div_name: emp.div_name?.trim() || emp.div_name?.trim() || '',
          dept_dir: null,
          dept_dat: emp.dept_dat?.trim() || emp.dept_dat?.trim() || '',
          team: emp.team?.trim() || '',
          role: emp.role?.trim() || '',
          dob: emp.dob?.trim() || '',
          profile_photo_path: emp.profile_photo_path?.trim() || '',
        };
      });

      // Filter out invalid records before sending
      const validEmployees = apiEmployees.filter(emp => {
        // Check required fields
        if (!emp.id || !emp.name || !emp.email) {
          console.warn('⚠️ Skipping employee with missing required fields:', emp);
          return false;
        }
        return true;
      });

      if (validEmployees.length === 0) {
        throw new Error('No valid employees to insert');
      }


      // Get the auth token from localStorage or wherever it's stored
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';

      const response = await fetch(`${apiUrl}/api/employees/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(validEmployees),
      });

      if (!response.ok) {
        let errorMessage = '';
        try {
          const errorData = await response.text();
          errorMessage = errorData;
        } catch (e) {
          errorMessage = response.statusText;
        }

        console.error('❌ API Error:', errorMessage);

        // Handle specific status codes
        if (response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 400) {
          throw new Error(`Invalid data: ${errorMessage}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
        }
      }

      const result = await response.json();

      // Refresh the employee data
      await get().fetch_EmployeeData();

      // Update options
      const updatedData = get().employee_data;
      const divisions = [...new Set(updatedData.map((emp: Employee) => emp.div_name).filter(Boolean))]
        .map((div) => ({ value: div, label: div }));
      const departments = [...new Set(updatedData.map((emp: Employee) => emp.dept_dat).filter(Boolean))]
        .map((dept) => ({ value: dept, label: dept }));
      const teams = [...new Set(updatedData.map((emp: Employee) => emp.team).filter(Boolean))]
        .map((team) => ({ value: team, label: team }));
      const roles = [...new Set(updatedData.map((emp: Employee) => emp.role).filter(Boolean))]
        .map((role) => ({ value: role, label: role }));

      set(() => ({
        division_options: divisions,
        department_options: departments,
        team_options: teams,
        role_options: roles,
      }));

      return result;

    } catch (error) {
      set(() => ({
        employee_data: previousData
      }));
      throw error;
    }
  },
})