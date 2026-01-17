import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { SyncSchedulerService } from './sync-scheduler.service';

@Module({
  controllers: [StoreController],
  providers: [StoreService, SyncSchedulerService],
  exports: [StoreService],
})
export class StoreModule {}
