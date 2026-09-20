export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
