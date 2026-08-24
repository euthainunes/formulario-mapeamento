import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/create-app';

/**
 * Entry point serverless (Vercel) — mesma configuração de src/main.ts, só
 * troca `app.listen(porta)` por expor o Express interno como handler de
 * função. A instância Nest é montada uma vez por execução "quente" da
 * função (cacheada no escopo do módulo) para não recriar o app a cada
 * requisição.
 */
const server = express();
let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await configureApp(app);
  await app.init();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!bootstrapped) bootstrapped = bootstrap();
  await bootstrapped;
  server(req, res);
}
