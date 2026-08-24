import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

/**
 * Configuração compartilhada entre o servidor Node tradicional (main.ts,
 * uso local) e o handler serverless (api/index.ts, uso na Vercel) — para as
 * duas formas de rodar o backend nunca divergirem em segurança/validação.
 */
export async function configureApp(app: INestApplication): Promise<void> {
  app.use(
    helmet({
      // CSP própria do helmet fica desligada porque o Swagger UI (/docs)
      // depende de script/style inline — sem isso a página de docs quebra.
      // As demais proteções (X-Frame-Options, X-Content-Type-Options, HSTS,
      // Referrer-Policy) continuam ativas com os padrões do helmet.
      contentSecurityPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // A comunicação real acontece servidor-a-servidor (Route Handler do Next.js
  // atuando como BFF -> este backend), então CORS não deveria ser exercitado
  // em produção. Mesmo assim, deixamos configurado corretamente para permitir
  // chamadas diretas (ex: Swagger UI, debugging manual) a partir da origem
  // do front-end.
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('BeeHome — Gestão da Comunicação + Inteligência da Intranet')
    .setDescription(
      'API do backend do SaaS. Autenticação própria via JWT (Bearer). ' +
        'Não confundir com o token da BeeHome usado internamente pelo SyncModule.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
