// store/employee_data_store.ts
import { Employee_StoreType } from "../types"
import { Employee } from "@/types/employee";


type StoreSet = (
  fn: (state: Employee_StoreType) => Partial<Employee_StoreType>
) => void
type StoreGet = () => Employee_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085';

// Helper functions to extract unique values
export const getUniqueDivisions = (employees: Employee[]) => {
  const divisions = employees.map((emp) => emp.div_name).filter(Boolean)
  return [...new Set(divisions)].map((div) => ({ value: div, label: div }))
}

export const getUniqueDepartments = (employees: Employee[]) => {
  const departments = employees.map((emp) => emp.dept_dat).filter(Boolean)
  return [...new Set(departments)].map((dept) => ({ value: dept, label: dept }))
}

export const getUniqueTeams = (employees: Employee[]) => {
  const teams = employees.map((emp) => emp.team).filter(Boolean)
  return [...new Set(teams)].map((team) => ({ value: team, label: team }))
}

export const getUniqueRoles = (employees: Employee[]) => {
  const roles = employees.map((emp) => emp.role).filter(Boolean)
  return [...new Set(roles)].map((role) => ({ value: role, label: role }))
}

export const employeeDataStore = (set: StoreSet, get: StoreGet) => ({
  employee_data: [],
  isCreating: false,
  isDeleting: false,
  isUpdating: false,

  // Dynamic options that will be populated from employee data
  division_options: [],
  department_options: [],
  team_options: [],
  role_options: [],

  fetch_EmployeeData: async () => {
    try {
      const response = await fetch(`${apiUrl}/api/employees`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const employeeData = await response.json();
      set(() => ({ employee_data: employeeData }));

      // Extract unique values for dropdowns
      const divisions = getUniqueDivisions(employeeData)
      const departments = getUniqueDepartments(employeeData)
      const teams = getUniqueTeams(employeeData)
      const roles = getUniqueRoles(employeeData)

      set(() => ({
        division_options: divisions,
        department_options: departments,
        team_options: teams,
        role_options: roles,
      }))
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
      const divisions = getUniqueDivisions(updatedData);
      const departments = getUniqueDepartments(updatedData);
      const teams = getUniqueTeams(updatedData);
      const roles = getUniqueRoles(updatedData);

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
      const divisions = getUniqueDivisions(finalData);
      const departments = getUniqueDepartments(finalData);
      const teams = getUniqueTeams(finalData);
      const roles = getUniqueRoles(finalData);

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
      const divisions = getUniqueDivisions(updatedData)
      const departments = getUniqueDepartments(updatedData)
      const teams = getUniqueTeams(updatedData)
      const roles = getUniqueRoles(updatedData)

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
          email = emp.name.toLowerCase().replace(/\s/g, '.') + '@company.com';
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
          status: null,
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
      const divisions = getUniqueDivisions(updatedData);
      const departments = getUniqueDepartments(updatedData);
      const teams = getUniqueTeams(updatedData);
      const roles = getUniqueRoles(updatedData);

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