import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class GeneratePromptsDto {
  @ApiProperty({ example: 'Sci-Fi Cyberpunk Settings', description: 'The topic for the AI to generate prompts for' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({ example: 5, description: 'Number of prompts to generate' })
  @IsNumber()
  @Min(1)
  @Max(20)
  count: number;
}

@ApiTags('Prompts')
@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post('generate')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate a new batch of AI Prompts asynchronously' })
  async generatePrompts(@Body() dto: GeneratePromptsDto) {
    return this.promptsService.generatePrompts(dto.topic, dto.count);
  }

  @Get('batch/:batchId')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all generated prompts by batch ID' })
  async getBatch(@Param('batchId') batchId: string) {
    return this.promptsService.getBatch(batchId);
  }
}
