import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionKey } from '../../auth/permissions.constants';
import { AuthenticatedUser } from '../../auth/types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) throw new ForbiddenException('Usuário não autenticado');

    // Não há coringa "*": o papel administradora recebe a lista completa de
    // PERMISSION_KEYS explicitamente no seed (ver auth/permissions.constants.ts).
    const has = required.some((p) => user.permissions.includes(p));
    if (!has) {
      throw new ForbiddenException(`Permissão insuficiente. Requer uma de: ${required.join(', ')}`);
    }
    return true;
  }
}
