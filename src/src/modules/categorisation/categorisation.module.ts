import { Module } from '@nestjs/common';
import { CategorisationService } from './categorisation.service';

@Module({
  providers: [CategorisationService],
  exports: [CategorisationService],
})
export class CategorisationModule {}
