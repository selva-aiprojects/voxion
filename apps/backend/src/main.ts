import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Global Request Logger
  app.use((req, res, next) => {
    console.log(`📡 [HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
