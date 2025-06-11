import { AllExceptionsFilter } from '@filters/all-exceptions.filter';
import { HttpExceptionFilter } from '@filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Enable CORS
  app.enableCors();

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('API Documentation Gender Health Care Service')
    .setDescription('API documentation for the project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3333);

  async function bootstrap() {
    dotenv.config(); // Tải biến môi trường
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
  }

}
bootstrap();
