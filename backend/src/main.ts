import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3001;
  const frontendUrl = configService.get<string>('frontendUrl');
  const nodeEnv = configService.get<string>('nodeEnv');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
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

  // Swagger API Documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WooCommerce Analytics API')
      .setDescription('API documentation for WooCommerce Analytics Dashboard')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Stores', 'Store management endpoints')
      .addTag('Analytics', 'Analytics endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`Swagger documentation available at /api/docs`);
  }

  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap();
