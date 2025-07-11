import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { RedisIoAdapter } from './modules/chat/adapters/redis-io.adapter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );
    // Global filters
    app.useGlobalFilters(new HttpExceptionFilter());
    // WebSocket Adapter
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);

    // Security
    app.use(helmet());

    // Enable CORS
    app.enableCors();

    // Swagger Config
    const swaggerConfig = new DocumentBuilder()
        .setTitle('API Documentation Gender Health Care Service')
        .setDescription('API documentation for the project')
        .setVersion('1.0')
        .addBearerAuth()
        .addOAuth2()
        .build();
    const documentFactory = () =>
        SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, documentFactory, {
        jsonDocumentUrl: '/api/swagger.json',
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
