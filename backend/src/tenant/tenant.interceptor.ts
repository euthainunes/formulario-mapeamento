import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

/**
 * Garante que toda requisição autenticada rode dentro do contexto do seu
 * tenant (extraído do JWT em req.user.tenantId, ver JwtStrategy). Rotas
 * públicas (sem req.user) passam adiante sem contexto de tenant.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.tenantContext.run(tenantId, () => {
        next.handle().subscribe({
          next: (v) => subscriber.next(v),
          error: (e) => subscriber.error(e),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
