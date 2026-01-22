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
      .setTitle('Klue Studio API')
      .setDescription(
        `API documentation for Klue Studio.

## Authentication

### Dashboard API (JWT)
Dashboard endpoints use JWT Bearer authentication. Login via \`/api/auth/login\` to get a token.

### External API (API Key)
External API v1 endpoints (\`/api/v1/*\`) use API Key authentication.
- Header: \`X-API-Key: wca_your_api_key\`
- Or: \`Authorization: Bearer wca_your_api_key\`

**Enterprise plan required for External API access.**

## Rate Limiting
External API has rate limiting: 100 requests per minute per API key.
Rate limit headers are included in responses:
- \`X-RateLimit-Limit\`: Maximum requests per window
- \`X-RateLimit-Remaining\`: Remaining requests in current window
- \`X-RateLimit-Reset\`: Unix timestamp when the window resets
`,
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key for External API (Enterprise plan required)',
        },
        'api-key',
      )
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Stores', 'Store management endpoints')
      .addTag('Analytics', 'Analytics endpoints')
      .addTag('API Key Management', 'Manage API keys for External API access')
      .addTag('External API v1', 'External API endpoints (requires API key)')
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
