import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Needed for Socket.io from different port
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
