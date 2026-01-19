import { Module, forwardRef } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { SyncSchedulerService } from './sync-scheduler.service';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [forwardRef(() => PricingModule)],
  controllers: [StoreController],
  providers: [StoreService, SyncSchedulerService],
  exports: [StoreService],
})
export class StoreModule {}
