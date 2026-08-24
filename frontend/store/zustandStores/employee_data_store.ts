// store/employee_data_store.ts
import { Employee_StoreType } from "../types"
import { Employee, EmployeeDepartmentPositionResponseDTO, EmployeeDepartmentPositionRequestDTO } from "@/types/employee";
import { logout } from "@/app/actions/auth"
import { getAuthToken } from "../mainStore";

type StoreSet = (
  fn: (state: Employee_StoreType) => Partial<Employee_StoreType>
) => void
type StoreGet = () => Employee_StoreType

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
  departmentDirOptions: [] as string[],
  isLoadingDepartmentDirOptions: false,

  employeeDepartmentPosition: null as EmployeeDepartmentPositionResponseDTO | null,
  isLoadingDepartmentPosition: false,
  isUpdatingDepartmentPosition: false,

  // Helper function to get token
  _getToken: () => {
    return getAuthToken();
  },


  fetch_roles: async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/roles`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/divisions`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/departments-dat`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/teams`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/divisions`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ divisionName: divisionName.trim() }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      const data = responseText ? JSON.parse(responseText) : null;

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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/departments-dat`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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

      const data = responseText ? JSON.parse(responseText) : null;

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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/teams`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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

      const data = responseText ? JSON.parse(responseText) : null;

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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/divisions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ divisionName: divisionName.trim() }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      const data = responseText ? JSON.parse(responseText) : null;

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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/departments-dat/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/teams/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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

      const data = responseText ? JSON.parse(responseText) : null;

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

  fetch_EmployeeData: async (force = false) => {
    // Skip fetch if employee_data already exists and not forced
    if (!force && get().employee_data.length > 0) {
      return;
    }
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/employees`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let employeeData = await response.json();

      const currentProfile = get().profile;

      if (currentProfile && currentProfile.role) {
        const userRole = currentProfile.role.toLowerCase();

        if (userRole === "approver") {
          const userTeam = currentProfile.team;
          if (userTeam) {
            employeeData = employeeData.filter(
              (employee: Employee) => employee.team === userTeam
            );
          } else {
            employeeData = [];
          }
        }

        if (userRole === "department_head") {
          const userDepartment = currentProfile.deptDat;
          if (userDepartment) {
            employeeData = employeeData.filter(
              (employee: Employee) => employee.dept_dat === userDepartment
            );
          } else {
            employeeData = [];
          }
        }

        if (userRole === "division_head") {
          const userDivision = currentProfile.divName;
          if (userDivision) {
            employeeData = employeeData.filter(
              (employee: Employee) => employee.div_name === userDivision
            );
          } else {
            employeeData = [];
          }
        }

      }

      set(() => ({ employee_data: employeeData }));

    } catch (error) {
      console.error('Error fetching employee data:', error);
      set(() => ({ employee_data: [] }));
    }
  },

  // Add employee 
  add_EmployeeData: async (newEmployee: Employee) => {
    const previousData = get().employee_data;

    const duplicateId = previousData.find(emp => emp.id === newEmployee.id);
    const duplicateEmail = previousData.find(emp => emp.email === newEmployee.email);
    const duplicateDoorlog = previousData.find(emp => emp.doorlog === newEmployee.doorlog);

    if (duplicateId) {
      return `Employee with ID "${newEmployee.id}" already exists.`;
    }

    if (duplicateEmail) {
      return `Employee with email "${newEmployee.email}" already exists.`;
    }

    if (duplicateDoorlog) {
      return `Employee with doorlog "${newEmployee.doorlog}" already exists.`;
    }

    const optimisticEmployee = {
      ...newEmployee,
      id: `temp-${Date.now()}`
    };

    set(() => ({
      employee_data: [...previousData, optimisticEmployee],
      isCreating: true
    }));

    try {
      const token = getAuthToken();

      const response = await fetch(`${apiUrl}/api/employees`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);

        if (response.status === 401) {
          await logout();
          return 'Session expired. Please login again.';
        }

        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      await response.json();

      await get().fetch_EmployeeData(true);
      set(() => ({ isCreating: false }));

      return `Employee created successfully`;

    } catch (error) {
      console.error('❌ Error creating employee:', error);

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

    const idsToDelete = Array.isArray(employeeIds) ? employeeIds : [employeeIds];
    const count = idsToDelete.length;

    set(() => ({
      employee_data: previousData.filter(emp => !idsToDelete.includes(emp.id)),
      isDeleting: true
    }));

    try {
      const token = getAuthToken();
      const idsPath = idsToDelete.join(',');

      const response = await fetch(`${apiUrl}/api/employees/${idsPath}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await logout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();

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

      const customMessage = count === 1
        ? `1 Employee deleted successfully`
        : `${count} Employees deleted successfully`;

      return customMessage;

    } catch (error) {
      console.error('Error deleting employee data:', error);

      set(() => ({
        employee_data: previousData,
        isDeleting: false
      }));

      return `Failed to delete ${count === 1 ? 'employee' : 'employees'}`;
    }
  },

  // Update employee
  update_EmployeeData: async (id: string, updatedEmployee: Employee) => {

    const previousData = get().employee_data;

    const existingEmployee = previousData.find(emp => emp.id === id);

    if (!existingEmployee) {
      return `Employee with ID "${id}" not found.`;
    }

    if (updatedEmployee.email && updatedEmployee.email !== existingEmployee.email) {
      const duplicateEmail = previousData.find(
        emp => emp.email === updatedEmployee.email && emp.id !== id
      );
      if (duplicateEmail) {
        return `Employee with email "${updatedEmployee.email}" already exists.`;
      }
    }

    if (updatedEmployee.doorlog && updatedEmployee.doorlog !== existingEmployee.doorlog) {
      const duplicateDoorlog = previousData.find(
        emp => emp.doorlog === updatedEmployee.doorlog && emp.id !== id
      );
      if (duplicateDoorlog) {
        return `Employee with doorlog "${updatedEmployee.doorlog}" already exists.`;
      }
    }

    const updatedData = previousData.map((emp) =>
      emp.id === id ? { ...emp, ...updatedEmployee } : emp
    );

    set(() => ({
      employee_data: updatedData,
      isUpdating: true
    }));

    try {
      const token = getAuthToken();

      const response = await fetch(`${apiUrl}/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEmployee),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);

        if (response.status === 401) {
          await logout();
          return 'Session expired. Please login again.';
        }

        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseData = await response.json();

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

    set(() => ({
      employee_data: previousData.filter(emp => !employeeIds.includes(emp.id)),
      isDeleting: true
    }));

    try {
      const token = getAuthToken();
      const idsPath = employeeIds.join(',');

      const response = await fetch(`${apiUrl}/api/employees/${idsPath}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await logout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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

      set(() => ({
        employee_data: previousData,
        isDeleting: false
      }));
    }
  },

  // bulk create employee
  bulkCreate_EmployeeData: async (employees: Employee[]) => {
    const previousData = get().employee_data;

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

    set(() => ({
      employee_data: [...previousData, ...optimisticEmployees]
    }));

    try {
      const apiEmployees = employees.map(emp => {
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

      const validEmployees = apiEmployees.filter(emp => {
        if (!emp.id || !emp.name || !emp.email) {
          console.warn('⚠️ Skipping employee with missing required fields:', emp);
          return false;
        }
        return true;
      });

      if (validEmployees.length === 0) {
        throw new Error('No valid employees to insert');
      }

      const token = getAuthToken();

      const response = await fetch(`${apiUrl}/api/employees/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
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

        if (response.status === 401) {
          await logout();
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 400) {
          throw new Error(`Invalid data: ${errorMessage}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
        }
      }

      const result = await response.json();

      await get().fetch_EmployeeData(true);

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

  // GET /api/employees/{employeeId}/department-position - Fetch employee department and position
  fetchEmployeeDepartmentPosition: async (employeeId: string) => {
    set((state: Employee_StoreType) => ({
      ...state,
      isLoadingDepartmentPosition: true,
      employeeDepartmentPosition: null
    }))

    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/employees/${employeeId}/department-position`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Employee not found or no department position set
          set((state: Employee_StoreType) => ({
            ...state,
            isLoadingDepartmentPosition: false,
            employeeDepartmentPosition: null
          }))
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      set((state: Employee_StoreType) => ({
        ...state,
        isLoadingDepartmentPosition: false,
        employeeDepartmentPosition: data
      }))

      return data

    } catch (error) {
      console.error('❌ Error fetching employee department position:', error)
      set((state: Employee_StoreType) => ({
        ...state,
        isLoadingDepartmentPosition: false,
        employeeDepartmentPosition: null
      }))
      return null
    }
  },

  // PUT /api/employees/department-position - Update employee department and position
  updateEmployeeDepartmentPosition: async (request: EmployeeDepartmentPositionRequestDTO) => {
    set((state: Employee_StoreType) => ({
      ...state,
      isUpdatingDepartmentPosition: true
    }))

    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/employees/department-position`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          errorMessage = errorData || errorMessage
        } catch (e) {
          errorMessage = response.statusText || errorMessage
        }

        set((state: Employee_StoreType) => ({
          ...state,
          isUpdatingDepartmentPosition: false
        }))

        return {
          success: false,
          message: errorMessage,
          data: null
        }
      }

      const data = await response.json()

      set((state: Employee_StoreType) => ({
        ...state,
        isUpdatingDepartmentPosition: false,
        employeeDepartmentPosition: data
      }))

      return {
        success: true,
        message: 'Department and position updated successfully',
        data: data
      }

    } catch (error) {
      console.error('❌ Error updating employee department position:', error)
      set((state: Employee_StoreType) => ({
        ...state,
        isUpdatingDepartmentPosition: false
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update department and position',
        data: null
      }
    }
  },

  // PUT /api/employees/department-position/bulk - Bulk update employee department/position/core-personnel/Japan-trip
  bulkUpdateEmployeeDepartmentPosition: async (requests: EmployeeDepartmentPositionRequestDTO[]) => {
    if (!requests || requests.length === 0) {
      return {
        success: true,
        message: 'No department updates to process',
        data: [] as EmployeeDepartmentPositionResponseDTO[]
      }
    }

    set((state: Employee_StoreType) => ({
      ...state,
      isUpdatingDepartmentPosition: true
    }))

    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/employees/department-position/bulk`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requests),
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          errorMessage = errorData || errorMessage
        } catch (e) {
          errorMessage = response.statusText || errorMessage
        }

        if (response.status === 401) {
          await logout()
        }

        set((state: Employee_StoreType) => ({
          ...state,
          isUpdatingDepartmentPosition: false
        }))

        return {
          success: false,
          message: errorMessage,
          data: [] as EmployeeDepartmentPositionResponseDTO[]
        }
      }

      const data: EmployeeDepartmentPositionResponseDTO[] = await response.json()

      set((state: Employee_StoreType) => ({
        ...state,
        isUpdatingDepartmentPosition: false
      }))

      return {
        success: true,
        message: `${data.length} department/position record(s) updated successfully`,
        data: data
      }

    } catch (error) {
      console.error('❌ Error bulk updating employee department position:', error)
      set((state: Employee_StoreType) => ({
        ...state,
        isUpdatingDepartmentPosition: false
      }))

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to bulk update department and position',
        data: [] as EmployeeDepartmentPositionResponseDTO[]
      }
    }
  },

  // GET /api/employees/dir-departments - Fetch all department directory names
  fetchDepartmentDirOptions: async () => {
    // Skip if already loaded
    if (get().departmentDirOptions.length > 0) {
      return
    }

    set((state: Employee_StoreType) => ({
      ...state,
      isLoadingDepartmentDirOptions: true
    }))

    try {
      const token = getAuthToken()
      const response = await fetch(`${apiUrl}/api/employees/dir-departments`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      set((state: Employee_StoreType) => ({
        ...state,
        departmentDirOptions: data || [],
        isLoadingDepartmentDirOptions: false
      }))

      return data

    } catch (error) {
      console.error('❌ Error fetching department directory options:', error)
      set((state: Employee_StoreType) => ({
        ...state,
        departmentDirOptions: [],
        isLoadingDepartmentDirOptions: false
      }))
      return []
    }
  },
  


  // Clear employee department position state
  clearEmployeeDepartmentPosition: () => {
    set((state: Employee_StoreType) => ({
      ...state,
      employeeDepartmentPosition: null,
      isLoadingDepartmentPosition: false,
      isUpdatingDepartmentPosition: false
    }))
  },
})