import { Module } from '@nestjs/common';
import { ProductMappingController } from './product-mapping.controller';
import { ProductMappingService } from './product-mapping.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductMappingController],
  providers: [ProductMappingService],
  exports: [ProductMappingService],
})
export class ProductMappingModule {}
