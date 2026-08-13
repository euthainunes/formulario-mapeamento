import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_TARGET_KEY } from './audit.decorator';
import { AuditService } from './audit.service';

/**
 * Interceptor global: qualquer handler decorado com @Audit(targetType) tem
 * sua execução registrada em AuditLog, incluindo o corpo da requisição
 * (before, melhor esforço) e a resposta (after).
 *
 * Limitação conhecida (TODO): para updates, "before" idealmente deveria ser
 * o estado do registro ANTES da mutação (lido do banco), não o corpo da
 * requisição. Buscar esse snapshot genericamente exigiria mapear
 * targetType -> repositório, o que foi deixado como melhoria futura; hoje
 * `beforeJson` reflete o payload enviado pelo cliente.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const targetType = this.reflector.getAllAndOverride<string>(AUDIT_TARGET_KEY, [context.getHandler(), context.getClass()]);

    if (!targetType) return next.handle();

    const request = context.switchToHttp().getRequest();
    const actorId = request.user?.userId;
    const actorName = request.user?.email;
    const action = `${targetType}.${request.method.toLowerCase()}`;
    const targetId = request.params?.id;
    const beforeJson = request.body && Object.keys(request.body).length > 0 ? request.body : undefined;

    return next.handle().pipe(
      tap((result) => {
        this.auditService.record({
          actorId,
          actorName,
          action,
          targetType,
          targetId: targetId ?? result?.id,
          beforeJson,
          afterJson: result,
        });
      }),
    );
  }
}
