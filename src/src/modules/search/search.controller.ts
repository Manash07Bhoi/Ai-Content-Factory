import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../../common/decorators/public.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  q: string;
}

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.searchProducts(query.q);
  }
}
