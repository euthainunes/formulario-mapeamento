import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './create-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await configureApp(app);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend rodando em http://localhost:${port} (docs em /docs)`);
}
bootstrap();
