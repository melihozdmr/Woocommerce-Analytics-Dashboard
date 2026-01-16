import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl') || 60000,
          limit: config.get<number>('throttle.limit') || 100,
        },
      ],
    }),

    // Database
    DatabaseModule,

    // Feature Modules
    HealthModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
