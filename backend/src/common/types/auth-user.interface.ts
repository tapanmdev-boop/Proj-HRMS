import { Role } from './role.enum';

/** The authenticated principal attached to `request.user` by JwtStrategy. Always loaded from the database, never trusted from the token. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
  firstName: string;
  lastName: string;
}
