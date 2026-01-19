import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { StoreModule } from './modules/store/store.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { ProfitModule } from './modules/profit/profit.module';
import { RefundModule } from './modules/refund/refund.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ExportModule } from './modules/export/export.module';
import { ProductMappingModule } from './modules/product-mapping/product-mapping.module';
import { ExternalApiModule } from './modules/external-api/external-api.module';
import { StockSyncModule } from './modules/stock-sync/stock-sync.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

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

    // Scheduler
    ScheduleModule.forRoot(),

    // Database
    DatabaseModule,

    // Cache (Redis)
    CacheModule,

    // Email
    EmailModule,

    // Feature Modules
    HealthModule,
    AuthModule,
    CompanyModule,
    StoreModule,
    InventoryModule,
    OrderModule,
    ProfitModule,
    RefundModule,
    PricingModule,
    ExportModule,
    ProductMappingModule,
    ExternalApiModule,
    StockSyncModule,
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
    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
