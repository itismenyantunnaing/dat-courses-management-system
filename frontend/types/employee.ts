export interface Employee {
  sr: number;
  id: string;
  name: string;
  email: string;
  doorlog: string;
  
  status: string;
  is_admin: boolean;
  is_core_personnel: boolean;
  has_japan_business_trip: boolean;

  noti_setting: string;
  
  div: string;
  dept_dir: string;
  dept_dat: string;
  
  team: string;
  role: string;
  
  position: string | null;

}