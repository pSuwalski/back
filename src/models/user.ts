import { Company } from './company';

export interface User {
  email: string;
  name: string;
  unionName: string;
  unionId: string;
  companies?: Company[];
  phone?: string;
  id?: string;
  role?: 'basic' | 'companyAdmin' | 'editor' | 'admin';
}
