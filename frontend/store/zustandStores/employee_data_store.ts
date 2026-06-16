// store/employee_data_store.ts
import { Employee_StoreType } from "../types"
import { Employee } from "@/types/employee";

const employeeData = [
  {
    "sr": 1,
    "id": "1002",
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "doorlog": "JS002",
    "status": "inactive",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": false,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Software Development Dept",
    "team": "Development Team A",
    "role": "learner",
    "position": null
  },
  {
    "sr": 2,
    "id": "1003",
    "name": "Mike Johnson",
    "email": "mike.johnson@company.com",
    "doorlog": "MJ003",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": true,
    "div": "PROD",
    "dept_dir": "Product Division",
    "dept_dat": "Product Management Dept",
    "team": "Product Team A",
    "role": "approver",
    "position": null
  },
  {
    "sr": 3,
    "id": "1004",
    "name": "Sarah Wilson",
    "email": "sarah.wilson@company.com",
    "doorlog": "SW004",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": false,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Quality Assurance Dept",
    "team": "Development Team B",
    "role": "learner",
    "position": null
  },
  {
    "sr": 4,
    "id": "1005",
    "name": "David Brown",
    "email": "david.brown@company.com",
    "doorlog": "DB005",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": false,
    "div": "SALES",
    "dept_dir": "Sales Division",
    "dept_dat": "Regional Sales Dept",
    "team": "Sales Team A",
    "role": "learner",
    "position": null
  },
  {
    "sr": 5,
    "id": "1006",
    "name": "Emily Chen",
    "email": "emily.chen@company.com",
    "doorlog": "EC006",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": true,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Software Development Dept",
    "team": "Development Team A",
    "role": "approver",
    "position": null
  },
  {
    "sr": 6,
    "id": "1007",
    "name": "Robert Taylor",
    "email": "robert.taylor@company.com",
    "doorlog": "RT007",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": false,
    "div": "MKT",
    "dept_dir": "Marketing Division",
    "dept_dat": "Digital Marketing Dept",
    "team": "Marketing Team A",
    "role": "learner",
    "position": null
  },
  {
    "sr": 7,
    "id": "1008",
    "name": "Lisa Anderson",
    "email": "lisa.anderson@company.com",
    "doorlog": "LA008",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": false,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Infrastructure Dept",
    "team": "Development Team C",
    "role": "learner",
    "position": null
  },
  {
    "sr": 8,
    "id": "1009",
    "name": "James Martinez",
    "email": "james.martinez@company.com",
    "doorlog": "JM009",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": true,
    "div": "PROD",
    "dept_dir": "Product Division",
    "dept_dat": "Product Strategy Dept",
    "team": "Product Team B",
    "role": "approver",
    "position": null
  },
  {
    "sr": 9,
    "id": "1010",
    "name": "Maria Garcia",
    "email": "maria.garcia@company.com",
    "doorlog": "MG010",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": false,
    "div": "SALES",
    "dept_dir": "Sales Division",
    "dept_dat": "Account Management Dept",
    "team": "Sales Team B",
    "role": "learner",
    "position": null
  },
  {
    "sr": 10,
    "id": "1011",
    "name": "Thomas Anderson",
    "email": "thomas.anderson@company.com",
    "doorlog": "TA011",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": true,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Software Development Dept",
    "team": "Development Team A",
    "role": "admin",
    "position": null
  },
  {
    "sr": 11,
    "id": "1012",
    "name": "Jennifer Lee",
    "email": "jennifer.lee@company.com",
    "doorlog": "JL012",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": false,
    "div": "PROD",
    "dept_dir": "Product Division",
    "dept_dat": "Product Management Dept",
    "team": "Product Team A",
    "role": "learner",
    "position": null
  },
  {
    "sr": 12,
    "id": "1013",
    "name": "Michael Chang",
    "email": "michael.chang@company.com",
    "doorlog": "MC013",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": false,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Quality Assurance Dept",
    "team": "Development Team B",
    "role": "learner",
    "position": null
  },
  {
    "sr": 13,
    "id": "1014",
    "name": "Rachel Green",
    "email": "rachel.green@company.com",
    "doorlog": "RG014",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": true,
    "div": "MKT",
    "dept_dir": "Marketing Division",
    "dept_dat": "Digital Marketing Dept",
    "team": "Marketing Team B",
    "role": "learner",
    "position": null
  },
  {
    "sr": 14,
    "id": "1015",
    "name": "Daniel Kim",
    "email": "daniel.kim@company.com",
    "doorlog": "DK015",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": false,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Software Development Dept",
    "team": "Development Team A",
    "role": "approver",
    "position": null
  },
  {
    "sr": 15,
    "id": "1016",
    "name": "Sophia Martinez",
    "email": "sophia.martinez@company.com",
    "doorlog": "SM016",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": true,
    "div": "PROD",
    "dept_dir": "Product Division",
    "dept_dat": "Product Strategy Dept",
    "team": "Product Team B",
    "role": "learner",
    "position": null
  },
  {
    "sr": 16,
    "id": "1017",
    "name": "Oliver Wilson",
    "email": "oliver.wilson@company.com",
    "doorlog": "OW017",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": false,
    "div": "SALES",
    "dept_dir": "Sales Division",
    "dept_dat": "Regional Sales Dept",
    "team": "Sales Team A",
    "role": "learner",
    "position": null
  },
  {
    "sr": 17,
    "id": "1018",
    "name": "Emma Thompson",
    "email": "emma.thompson@company.com",
    "doorlog": "ET018",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": true,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Quality Assurance Dept",
    "team": "Development Team B",
    "role": "admin",
    "position": null
  },
  {
    "sr": 18,
    "id": "1019",
    "name": "William Parker",
    "email": "william.parker@company.com",
    "doorlog": "WP019",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": false,
    "div": "PROD",
    "dept_dir": "Product Division",
    "dept_dat": "Product Management Dept",
    "team": "Product Team A",
    "role": "approver",
    "position": null
  },
  {
    "sr": 19,
    "id": "1020",
    "name": "Olivia Brown",
    "email": "olivia.brown@company.com",
    "doorlog": "OB020",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": false,
    "has_japan_business_trip": false,
    "div": "MKT",
    "dept_dir": "Marketing Division",
    "dept_dat": "Digital Marketing Dept",
    "team": "Marketing Team A",
    "role": "learner",
    "position": null
  },
  {
    "sr": 20,
    "id": "1021",
    "name": "James Wilson",
    "email": "james.wilson@company.com",
    "doorlog": "JW021",
    "status": "active",
    "is_admin": false,
    "is_core_personnel": true,
    "has_japan_business_trip": true,
    "div": "ENG",
    "dept_dir": "Engineering Division",
    "dept_dat": "Infrastructure Dept",
    "team": "Development Team C",
    "role": "admin",
    "position": null
  }
];

type StoreSet = (
  fn: (state: Employee_StoreType) => Partial<Employee_StoreType>
) => void
type StoreGet = () => Employee_StoreType

// Helper functions to extract unique values
export const getUniqueDivisions = (employees: Employee[]) => {
  const divisions = employees.map((emp) => emp.div).filter(Boolean)
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

  // Dynamic options that will be populated from employee data
  division_options: [],
  department_options: [],
  team_options: [],
  role_options: [],

  fetch_EmployeeData: async () => {
    set(() => ({ employee_data: employeeData }))

    // Extract unique values for dropdowns
    const divisions = getUniqueDivisions(employeeData)
    const departments = getUniqueDepartments(employeeData)
    const teams = getUniqueTeams(employeeData)
    const roles = getUniqueRoles(employeeData)

    set((state) => ({
      ...state,
      division_options: divisions,
      department_options: departments,
      team_options: teams,
      role_options: roles,
    }))
  },
})