import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

/**
 * Filtro global de exceções. Garante que nenhum detalhe sensível (tokens,
 * headers de Authorization, stack traces internos) vaze na resposta HTTP —
 * requisito explícito da spec para erros 401/403/500 vindos da BeeHome, mas
 * aplicado aqui de forma geral para qualquer erro do SaaS.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttp ? exception.getResponse() : { message: 'Erro interno' };

    this.logger.error(this.sanitize(exception));

    response.status(status).json(
      typeof payload === 'string'
        ? { statusCode: status, message: payload }
        : { statusCode: status, ...(payload as Record<string, unknown>) },
    );
  }

  private sanitize(exception: unknown): string {
    const raw = exception instanceof Error ? `${exception.message}\n${exception.stack ?? ''}` : String(exception);
    // Remove qualquer coisa que pareça um header Authorization/Bearer token.
    return raw.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]').replace(/authorization["']?\s*[:=]\s*["'][^"']+["']/gi, 'authorization: [REDACTED]');
  }
}
