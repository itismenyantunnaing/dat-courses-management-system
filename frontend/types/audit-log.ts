export interface AuditLog {
  id: number;
  employeeId: string;
  employeeName: string | null;
  employeeRole: string | null;
  employeeProfilePhotoPath: string | null;
  action: string;
  module: string;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  ipAddress: string;
  createdAt: string;
}