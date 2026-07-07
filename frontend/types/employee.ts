export interface Employee {
  id: string;
  name: string;
  email: string;
  doorlog: string | null;
  position: string;
  emp_status: string;
  status?: string;
  is_core_personnel: boolean;
  has_japan_business_trip: boolean;
  noti_setting: boolean;
  div_name: string;
  dept_dir: string | null;
  dept_dat: string;
  team: string;
  role: string;
  dob: string;
  profile_photo_path: string;
}

export interface Division {
  id: number;
  divisionName: string;
}