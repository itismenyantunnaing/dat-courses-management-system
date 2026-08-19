export type AnnouncementCategory = 'COURSE' | 'EXAM' | 'OTHER';

export interface AnnouncementDto {
  id?: number;
  title: string;
  text: string;
  category: AnnouncementCategory;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}