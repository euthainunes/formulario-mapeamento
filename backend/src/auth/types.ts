import { PermissionKey } from './permissions.constants';

/** Payload assinado no JWT do próprio SaaS (não confundir com o token da BeeHome). */
export interface JwtPayload {
  sub: string; // userId
  tenantId: string;
  email: string;
  permissions: PermissionKey[];
}

/** Formato de req.user após passar pela JwtStrategy. */
export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  email: string;
  permissions: PermissionKey[];
}
