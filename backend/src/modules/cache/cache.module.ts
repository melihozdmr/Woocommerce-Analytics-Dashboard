import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get<string>('redis.host') || 'localhost';
        const redisPort = config.get<number>('redis.port') || 6379;

        return {
          store: await redisStore({
            socket: {
              host: redisHost,
              port: redisPort,
            },
          }),
          ttl: 5 * 60 * 1000, // 5 minutes default TTL
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
