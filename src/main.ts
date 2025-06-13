import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'aws-sdk';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';

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
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(
        new AllExceptionsFilter(httpAdapter),
        new HttpExceptionFilter(),
    );
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
        .build();
    const documentFactory = () =>
        SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, documentFactory);

    // Setup AWS S3
    const configService = app.get(ConfigService);
    config.update({
        credentials: {
            accessKeyId: configService.get<string>(
                'appConfig.awsAccessKeyId',
            ) as string,
            secretAccessKey: configService.get<string>(
                'appConfig.awsSecretAccessKey',
            ) as string,
        },
        region: configService.get<string>('appConfig.awsRegion') as string,
    });

    await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
