import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  app.enableCors({
    origin: process.env.ADMIN_FRONTEND_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4001);
}
bootstrap();
