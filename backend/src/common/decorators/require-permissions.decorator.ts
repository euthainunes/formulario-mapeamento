import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../../auth/permissions.constants';

export const PERMISSIONS_KEY = 'requiredPermissions';

/** Exige que o usuário autenticado possua (ao menos) uma destas permissões. */
export const RequirePermissions = (...permissions: PermissionKey[]) => SetMetadata(PERMISSIONS_KEY, permissions);
