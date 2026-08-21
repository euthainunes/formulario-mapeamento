import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend rodando em http://localhost:${port} (docs em /docs)`);
}
bootstrap();
