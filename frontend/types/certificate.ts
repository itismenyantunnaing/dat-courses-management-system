import type { Employee } from "./employee"

export const CERTIFICATE_TYPES = [
  'JLPT', 
  'NAT_TEST', 
  'TOP_J', 
  'BJT', 
] as const

export const CERTIFICATE_LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5'] as const

export type CertificateType = typeof CERTIFICATE_TYPES[number]
export type CertificateLevel = typeof CERTIFICATE_LEVELS[number]

export interface JapaneseCertificate {
  id: string
  employee?: Employee
  certificateType: CertificateType
  japaneseLevel: CertificateLevel 
  file?: File
  filePath?: string
  verificationStatus?: 'approved' | 'pending' | 'rejected'
  verifiedAt?: Date | null
  employeeId?: string
  employeeName?: string
  email?: string
  profilePhotoPath?: string
  teamName?: string
  verifiedByEmployeeId?: string | null
  verifiedByEmployeeName?: string | null
  verifiedByProfilePhotoPath?: string | null
  createdAt?: Date | null
  updatedAt?: Date
  remark?: string | null 
}
