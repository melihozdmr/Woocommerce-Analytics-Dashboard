import { Module } from '@nestjs/common';
import { StockSyncService } from './stock-sync.service';
import { StockSyncController } from './stock-sync.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StockSyncController],
  providers: [StockSyncService],
  exports: [StockSyncService],
})
export class StockSyncModule {}
